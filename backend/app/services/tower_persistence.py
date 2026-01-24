"""Tower persistence service: read/write to Apache Iceberg tables via Tower SDK."""

import json
import uuid
from datetime import datetime

import tower

from app.models.tower_schemas import (
    CONVERSATIONS_SCHEMA,
    ESCALATIONS_SCHEMA,
    EVALUATIONS_SCHEMA,
    MESSAGES_SCHEMA,
    QUESTION_PATTERNS_SCHEMA,
)


class TowerPersistence:
    """Manages all Tower table operations for Checkmate."""

    def __init__(self):
        self._tables = {}

    def _get_table(self, name, schema):
        if name not in self._tables:
            self._tables[name] = tower.tables(name).create_if_not_exists(schema)
        return self._tables[name]

    @property
    def conversations(self):
        return self._get_table("checkmate_conversations", CONVERSATIONS_SCHEMA)

    @property
    def messages(self):
        return self._get_table("checkmate_messages", MESSAGES_SCHEMA)

    @property
    def evaluations(self):
        return self._get_table("checkmate_evaluations", EVALUATIONS_SCHEMA)

    @property
    def escalations(self):
        return self._get_table("checkmate_escalations", ESCALATIONS_SCHEMA)

    @property
    def question_patterns(self):
        return self._get_table("checkmate_question_patterns", QUESTION_PATTERNS_SCHEMA)

    # --- Conversations ---

    def create_conversation(self, property_id: str, guest_name: str | None = None) -> str:
        conversation_id = str(uuid.uuid4())
        now = datetime.utcnow()
        self.conversations.insert(
            [
                {
                    "conversation_id": conversation_id,
                    "property_id": property_id,
                    "guest_name": guest_name or "Guest",
                    "started_at": now,
                    "last_message_at": now,
                    "message_count": 0,
                    "escalation_count": 0,
                }
            ]
        )
        return conversation_id

    def update_conversation_activity(self, conversation_id: str):
        self.conversations.upsert(
            [
                {
                    "conversation_id": conversation_id,
                    "last_message_at": datetime.utcnow(),
                }
            ]
        )

    def get_conversation_messages(self, conversation_id: str) -> list[dict]:
        df = (
            self.messages.to_polars()
            .filter(__import__("polars").col("conversation_id") == conversation_id)
            .sort("created_at")
            .collect()
        )
        return df.to_dicts()

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
        self.messages.insert(
            [
                {
                    "message_id": message_id,
                    "conversation_id": conversation_id,
                    "property_id": property_id,
                    "role": role,
                    "content": content,
                    "confidence": confidence,
                    "sources_json": json.dumps(sources or []),
                    "created_at": datetime.utcnow(),
                }
            ]
        )

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
        self.evaluations.insert(
            [
                {
                    "evaluation_id": evaluation_id,
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                    "property_id": property_id,
                    "verdict": verdict,
                    "confidence": confidence,
                    "reasons_json": json.dumps(reasons),
                    "escalation_id": escalation_id or "",
                    "created_at": datetime.utcnow(),
                }
            ]
        )

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
        self.escalations.insert(
            [
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
                    "created_at": datetime.utcnow(),
                    "replied_at": None,
                }
            ]
        )

    def update_escalation_reply(self, escalation_id: str, reply_text: str, replied_by: str):
        self.escalations.upsert(
            [
                {
                    "escalation_id": escalation_id,
                    "status": "replied",
                    "pm_reply": reply_text,
                    "replied_by": replied_by,
                    "replied_at": datetime.utcnow(),
                }
            ]
        )

    def get_escalation(self, escalation_id: str) -> dict | None:
        import polars as pl

        df = self.escalations.to_polars().filter(pl.col("escalation_id") == escalation_id).collect()
        rows = df.to_dicts()
        return rows[0] if rows else None

    def get_property_escalations(self, property_id: str) -> list[dict]:
        import polars as pl

        df = (
            self.escalations.to_polars()
            .filter(pl.col("property_id") == property_id)
            .sort("created_at", descending=True)
            .collect()
        )
        return df.to_dicts()

    # --- Question patterns (for insights) ---

    def increment_question_pattern(
        self, property_id: str, question_pattern: str, confidence: float, escalated: bool
    ):
        import polars as pl

        df = (
            self.question_patterns.to_polars()
            .filter(
                (pl.col("property_id") == property_id)
                & (pl.col("question_pattern") == question_pattern)
            )
            .collect()
        )
        rows = df.to_dicts()

        if rows:
            existing = rows[0]
            new_count = existing["count"] + 1
            new_avg = (existing["avg_confidence"] * existing["count"] + confidence) / new_count
            new_esc = existing["escalation_count"] + (1 if escalated else 0)
            self.question_patterns.upsert(
                [
                    {
                        "pattern_id": existing["pattern_id"],
                        "property_id": property_id,
                        "question_pattern": question_pattern,
                        "count": new_count,
                        "avg_confidence": new_avg,
                        "escalation_count": new_esc,
                        "last_asked_at": datetime.utcnow(),
                    }
                ]
            )
        else:
            self.question_patterns.insert(
                [
                    {
                        "pattern_id": str(uuid.uuid4()),
                        "property_id": property_id,
                        "question_pattern": question_pattern,
                        "count": 1,
                        "avg_confidence": confidence,
                        "escalation_count": 1 if escalated else 0,
                        "last_asked_at": datetime.utcnow(),
                    }
                ]
            )

    def get_most_asked(self, property_id: str, limit: int = 10) -> list[dict]:
        import polars as pl

        df = (
            self.question_patterns.to_polars()
            .filter(pl.col("property_id") == property_id)
            .sort("count", descending=True)
            .head(limit)
            .collect()
        )
        return df.to_dicts()

    def get_worst_answered(self, property_id: str, limit: int = 10) -> list[dict]:
        import polars as pl

        df = (
            self.question_patterns.to_polars()
            .filter((pl.col("property_id") == property_id) & (pl.col("count") >= 2))
            .sort("avg_confidence")
            .head(limit)
            .collect()
        )
        return df.to_dicts()

    def get_property_stats(self, property_id: str) -> dict:
        import polars as pl

        convs = (
            self.conversations.to_polars().filter(pl.col("property_id") == property_id).collect()
        )
        msgs = self.messages.to_polars().filter(pl.col("property_id") == property_id).collect()
        escs = self.escalations.to_polars().filter(pl.col("property_id") == property_id).collect()

        return {
            "total_conversations": len(convs),
            "total_messages": len(msgs),
            "total_escalations": len(escs),
        }


persistence = TowerPersistence()
