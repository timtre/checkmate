"""AI Concierge service: generates answers using OpenAI + RAG context."""

import uuid

from openai import OpenAI

from app.config import settings
from app.models.schemas import ChatResponse, Source
from app.services.knowledge_base import retrieve_context
from app.services.tower_persistence import persistence

_openai_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


SYSTEM_PROMPT = """You are a helpful property concierge assistant. You answer guest questions about the property using the provided context. If the context doesn't contain enough information to answer confidently, say so clearly.

Rules:
- Answer based on the provided property context when relevant
- Be concise and friendly
- If unsure about property-specific details, express uncertainty rather than guessing
- Include specific details (codes, addresses, times) when available
- Respond naturally to greetings, small talk, and general conversation without requiring property context

Escalation guidelines — set ESCALATE to true ONLY for these priority cases:
1. safety — Gas leak, fire, flooding, injury, break-in, medical emergency
2. access_blocked — Locked out, wrong code, key missing, lockbox broken
3. maintenance_urgent — No hot water/electricity, plumbing leak, HVAC failure
4. dissatisfied — Explicit frustration with AI or guest asks for a human/manager
5. cannot_answer — Property-specific question not in knowledge base that materially affects the stay
6. repeated_unanswered — Same substantive question asked multiple times without resolution

Do NOT escalate for: greetings, small talk, thanks, questions you can answer, general chat.

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

    # Retrieve relevant context from knowledge base
    context_results = retrieve_context(property_id, guest_message)
    context_text = _format_context(context_results)

    # Build conversation history
    history = persistence.get_conversation_messages(conversation_id)
    messages = _build_messages(history, guest_message, context_text)

    # Call OpenAI
    response = _get_openai().chat.completions.create(
        model=settings.chat_model,
        messages=messages,
        max_completion_tokens=1000,
    )
    raw_response = response.choices[0].message.content or ""

    # Parse response
    answer, confidence, escalate, escalate_reason = _parse_response(raw_response)

    # Build sources
    sources = [
        Source(
            document_id=r["document_id"],
            title=r["title"],
            snippet=r["snippet"][:200],
            similarity=r["similarity"],
        )
        for r in context_results
    ]

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
    )

    # Track question pattern for insights
    persistence.increment_question_pattern(
        property_id=property_id,
        question_pattern=_normalize_question(guest_message),
        confidence=confidence,
        escalated=escalate,
    )

    return ChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_message_id,
        answer=answer,
        confidence=confidence,
        sources=sources,
        escalated=escalate,
        escalate_reason=escalate_reason,
    )


def _format_context(results: list[dict]) -> str:
    if not results:
        return "No relevant information found in the property knowledge base."
    parts = []
    for i, r in enumerate(results, 1):
        parts.append(f"[{i}] {r['title']}:\n{r['snippet']}")
    return "\n\n".join(parts)


def _build_messages(history: list[dict], current_message: str, context: str) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

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
