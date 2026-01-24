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

    def get_property_escalations(self, property_id: str) -> list[dict]:
        result = (
            _get_supabase()
            .table("escalations")
            .select("*")
            .eq("property_id", property_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

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
        """Get distinct property IDs with conversation counts."""
        result = (
            _get_supabase().table("conversations").select("property_id, conversation_id").execute()
        )
        rows = result.data or []
        counts: dict[str, int] = {}
        for row in rows:
            pid = row["property_id"]
            counts[pid] = counts.get(pid, 0) + 1
        return [
            {"property_id": pid, "conversation_count": count}
            for pid, count in sorted(counts.items())
        ]

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


persistence = Persistence()
