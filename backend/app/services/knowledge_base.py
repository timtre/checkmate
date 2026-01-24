"""Knowledge base service: stores and retrieves property documents for LLM context."""

import uuid

from app.config import settings

_supabase_client = None


def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client

        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def ingest_document(
    property_id: str,
    title: str,
    content: str,
    category: str | None = None,
    metadata: dict | None = None,
) -> tuple[str, int]:
    """Store a property document. Replaces any existing document for the property."""
    supabase = _get_supabase()

    # Remove existing document for this property
    supabase.table("knowledge_base").delete().eq("property_id", property_id).execute()

    # Insert the full document as a single row
    document_id = str(uuid.uuid4())
    supabase.table("knowledge_base").insert(
        {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "property_id": property_id,
            "title": title,
            "chunk_index": 0,
            "content": content,
            "category": category or "general",
            "metadata": metadata or {},
        }
    ).execute()

    return document_id, 1


def append_document(
    property_id: str,
    title: str,
    content: str,
    category: str | None = None,
    metadata: dict | None = None,
) -> tuple[str, int]:
    """Append a new document to the property's knowledge base without removing existing ones."""
    supabase = _get_supabase()
    document_id = str(uuid.uuid4())
    supabase.table("knowledge_base").insert(
        {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "property_id": property_id,
            "title": title,
            "chunk_index": 0,
            "content": content,
            "category": category or "general",
            "metadata": metadata or {},
        }
    ).execute()
    return document_id, 1


def retrieve_context(property_id: str, query: str) -> str:
    """Retrieve all property documents concatenated as LLM context."""
    supabase = _get_supabase()
    result = (
        supabase.table("knowledge_base")
        .select("title, content")
        .eq("property_id", property_id)
        .execute()
    )

    if not result.data:
        return ""
    parts = []
    for row in result.data:
        parts.append(f"## {row['title']}\n{row['content']}")
    return "\n\n".join(parts)


def list_documents(property_id: str) -> list[dict]:
    """List documents in a property's knowledge base."""
    supabase = _get_supabase()
    result = (
        supabase.table("knowledge_base")
        .select("document_id, title, category, content")
        .eq("property_id", property_id)
        .execute()
    )

    return [
        {
            "document_id": row["document_id"],
            "title": row["title"],
            "category": row["category"] or "general",
            "content": row["content"],
            "chunk_count": 1,
        }
        for row in (result.data or [])
    ]
