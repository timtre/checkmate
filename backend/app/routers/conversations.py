"""Conversations router: delete endpoints for conversations and related data."""

from fastapi import APIRouter

from app.services.tower_persistence import persistence

router = APIRouter(tags=["conversations"])


@router.delete("/properties/{property_id}/conversations/{conversation_id}")
def delete_conversation(property_id: str, conversation_id: str):
    """Delete a single conversation and all related data."""
    persistence.delete_conversation(conversation_id)
    return {"deleted": True}


@router.delete("/properties/{property_id}/conversations")
def delete_conversations(property_id: str, guest_name: str | None = None):
    """Delete conversations for a property. If guest_name provided, only that guest's data."""
    if guest_name:
        persistence.delete_conversations_by_guest(property_id, guest_name)
    else:
        persistence.delete_all_conversations(property_id)
    return {"deleted": True}
