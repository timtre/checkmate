"""Knowledge base service: Supabase pgvector for RAG retrieval."""

import uuid

from openai import OpenAI

from app.config import settings

# Supabase client is initialized lazily
_supabase_client = None
_openai_client = None


def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client

        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def _get_openai():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def generate_embedding(text: str) -> list[float]:
    """Generate embedding vector for a text using OpenAI."""
    response = _get_openai().embeddings.create(
        model=settings.embedding_model,
        input=text,
    )
    return response.data[0].embedding


def ingest_document(
    property_id: str,
    title: str,
    content: str,
    category: str | None = None,
    metadata: dict | None = None,
    chunk_size: int = 500,
) -> tuple[str, int]:
    """Split document into chunks, embed each, store in Supabase pgvector."""
    supabase = _get_supabase()
    document_id = str(uuid.uuid4())
    chunks = _chunk_text(content, chunk_size)

    for i, chunk in enumerate(chunks):
        embedding = generate_embedding(chunk)
        supabase.table("knowledge_base").insert(
            {
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "property_id": property_id,
                "title": title,
                "chunk_index": i,
                "content": chunk,
                "category": category or "general",
                "metadata": metadata or {},
                "embedding": embedding,
            }
        ).execute()

    return document_id, len(chunks)


def retrieve_context(
    property_id: str,
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.3,
) -> list[dict]:
    """Retrieve relevant chunks from the knowledge base using vector similarity."""
    supabase = _get_supabase()
    query_embedding = generate_embedding(query)

    # Call the Supabase RPC function for vector similarity search
    result = supabase.rpc(
        "match_knowledge_base",
        {
            "query_embedding": query_embedding,
            "match_count": top_k,
            "filter_property_id": property_id,
            "similarity_threshold": similarity_threshold,
        },
    ).execute()

    return [
        {
            "document_id": row["document_id"],
            "title": row["title"],
            "snippet": row["content"],
            "similarity": row["similarity"],
        }
        for row in (result.data or [])
    ]


def _chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Split text into overlapping chunks by sentences."""
    sentences = text.replace("\n", " ").split(". ")
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        candidate = f"{current_chunk}. {sentence}" if current_chunk else sentence
        if len(candidate) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk = candidate

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks if chunks else [text]
