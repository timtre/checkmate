"""Escalation service: create escalation events and handle PM replies."""

import uuid

from app.models.schemas import (
    Escalation,
    EscalationResponse,
    EscalationStatus,
    EvalVerdict,
    EvaluationResult,
)
from app.services.tower_persistence import persistence
from app.utils.email import send_escalation_email


def maybe_escalate(
    property_id: str,
    evaluation: EvaluationResult,
    guest_message: str,
    ai_answer: str,
    pm_email: str | None = None,
) -> str | None:
    """Create an escalation if the evaluation warrants it. Returns escalation_id or None."""
    if evaluation.verdict == EvalVerdict.OK:
        return None

    escalation_id = str(uuid.uuid4())

    # Persist escalation
    persistence.save_escalation(
        escalation_id=escalation_id,
        property_id=property_id,
        conversation_id=evaluation.conversation_id,
        message_id=evaluation.message_id,
        guest_message=guest_message,
        ai_answer=ai_answer,
        confidence=evaluation.confidence,
        reason=evaluation.verdict.value,
    )

    # Update the question pattern to reflect escalation
    from app.services.concierge import _normalize_question

    persistence.increment_question_pattern(
        property_id=property_id,
        question_pattern=_normalize_question(guest_message),
        confidence=evaluation.confidence,
        escalated=True,
    )

    # Send notification email (mock)
    send_escalation_email(
        to_email=pm_email or "pm@property.com",
        escalation_id=escalation_id,
        property_id=property_id,
        guest_message=guest_message,
        ai_answer=ai_answer,
        confidence=evaluation.confidence,
        reason=evaluation.verdict.value,
    )

    return escalation_id


def handle_pm_reply(
    escalation_id: str,
    reply_text: str,
    replied_by: str | None = None,
) -> EscalationResponse:
    """Inject a property manager's reply into the conversation thread."""
    escalation = persistence.get_escalation(escalation_id)
    if not escalation:
        raise ValueError(f"Escalation {escalation_id} not found")

    # Update escalation status
    persistence.update_escalation_reply(
        escalation_id=escalation_id,
        reply_text=reply_text,
        replied_by=replied_by or "property_manager",
    )

    # Inject PM reply as a message in the conversation
    message_id = str(uuid.uuid4())
    persistence.save_message(
        message_id=message_id,
        conversation_id=escalation["conversation_id"],
        property_id=escalation["property_id"],
        role="property_manager",
        content=reply_text,
        confidence=1.0,  # PM replies are authoritative
    )

    return EscalationResponse(
        escalation_id=escalation_id,
        status=EscalationStatus.REPLIED,
        conversation_id=escalation["conversation_id"],
        reply_injected=True,
    )
