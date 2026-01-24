"""Chat router: property-scoped AI concierge conversations."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    DocumentIngest,
    DocumentIngestResponse,
)
from app.services.concierge import generate_response
from app.services.escalation import maybe_escalate
from app.services.evaluation import evaluate_response
from app.services.knowledge_base import ingest_document
from app.services.tower_persistence import persistence

router = APIRouter(prefix="/properties/{property_id}", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(property_id: str, request: ChatRequest):
    """Send a guest message and receive an AI concierge response.

    The response includes the answer, confidence score, and sources.
    Automatic evaluation runs after each response; escalation is triggered
    if confidence is low or dissatisfaction is detected.
    """
    # Generate AI response
    response = generate_response(
        property_id=property_id,
        conversation_id=request.conversation_id or "",
        guest_message=request.message,
        guest_name=request.guest_name,
    )

    # Run automatic evaluation
    history = persistence.get_conversation_messages(response.conversation_id)
    evaluation = evaluate_response(
        property_id=property_id,
        chat_response=response,
        guest_message=request.message,
        conversation_history=history,
    )

    # Escalate if needed
    escalation_id = maybe_escalate(
        property_id=property_id,
        evaluation=evaluation,
        guest_message=request.message,
        ai_answer=response.answer,
    )

    if escalation_id:
        response.escalated = True

    return response


@router.post("/knowledge-base", response_model=DocumentIngestResponse)
def ingest_knowledge(property_id: str, document: DocumentIngest):
    """Ingest a document into the property's knowledge base.

    The document is chunked, embedded, and stored in Supabase pgvector
    for RAG retrieval during conversations.
    """
    document_id, chunks = ingest_document(
        property_id=property_id,
        title=document.title,
        content=document.content,
        category=document.category,
        metadata=document.metadata,
    )
    return DocumentIngestResponse(document_id=document_id, chunks_created=chunks)


@router.get("/conversations/{conversation_id}/messages")
def get_messages(property_id: str, conversation_id: str):
    """Retrieve all messages in a conversation thread."""
    messages = persistence.get_conversation_messages(conversation_id)
    if not messages:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation_id": conversation_id, "messages": messages}
