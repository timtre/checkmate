"""Router for KB suggestion management (approve/dismiss drafted articles)."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import KBSuggestion, KBSuggestionApproveRequest
from app.services.knowledge_base import append_document
from app.services.tower_persistence import persistence

router = APIRouter(tags=["suggestions"])


@router.get("/properties/{property_id}/suggestions")
def list_suggestions(property_id: str, status: str = "pending"):
    suggestions = persistence.get_kb_suggestions(property_id, status=status)
    return {"property_id": property_id, "suggestions": suggestions}


@router.post("/suggestions/{suggestion_id}/approve")
def approve_suggestion(suggestion_id: str, body: KBSuggestionApproveRequest | None = None):
    suggestion = persistence.get_kb_suggestion(suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    title = body.title if body and body.title else suggestion["title"]
    content = body.content if body and body.content else suggestion["content"]
    category = body.category if body and body.category else suggestion["category"]

    # Append to knowledge base
    doc_id, _ = append_document(
        property_id=suggestion["property_id"],
        title=title,
        content=content,
        category=category,
        metadata={"source": "kb_suggestion", "suggestion_id": suggestion_id},
    )

    # Mark as approved
    persistence.update_kb_suggestion_status(
        suggestion_id, "approved", title=title, content=content, category=category
    )

    return {"suggestion_id": suggestion_id, "status": "approved", "document_id": doc_id}


@router.post("/suggestions/{suggestion_id}/dismiss")
def dismiss_suggestion(suggestion_id: str):
    suggestion = persistence.get_kb_suggestion(suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    persistence.update_kb_suggestion_status(suggestion_id, "dismissed")
    return {"suggestion_id": suggestion_id, "status": "dismissed"}
