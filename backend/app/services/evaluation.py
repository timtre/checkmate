"""Evaluation service: records LLM escalation decisions for backward-compatible DB storage."""

from app.models.schemas import ChatResponse, EvalVerdict, EvaluationResult
from app.services.tower_persistence import persistence

# Map LLM escalate_reason → EvalVerdict for backward-compatible DB storage
_REASON_TO_VERDICT = {
    "dissatisfied": EvalVerdict.DISSATISFIED,
    "repeated_unanswered": EvalVerdict.REPEATED_QUESTION,
    "safety": EvalVerdict.LOW_CONFIDENCE,
    "access_blocked": EvalVerdict.LOW_CONFIDENCE,
    "maintenance_urgent": EvalVerdict.LOW_CONFIDENCE,
    "cannot_answer": EvalVerdict.LOW_CONFIDENCE,
    "other": EvalVerdict.LOW_CONFIDENCE,
}


def evaluate_response(
    property_id: str,
    chat_response: ChatResponse,
    guest_message: str,
    conversation_history: list[dict] | None = None,
) -> EvaluationResult:
    """Record the LLM's escalation decision as an evaluation result."""
    if chat_response.escalated:
        verdict = _REASON_TO_VERDICT.get(chat_response.escalate_reason, EvalVerdict.LOW_CONFIDENCE)
        reasons = [f"LLM escalation: {chat_response.escalate_reason}"]
    else:
        verdict = EvalVerdict.OK
        reasons = []

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
