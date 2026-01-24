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


SYSTEM_PROMPT = """You are a helpful property concierge assistant. You answer guest questions about the property using ONLY the provided context. If the context doesn't contain enough information to answer confidently, say so clearly.

Rules:
- Only answer based on the provided property context
- Be concise and friendly
- If unsure, express uncertainty rather than guessing
- Include specific details (codes, addresses, times) when available

After your answer, rate your confidence on a scale of 0.0 to 1.0 based on:
- How well the context covers the question
- How specific and complete your answer is
- Whether you had to infer or guess anything

Format your response as:
ANSWER: <your answer>
CONFIDENCE: <0.0 to 1.0>"""


def generate_response(
    property_id: str,
    conversation_id: str,
    guest_message: str,
    guest_name: str | None = None,
) -> ChatResponse:
    """Generate a concierge response using RAG + Tower LLM."""
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
        model=settings.tower_chat_model,
        messages=messages,
        max_tokens=1000,
    )
    raw_response = response.choices[0].message.content or ""

    # Parse response
    answer, confidence = _parse_response(raw_response)

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
        escalated=False,  # Updated later by evaluation
    )

    return ChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_message_id,
        answer=answer,
        confidence=confidence,
        sources=sources,
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


def _parse_response(raw: str) -> tuple[str, float]:
    """Parse the LLM response into answer and confidence score."""
    answer = raw
    confidence = 0.5  # default if parsing fails

    if "CONFIDENCE:" in raw:
        parts = raw.rsplit("CONFIDENCE:", 1)
        answer = parts[0].strip()
        try:
            confidence = float(parts[1].strip()[:4])
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, IndexError):
            pass

    if answer.startswith("ANSWER:"):
        answer = answer[7:].strip()

    return answer, confidence


def _normalize_question(question: str) -> str:
    """Normalize a question for pattern matching."""
    normalized = question.lower().strip().rstrip("?").strip()
    # Remove common filler words for better pattern matching
    fillers = ["hi", "hello", "hey", "please", "can you", "could you", "i want to know"]
    for filler in fillers:
        if normalized.startswith(filler):
            normalized = normalized[len(filler) :].strip()
    return normalized[:200]  # cap length
