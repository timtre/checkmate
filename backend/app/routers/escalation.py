"""Escalation router: manage escalations and PM replies."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import EscalationReply, EscalationResponse
from app.services.escalation import handle_pm_reply
from app.services.tower_persistence import persistence

router = APIRouter(tags=["escalation"])


@router.get("/properties/{property_id}/escalations")
def list_escalations(property_id: str, status: str | None = None):
    """List all escalations for a property, optionally filtered by status."""
    escalations = persistence.get_property_escalations(property_id)
    if status:
        escalations = [e for e in escalations if e.get("status") == status]
    return {"property_id": property_id, "escalations": escalations}


@router.get("/escalations/{escalation_id}")
def get_escalation(escalation_id: str):
    """Get details of a specific escalation."""
    escalation = persistence.get_escalation(escalation_id)
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return escalation


@router.post("/escalations/{escalation_id}/reply", response_model=EscalationResponse)
def reply_to_escalation(escalation_id: str, reply: EscalationReply):
    """Inject a property manager's reply into the conversation thread.

    The reply is added as a message in the original conversation,
    allowing the guest to see the PM's response in context.
    """
    try:
        return handle_pm_reply(
            escalation_id=escalation_id,
            reply_text=reply.reply_text,
            replied_by=reply.replied_by,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
