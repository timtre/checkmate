"""AI Concierge service: generates answers using OpenAI + RAG context."""

import uuid

import numpy as np
from openai import OpenAI
from supabase import create_client

from app.config import settings
from app.models.schemas import ChatResponse, Source, TowerInsight
from app.services.knowledge_base import retrieve_context
from app.services.tower_persistence import persistence

_openai_client = None
_supabase_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def _get_similar_patterns_from_tower(query_embedding: list[float], property_id: str) -> list[dict]:
    """Read pre-computed embeddings from Supabase and find similar patterns.

    This demonstrates AI agent data access: the concierge reads pre-computed
    features (computed by Tower job) during inference to calibrate response confidence.

    Returns patterns with historical confidence and escalation data.
    """
    try:
        supabase = _get_supabase()

        # Fetch pattern embeddings for this property
        result = (
            supabase.table("pattern_embeddings")
            .select("*")
            .eq("property_id", property_id)
            .execute()
        )

        if not result.data:
            return []

        # Compute cosine similarity
        query_vec = np.array(query_embedding)
        similarities = []
        for row in result.data:
            embedding = row.get("embedding")
            if not embedding:
                continue
            pattern_vec = np.array(embedding)
            similarity = np.dot(query_vec, pattern_vec) / (
                np.linalg.norm(query_vec) * np.linalg.norm(pattern_vec) + 1e-8
            )
            similarities.append(
                {
                    "pattern_id": row["pattern_id"],
                    "question_pattern": row["question_pattern"],
                    "count": row["count"],
                    "avg_confidence": row["avg_confidence"],
                    "escalation_count": row["escalation_count"],
                    "similarity": float(similarity),
                }
            )

        # Return top 3 most similar patterns
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities[:3]

    except Exception as e:
        # Fail gracefully: table may not have data yet
        print(f"Pattern embedding lookup failed (non-fatal): {e}")
        return []


def _get_query_embedding(query: str) -> list[float]:
    """Get embedding for a query string."""
    response = _get_openai().embeddings.create(model="text-embedding-3-small", input=query)
    return response.data[0].embedding


SYSTEM_PROMPT = """You are a warm, attentive property concierge who genuinely cares about each guest's experience. You answer guest questions about the property using the provided context. If the context doesn't contain enough information to answer confidently, say so honestly.

Tone & personality:
- Be empathetic: acknowledge the guest's situation before jumping to answers
- Use light, natural humor where appropriate (never forced or over-the-top)
- Keep responses concise but warm, like a friendly host, not a manual
- Make guests feel welcome and looked after, not like they're talking to a bot
- Avoid using em dashes or long hyphens. Use commas, periods, colons, or separate sentences instead

Rules:
- Answer based on the provided property context when relevant
- If unsure about property-specific details, express uncertainty rather than guessing
- Include specific details (codes, addresses, times) when available
- Respond naturally to greetings, small talk, and general conversation without requiring property context

Escalation guidelines: set ESCALATE to true ONLY for these priority cases:
1. safety: Gas leak, fire, flooding, injury, break-in, medical emergency
2. access_blocked: Locked out, wrong code, key missing, lockbox broken
3. maintenance_urgent: No hot water/electricity, plumbing leak, HVAC failure
4. dissatisfied: Explicit frustration with AI or guest asks for a human/manager
5. cannot_answer: Property-specific question not in knowledge base that materially affects the stay
6. repeated_unanswered: Same substantive question asked multiple times without resolution

Do NOT escalate for: greetings, small talk, thanks, questions you can answer, general chat.

When you set ESCALATE to true, end your answer by letting the guest know that a property manager has been informed and will get back to them shortly. Keep it brief and reassuring.

After your answer, rate your confidence on a scale of 0.0 to 1.0 based on:
- How well the context covers the question
- How specific and complete your answer is
- Whether you had to infer or guess anything

Format your response as:
ANSWER: <your answer>
CONFIDENCE: <0.0 to 1.0>
ESCALATE: <true or false>
ESCALATE_REASON: <none|safety|access_blocked|maintenance_urgent|dissatisfied|cannot_answer|repeated_unanswered>"""


def generate_response(
    property_id: str,
    conversation_id: str,
    guest_message: str,
    guest_name: str | None = None,
) -> ChatResponse:
    """Generate a concierge response using RAG + OpenAI LLM."""
    # Create conversation if new
    if not conversation_id:
        conversation_id = persistence.create_conversation(property_id, guest_name)

    # Save guest message
    guest_message_id = str(uuid.uuid4())
    persistence.save_message(
        message_id=guest_message_id,
        conversation_id=conversation_id,
        property_id=property_id,
        role="guest",
        content=guest_message,
    )

    # Retrieve property document for context
    context_text = retrieve_context(property_id, guest_message)
    if not context_text:
        context_text = "No property information available."

    # Fetch similar patterns from Tower Iceberg table (for confidence calibration)
    tower_patterns: list[dict] = []
    try:
        query_embedding = _get_query_embedding(guest_message)
        tower_patterns = _get_similar_patterns_from_tower(query_embedding, property_id)
        if tower_patterns:
            print(f"Tower: Found {len(tower_patterns)} similar patterns for confidence calibration")
    except Exception as e:
        print(f"Tower lookup skipped (non-fatal): {e}")

    # Build conversation history
    history = persistence.get_conversation_messages(conversation_id)
    messages = _build_messages(property_id, history, guest_message, context_text, tower_patterns)

    # Call OpenAI
    response = _get_openai().chat.completions.create(
        model=settings.chat_model,
        messages=messages,
        max_completion_tokens=1000,
    )
    raw_response = response.choices[0].message.content or ""

    # Parse response
    answer, confidence, escalate, escalate_reason = _parse_response(raw_response)

    sources: list[Source] = []

    # Save assistant message
    assistant_message_id = str(uuid.uuid4())
    persistence.save_message(
        message_id=assistant_message_id,
        conversation_id=conversation_id,
        property_id=property_id,
        role="assistant",
        content=answer,
        confidence=confidence,
        sources=[s.model_dump() for s in sources],
        escalated=escalate,
    )

    # Track question pattern for insights
    persistence.increment_question_pattern(
        property_id=property_id,
        question_pattern=_normalize_question(guest_message),
        confidence=confidence,
        escalated=escalate,
    )

    # Convert tower patterns to TowerInsight objects for response
    tower_insights = [
        TowerInsight(
            question_pattern=p["question_pattern"],
            similarity=round(p["similarity"], 3),
            historical_confidence=round(p["avg_confidence"], 3),
            escalation_count=p["escalation_count"],
        )
        for p in tower_patterns
        if p.get("similarity", 0) > 0.5  # Only include reasonably similar patterns
    ]

    return ChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_message_id,
        answer=answer,
        confidence=confidence,
        sources=sources,
        escalated=escalate,
        escalate_reason=escalate_reason,
        tower_insights=tower_insights,
    )


def _build_dynamic_prompt(property_id: str, tower_patterns: list[dict] | None = None) -> str:
    """Build system prompt augmented with known knowledge gaps for this property.

    Args:
        property_id: The property ID
        tower_patterns: Optional list of similar patterns from Tower Iceberg table,
            containing historical confidence and escalation data
    """
    prompt = SYSTEM_PROMPT

    # Add Tower pattern insights if available (from Iceberg table)
    if tower_patterns:
        similar_with_low_confidence = [
            p
            for p in tower_patterns
            if p.get("similarity", 0) > 0.7 and p.get("avg_confidence", 1.0) < 0.6
        ]
        if similar_with_low_confidence:
            pattern_lines = "\n".join(
                f"- \"{p['question_pattern']}\" (historical confidence: {p['avg_confidence']:.0%}, "
                f"escalated {p['escalation_count']} times)"
                for p in similar_with_low_confidence
            )
            prompt += (
                "\n\nTower Analytics: Similar questions have historically had low confidence. "
                "Be extra careful with these topics:\n"
                f"{pattern_lines}\n"
                "Consider escalating if you cannot provide a confident answer."
            )

    # Also include Supabase-based gaps (fallback if Tower not available)
    worst = persistence.get_worst_answered(property_id, limit=5)
    gaps = [p for p in worst if p["avg_confidence"] < 0.5 and p["count"] >= 2]

    if gaps:
        gap_lines = "\n".join(
            f"- \"{p['question_pattern']}\" (avg confidence: {p['avg_confidence']:.2f}, "
            f"asked {p['count']} times)"
            for p in gaps
        )
        prompt += (
            "\n\nKnown knowledge gaps for this property (topics the knowledge base "
            "does not cover well):\n"
            f"{gap_lines}\n"
            "For these topics, do NOT guess or fabricate answers. Instead, acknowledge "
            "the gap honestly and escalate to the property manager."
        )

    return prompt


def _build_messages(
    property_id: str,
    history: list[dict],
    current_message: str,
    context: str,
    tower_patterns: list[dict] | None = None,
) -> list[dict]:
    messages = [{"role": "system", "content": _build_dynamic_prompt(property_id, tower_patterns)}]

    # Add recent history (last 10 messages for context window)
    for msg in history[-10:]:
        role = "user" if msg["role"] == "guest" else "assistant"
        messages.append({"role": role, "content": msg["content"]})

    # Add current message with context
    user_content = f"""Property Context:
{context}

Guest Question: {current_message}"""
    messages.append({"role": "user", "content": user_content})
    return messages


def _parse_response(raw: str) -> tuple[str, float, bool, str]:
    """Parse the LLM response into answer, confidence, escalate flag, and reason."""
    answer = raw
    confidence = 0.5  # default if parsing fails
    escalate = False
    escalate_reason = "none"

    # Extract ESCALATE_REASON first (must come before ESCALATE extraction)
    if "ESCALATE_REASON:" in raw:
        parts = raw.rsplit("ESCALATE_REASON:", 1)
        raw = parts[0].strip()
        reason_value = parts[1].strip().split()[0].lower() if parts[1].strip() else "none"
        valid_reasons = {
            "none",
            "safety",
            "access_blocked",
            "maintenance_urgent",
            "dissatisfied",
            "cannot_answer",
            "repeated_unanswered",
        }
        if reason_value in valid_reasons:
            escalate_reason = reason_value

    # Extract ESCALATE flag
    if "ESCALATE:" in raw:
        parts = raw.rsplit("ESCALATE:", 1)
        raw = parts[0].strip()
        escalate_value = parts[1].strip().split()[0].lower() if parts[1].strip() else "false"
        escalate = escalate_value == "true"

    # Extract CONFIDENCE
    if "CONFIDENCE:" in raw:
        parts = raw.rsplit("CONFIDENCE:", 1)
        answer = parts[0].strip()
        try:
            confidence = float(parts[1].strip()[:4])
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, IndexError):
            pass
    else:
        answer = raw

    if answer.startswith("ANSWER:"):
        answer = answer[7:].strip()

    return answer, confidence, escalate, escalate_reason


def _normalize_question(question: str) -> str:
    """Normalize a question for pattern matching."""
    normalized = question.lower().strip().rstrip("?").strip()
    # Remove common filler words for better pattern matching
    fillers = ["hi", "hello", "hey", "please", "can you", "could you", "i want to know"]
    for filler in fillers:
        if normalized.startswith(filler):
            normalized = normalized[len(filler) :].strip()
    return normalized[:200]  # cap length
