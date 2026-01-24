"""Automatic evaluation service: detects low confidence and dissatisfaction."""

import uuid

from app.config import settings
from app.models.schemas import ChatResponse, EvalVerdict, EvaluationResult
from app.services.tower_persistence import persistence

# Signals that suggest guest dissatisfaction
DISSATISFACTION_SIGNALS = [
    "that doesn't help",
    "that's wrong",
    "not what i asked",
    "incorrect",
    "useless",
    "speak to someone",
    "talk to a human",
    "manager",
    "not helpful",
    "i already tried",
    "you already said",
    "you said that",
]


def evaluate_response(
    property_id: str,
    chat_response: ChatResponse,
    guest_message: str,
    conversation_history: list[dict] | None = None,
) -> EvaluationResult:
    """Run automatic evaluation on a concierge response.

    Checks for:
    1. Low confidence score (below threshold)
    2. Dissatisfaction signals in guest message
    3. Repeated questions (same question asked again in conversation)
    """
    reasons = []
    verdict = EvalVerdict.OK

    # Check 1: Low confidence
    if chat_response.confidence < settings.confidence_threshold:
        reasons.append(
            f"Confidence {chat_response.confidence:.2f} below threshold {settings.confidence_threshold}"
        )
        verdict = EvalVerdict.LOW_CONFIDENCE

    # Check 2: Dissatisfaction signals in the guest's message
    message_lower = guest_message.lower()
    for signal in DISSATISFACTION_SIGNALS:
        if signal in message_lower:
            reasons.append(f"Dissatisfaction signal detected: '{signal}'")
            verdict = EvalVerdict.DISSATISFIED
            break

    # Check 3: Repeated question detection
    if conversation_history:
        if _is_repeated_question(guest_message, conversation_history):
            reasons.append("Guest repeated a previously asked question")
            if verdict == EvalVerdict.OK:
                verdict = EvalVerdict.REPEATED_QUESTION

    # Check 4: No sources found (knowledge gap)
    if not chat_response.sources:
        reasons.append("No knowledge base sources matched the query")
        if verdict == EvalVerdict.OK:
            verdict = EvalVerdict.LOW_CONFIDENCE

    evaluation = EvaluationResult(
        conversation_id=chat_response.conversation_id,
        message_id=chat_response.message_id,
        verdict=verdict,
        confidence=chat_response.confidence,
        reasons=reasons,
    )

    # Persist evaluation
    persistence.save_evaluation(
        evaluation_id=evaluation.evaluation_id,
        conversation_id=evaluation.conversation_id,
        message_id=evaluation.message_id,
        property_id=property_id,
        verdict=verdict.value,
        confidence=evaluation.confidence,
        reasons=reasons,
    )

    return evaluation


def _is_repeated_question(
    current_message: str, history: list[dict], similarity_threshold: float = 0.8
) -> bool:
    """Check if the current message is semantically similar to a previous guest message."""
    current_normalized = current_message.lower().strip()
    guest_messages = [
        msg["content"].lower().strip() for msg in history if msg.get("role") == "guest"
    ]

    for prev in guest_messages[:-1]:  # Exclude the current message if it's in history
        similarity = _simple_similarity(current_normalized, prev)
        if similarity > similarity_threshold:
            return True
    return False


def _simple_similarity(a: str, b: str) -> float:
    """Simple token overlap similarity (Jaccard-like). Fast heuristic."""
    tokens_a = set(a.split())
    tokens_b = set(b.split())
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    return len(intersection) / len(union)
