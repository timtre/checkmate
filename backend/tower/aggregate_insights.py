"""Tower batch pipeline: aggregate conversation data into insight metrics.

Run via: tower run --parameter=property_id=<id>
Schedule via: tower schedules create --app=checkmate-insights --cron="0 2 * * *"
"""

import os
import uuid
from datetime import datetime

import polars as pl
import pyarrow as pa
import tower

# --- Table schemas (mirrored from app) ---

MESSAGES_SCHEMA = pa.schema(
    [
        ("message_id", pa.string()),
        ("conversation_id", pa.string()),
        ("property_id", pa.string()),
        ("role", pa.string()),
        ("content", pa.string()),
        ("confidence", pa.float64()),
        ("sources_json", pa.string()),
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


def main():
    property_id = os.getenv("property_id", "")

    messages_table = tower.tables("checkmate_messages").create_if_not_exists(MESSAGES_SCHEMA)
    evals_table = tower.tables("checkmate_evaluations").create_if_not_exists(EVALUATIONS_SCHEMA)
    patterns_table = tower.tables("checkmate_question_patterns").create_if_not_exists(
        QUESTION_PATTERNS_SCHEMA
    )

    # Load messages
    messages_df = messages_table.to_polars()
    if property_id:
        messages_df = messages_df.filter(pl.col("property_id") == property_id)
    messages_df = messages_df.filter(pl.col("role") == "guest").collect()

    if messages_df.is_empty():
        print(f"No guest messages found for property_id={property_id or 'all'}")
        return

    # Normalize questions and aggregate
    questions = messages_df.with_columns(
        pl.col("content").str.to_lowercase().str.strip_chars().alias("normalized")
    )

    # Load evaluations for confidence data
    evals_df = evals_table.to_polars()
    if property_id:
        evals_df = evals_df.filter(pl.col("property_id") == property_id)
    evals_df = evals_df.collect()

    # Join messages with evaluations
    joined = questions.join(
        evals_df.select(["message_id", "confidence", "verdict"]),
        left_on="message_id",
        right_on="message_id",
        how="left",
    )

    # Group by normalized question and property
    aggregated = (
        joined.group_by(["property_id", "normalized"])
        .agg(
            pl.count().alias("count"),
            pl.col("confidence").mean().alias("avg_confidence"),
            (pl.col("verdict") != "ok").sum().alias("escalation_count"),
        )
        .sort("count", descending=True)
    )

    # Upsert into question_patterns table
    for row in aggregated.iter_rows(named=True):
        patterns_table.upsert(
            [
                {
                    "pattern_id": str(uuid.uuid4()),
                    "property_id": row["property_id"],
                    "question_pattern": row["normalized"][:200],
                    "count": row["count"],
                    "avg_confidence": row["avg_confidence"] or 0.5,
                    "escalation_count": row["escalation_count"],
                    "last_asked_at": datetime.utcnow(),
                }
            ]
        )

    print(f"Aggregated {len(aggregated)} question patterns for property_id={property_id or 'all'}")


if __name__ == "__main__":
    main()
