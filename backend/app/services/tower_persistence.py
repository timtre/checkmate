"""Persistence service: read/write to Supabase tables."""

import json
import uuid
from datetime import datetime, timezone

from app.config import settings

_supabase_client = None


def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client

        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


class Persistence:
    """Manages all Supabase persistence operations for Checkmate."""

    # --- Conversations ---

    def create_conversation(self, property_id: str, guest_name: str | None = None) -> str:
        conversation_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        _get_supabase().table("conversations").insert(
            {
                "conversation_id": conversation_id,
                "property_id": property_id,
                "guest_name": guest_name or "Guest",
                "started_at": now,
                "last_message_at": now,
                "message_count": 0,
                "escalation_count": 0,
            }
        ).execute()
        return conversation_id

    def update_conversation_activity(self, conversation_id: str):
        _get_supabase().table("conversations").update(
            {"last_message_at": datetime.now(timezone.utc).isoformat()}
        ).eq("conversation_id", conversation_id).execute()

    def get_conversation_messages(self, conversation_id: str) -> list[dict]:
        result = (
            _get_supabase()
            .table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at")
            .execute()
        )
        return result.data or []

    # --- Messages ---

    def save_message(
        self,
        message_id: str,
        conversation_id: str,
        property_id: str,
        role: str,
        content: str,
        confidence: float = 0.0,
        sources: list[dict] | None = None,
    ):
        _get_supabase().table("messages").insert(
            {
                "message_id": message_id,
                "conversation_id": conversation_id,
                "property_id": property_id,
                "role": role,
                "content": content,
                "confidence": confidence,
                "sources_json": json.dumps(sources or []),
            }
        ).execute()

    # --- Evaluations ---

    def save_evaluation(
        self,
        evaluation_id: str,
        conversation_id: str,
        message_id: str,
        property_id: str,
        verdict: str,
        confidence: float,
        reasons: list[str],
        escalation_id: str | None = None,
    ):
        _get_supabase().table("evaluations").insert(
            {
                "evaluation_id": evaluation_id,
                "conversation_id": conversation_id,
                "message_id": message_id,
                "property_id": property_id,
                "verdict": verdict,
                "confidence": confidence,
                "reasons_json": json.dumps(reasons),
                "escalation_id": escalation_id or "",
            }
        ).execute()

    # --- Escalations ---

    def save_escalation(
        self,
        escalation_id: str,
        property_id: str,
        conversation_id: str,
        message_id: str,
        guest_message: str,
        ai_answer: str,
        confidence: float,
        reason: str,
    ):
        _get_supabase().table("escalations").insert(
            {
                "escalation_id": escalation_id,
                "property_id": property_id,
                "conversation_id": conversation_id,
                "message_id": message_id,
                "guest_message": guest_message,
                "ai_answer": ai_answer,
                "confidence": confidence,
                "reason": reason,
                "status": "open",
                "pm_reply": "",
                "replied_by": "",
            }
        ).execute()

    def update_escalation_reply(self, escalation_id: str, reply_text: str, replied_by: str):
        _get_supabase().table("escalations").update(
            {
                "status": "replied",
                "pm_reply": reply_text,
                "replied_by": replied_by,
                "replied_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("escalation_id", escalation_id).execute()

    def get_escalation(self, escalation_id: str) -> dict | None:
        result = (
            _get_supabase()
            .table("escalations")
            .select("*")
            .eq("escalation_id", escalation_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_property_escalations(
        self, property_id: str, guest_name: str | None = None
    ) -> list[dict]:
        result = (
            _get_supabase()
            .table("escalations")
            .select("*")
            .eq("property_id", property_id)
            .order("created_at", desc=True)
            .execute()
        )
        escalations = result.data or []

        # Enrich with guest_name from conversations
        conversation_ids = list(
            {e["conversation_id"] for e in escalations if e.get("conversation_id")}
        )
        guest_map: dict[str, str] = {}
        if conversation_ids:
            convs = (
                _get_supabase()
                .table("conversations")
                .select("conversation_id, guest_name")
                .in_("conversation_id", conversation_ids)
                .execute()
            )
            for c in convs.data or []:
                guest_map[c["conversation_id"]] = c.get("guest_name") or "Guest"

        for e in escalations:
            e["guest_name"] = guest_map.get(e.get("conversation_id", ""), "Guest")

        if guest_name:
            escalations = [e for e in escalations if e["guest_name"] == guest_name]

        return escalations

    def delete_escalation(self, escalation_id: str):
        _get_supabase().table("escalations").delete().eq("escalation_id", escalation_id).execute()

    def delete_conversation(self, conversation_id: str):
        """Delete a conversation and all related records (escalations, evaluations, messages)."""
        sb = _get_supabase()
        sb.table("escalations").delete().eq("conversation_id", conversation_id).execute()
        sb.table("evaluations").delete().eq("conversation_id", conversation_id).execute()
        sb.table("messages").delete().eq("conversation_id", conversation_id).execute()
        sb.table("conversations").delete().eq("conversation_id", conversation_id).execute()

    def delete_conversations_by_guest(self, property_id: str, guest_name: str):
        """Delete all conversations (and related data) for a specific guest in a property."""
        result = (
            _get_supabase()
            .table("conversations")
            .select("conversation_id")
            .eq("property_id", property_id)
            .eq("guest_name", guest_name)
            .execute()
        )
        for row in result.data or []:
            self.delete_conversation(row["conversation_id"])

    def delete_all_conversations(self, property_id: str):
        """Delete all conversations (and related data) for a property."""
        result = (
            _get_supabase()
            .table("conversations")
            .select("conversation_id")
            .eq("property_id", property_id)
            .execute()
        )
        for row in result.data or []:
            self.delete_conversation(row["conversation_id"])

    # --- Question patterns (for insights) ---

    def increment_question_pattern(
        self, property_id: str, question_pattern: str, confidence: float, escalated: bool
    ):
        result = (
            _get_supabase()
            .table("question_patterns")
            .select("*")
            .eq("property_id", property_id)
            .eq("question_pattern", question_pattern)
            .execute()
        )

        if result.data:
            existing = result.data[0]
            new_count = existing["count"] + 1
            new_avg = (existing["avg_confidence"] * existing["count"] + confidence) / new_count
            new_esc = existing["escalation_count"] + (1 if escalated else 0)
            _get_supabase().table("question_patterns").update(
                {
                    "count": new_count,
                    "avg_confidence": new_avg,
                    "escalation_count": new_esc,
                    "last_asked_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("pattern_id", existing["pattern_id"]).execute()
        else:
            _get_supabase().table("question_patterns").insert(
                {
                    "pattern_id": str(uuid.uuid4()),
                    "property_id": property_id,
                    "question_pattern": question_pattern,
                    "count": 1,
                    "avg_confidence": confidence,
                    "escalation_count": 1 if escalated else 0,
                }
            ).execute()

    def delete_all_question_patterns(self, property_id: str):
        """Delete all question patterns for a property."""
        _get_supabase().table("question_patterns").delete().eq("property_id", property_id).execute()

    def get_most_asked(self, property_id: str, limit: int = 10) -> list[dict]:
        result = (
            _get_supabase()
            .table("question_patterns")
            .select("*")
            .eq("property_id", property_id)
            .order("count", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def get_worst_answered(self, property_id: str, limit: int = 10) -> list[dict]:
        result = (
            _get_supabase()
            .table("question_patterns")
            .select("*")
            .eq("property_id", property_id)
            .gte("count", 2)
            .order("avg_confidence")
            .limit(limit)
            .execute()
        )
        return result.data or []

    def list_properties(self) -> list[dict]:
        """Get distinct property IDs with conversation counts and display names."""
        result = (
            _get_supabase().table("conversations").select("property_id, conversation_id").execute()
        )
        rows = result.data or []
        counts: dict[str, int] = {}
        for row in rows:
            pid = row["property_id"]
            counts[pid] = counts.get(pid, 0) + 1

        # Also include properties from the properties table (even if no conversations)
        props_result = _get_supabase().table("properties").select("property_id, name").execute()
        names: dict[str, str] = {}
        for row in props_result.data or []:
            names[row["property_id"]] = row["name"]
            if row["property_id"] not in counts:
                counts[row["property_id"]] = 0

        return [
            {"property_id": pid, "name": names.get(pid, ""), "conversation_count": count}
            for pid, count in sorted(counts.items())
        ]

    def create_property(self, property_id: str, name: str = "") -> dict:
        """Create a new property entry."""
        _get_supabase().table("properties").upsert(
            {"property_id": property_id, "name": name}
        ).execute()
        return {"property_id": property_id, "name": name}

    def update_property_name(self, property_id: str, name: str) -> dict | None:
        """Update a property's display name (upsert)."""
        _get_supabase().table("properties").upsert(
            {"property_id": property_id, "name": name}
        ).execute()
        return {"property_id": property_id, "name": name}

    def get_property_stats(self, property_id: str) -> dict:
        convs = (
            _get_supabase()
            .table("conversations")
            .select("conversation_id", count="exact")
            .eq("property_id", property_id)
            .execute()
        )
        msgs = (
            _get_supabase()
            .table("messages")
            .select("message_id", count="exact")
            .eq("property_id", property_id)
            .execute()
        )
        escs = (
            _get_supabase()
            .table("escalations")
            .select("escalation_id", count="exact")
            .eq("property_id", property_id)
            .execute()
        )

        return {
            "total_conversations": convs.count or 0,
            "total_messages": msgs.count or 0,
            "total_escalations": escs.count or 0,
        }

    # --- Knowledge Base Suggestions ---

    def get_kb_suggestions(self, property_id: str, status: str | None = None) -> list[dict]:
        query = _get_supabase().table("kb_suggestions").select("*").eq("property_id", property_id)
        if status:
            query = query.eq("status", status)
        result = query.order("created_at", desc=True).execute()
        return result.data or []

    def get_kb_suggestion(self, suggestion_id: str) -> dict | None:
        result = (
            _get_supabase()
            .table("kb_suggestions")
            .select("*")
            .eq("suggestion_id", suggestion_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def update_kb_suggestion_status(
        self,
        suggestion_id: str,
        status: str,
        title: str | None = None,
        content: str | None = None,
        category: str | None = None,
    ):
        update_data: dict = {
            "status": status,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        }
        if title is not None:
            update_data["title"] = title
        if content is not None:
            update_data["content"] = content
        if category is not None:
            update_data["category"] = category
        _get_supabase().table("kb_suggestions").update(update_data).eq(
            "suggestion_id", suggestion_id
        ).execute()


persistence = Persistence()
