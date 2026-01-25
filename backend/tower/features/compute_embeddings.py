"""Tower batch pipeline: compute embeddings for question patterns.

Reads question patterns from Supabase, computes embeddings via OpenAI,
and writes results to a Tower Iceberg table for AI agent consumption.

This demonstrates:
1. Feature engineering - computing ML features (embeddings)
2. Data access to AI agents - storing pre-computed features in Iceberg
3. Team collaboration - chained via orchestration from insights job
"""

import os
from datetime import datetime, timezone

import pyarrow as pa
import tower
from openai import OpenAI
from supabase import create_client

# PyArrow schema for the pattern embeddings table
EMBEDDING_SCHEMA = pa.schema(
    [
        ("pattern_id", pa.string()),
        ("property_id", pa.string()),
        ("question_pattern", pa.string()),
        ("count", pa.int64()),
        ("avg_confidence", pa.float64()),
        ("escalation_count", pa.int64()),
        ("embedding", pa.list_(pa.float32(), 1536)),  # text-embedding-3-small dimension
        ("computed_at", pa.string()),
    ]
)


def main():
    property_id = tower.parameter("property_id") or ""

    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # Fetch question patterns from Supabase
    print("Fetching question patterns from Supabase...")
    query = supabase.table("question_patterns").select("*")
    if property_id:
        query = query.eq("property_id", property_id)
    patterns_data = query.execute().data or []

    if not patterns_data:
        print("No question patterns found, nothing to compute")
        return

    print(f"Found {len(patterns_data)} question patterns")

    # Compute embeddings for each pattern
    now = datetime.now(timezone.utc).isoformat()
    embeddings_records = []

    for i, row in enumerate(patterns_data):
        pattern_text = row.get("question_pattern", "")
        if not pattern_text:
            continue

        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small", input=pattern_text
            )
            embedding = response.data[0].embedding

            embeddings_records.append(
                {
                    "pattern_id": row["pattern_id"],
                    "property_id": row["property_id"],
                    "question_pattern": pattern_text,
                    "count": row.get("count", 1),
                    "avg_confidence": row.get("avg_confidence", 0.5),
                    "escalation_count": row.get("escalation_count", 0),
                    "embedding": embedding,
                    "computed_at": now,
                }
            )

            if (i + 1) % 10 == 0 or i == len(patterns_data) - 1:
                print(f"Computed embeddings: {i + 1}/{len(patterns_data)}")

        except Exception as e:
            print(f"Failed to compute embedding for pattern '{pattern_text[:50]}...': {e}")
            continue

    if not embeddings_records:
        print("No embeddings computed, nothing to write")
        return

    # Convert to PyArrow table
    print(f"Writing {len(embeddings_records)} embeddings to Iceberg table...")

    # Build columns for PyArrow table
    pa_table = pa.Table.from_pydict(
        {
            "pattern_id": [r["pattern_id"] for r in embeddings_records],
            "property_id": [r["property_id"] for r in embeddings_records],
            "question_pattern": [r["question_pattern"] for r in embeddings_records],
            "count": [r["count"] for r in embeddings_records],
            "avg_confidence": [r["avg_confidence"] for r in embeddings_records],
            "escalation_count": [r["escalation_count"] for r in embeddings_records],
            "embedding": [r["embedding"] for r in embeddings_records],
            "computed_at": [r["computed_at"] for r in embeddings_records],
        },
        schema=EMBEDDING_SCHEMA,
    )

    # Write to Tower Iceberg table (overwrites for simplicity)
    tower.tables("pattern_embeddings", namespace="checkmate").insert(pa_table)

    print(f"Successfully wrote {len(embeddings_records)} pattern embeddings to Iceberg")


if __name__ == "__main__":
    main()
