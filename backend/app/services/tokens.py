"""Token service: create and validate guest access tokens."""

import secrets
from datetime import datetime, timezone

from app.config import settings

_supabase_client = None


def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client

        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def create_token(property_id: str, guest_name: str) -> str:
    """Generate a unique token and store it in Supabase."""
    supabase = _get_supabase()
    token = secrets.token_urlsafe(16)
    supabase.table("guest_tokens").insert(
        {
            "token": token,
            "property_id": property_id,
            "guest_name": guest_name,
        }
    ).execute()
    return token


def validate_token(token: str) -> dict | None:
    """Validate a token and return property_id + guest_name, or None if invalid/expired."""
    supabase = _get_supabase()
    result = (
        supabase.table("guest_tokens")
        .select("property_id, guest_name, expires_at")
        .eq("token", token)
        .execute()
    )
    if not result.data:
        return None

    row = result.data[0]
    if row.get("expires_at"):
        expires = datetime.fromisoformat(row["expires_at"])
        if expires < datetime.now(timezone.utc):
            return None

    property_id = row["property_id"]
    guest_name = row.get("guest_name")

    # Find the most recent conversation for this guest/property pair
    conversation_id = None
    if guest_name:
        conv_result = (
            supabase.table("conversations")
            .select("conversation_id")
            .eq("property_id", property_id)
            .eq("guest_name", guest_name)
            .order("last_message_at", desc=True)
            .limit(1)
            .execute()
        )
        if conv_result.data:
            conversation_id = conv_result.data[0]["conversation_id"]

    return {
        "property_id": property_id,
        "guest_name": guest_name,
        "conversation_id": conversation_id,
    }
