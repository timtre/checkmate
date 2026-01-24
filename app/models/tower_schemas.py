"""PyArrow schemas for Tower (Apache Iceberg) tables."""

import pyarrow as pa

CONVERSATIONS_SCHEMA = pa.schema(
    [
        ("conversation_id", pa.string()),
        ("property_id", pa.string()),
        ("guest_name", pa.string()),
        ("started_at", pa.timestamp("us")),
        ("last_message_at", pa.timestamp("us")),
        ("message_count", pa.int32()),
        ("escalation_count", pa.int32()),
    ]
)

MESSAGES_SCHEMA = pa.schema(
    [
        ("message_id", pa.string()),
        ("conversation_id", pa.string()),
        ("property_id", pa.string()),
        ("role", pa.string()),  # guest | assistant | property_manager
        ("content", pa.string()),
        ("confidence", pa.float64()),
        ("sources_json", pa.string()),  # JSON-serialized list of sources
        ("created_at", pa.timestamp("us")),
    ]
)

EVALUATIONS_SCHEMA = pa.schema(
    [
        ("evaluation_id", pa.string()),
        ("conversation_id", pa.string()),
        ("message_id", pa.string()),
        ("property_id", pa.string()),
        ("verdict", pa.string()),
        ("confidence", pa.float64()),
        ("reasons_json", pa.string()),
        ("escalation_id", pa.string()),
        ("created_at", pa.timestamp("us")),
    ]
)

ESCALATIONS_SCHEMA = pa.schema(
    [
        ("escalation_id", pa.string()),
        ("property_id", pa.string()),
        ("conversation_id", pa.string()),
        ("message_id", pa.string()),
        ("guest_message", pa.string()),
        ("ai_answer", pa.string()),
        ("confidence", pa.float64()),
        ("reason", pa.string()),
        ("status", pa.string()),
        ("pm_reply", pa.string()),
        ("replied_by", pa.string()),
        ("created_at", pa.timestamp("us")),
        ("replied_at", pa.timestamp("us")),
    ]
)

QUESTION_PATTERNS_SCHEMA = pa.schema(
    [
        ("pattern_id", pa.string()),
        ("property_id", pa.string()),
        ("question_pattern", pa.string()),
        ("count", pa.int32()),
        ("avg_confidence", pa.float64()),
        ("escalation_count", pa.int32()),
        ("last_asked_at", pa.timestamp("us")),
    ]
)
