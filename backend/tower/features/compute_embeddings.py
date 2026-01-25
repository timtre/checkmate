"""Tower batch pipeline: compute embeddings for question patterns.

Reads question patterns from Supabase, computes embeddings via OpenAI,
and writes results back to Supabase for AI agent consumption.

This demonstrates:
1. Feature engineering - computing ML features (embeddings)
2. Data access to AI agents - storing pre-computed features for inference
3. Team collaboration - chained via orchestration from insights job
"""

import os
from datetime import datetime, timezone

import tower
from openai import OpenAI
from supabase import create_client


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
    success_count = 0

    for i, row in enumerate(patterns_data):
        pattern_text = row.get("question_pattern", "")
        if not pattern_text:
            continue

        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small", input=pattern_text
            )
            embedding = response.data[0].embedding

            # Upsert to pattern_embeddings table in Supabase
            record = {
                "pattern_id": row["pattern_id"],
                "property_id": row["property_id"],
                "question_pattern": pattern_text,
                "count": row.get("count", 1),
                "avg_confidence": row.get("avg_confidence", 0.5),
                "escalation_count": row.get("escalation_count", 0),
                "embedding": embedding,
                "computed_at": now,
            }

            supabase.table("pattern_embeddings").upsert(record).execute()
            success_count += 1

            if (i + 1) % 10 == 0 or i == len(patterns_data) - 1:
                print(f"Computed embeddings: {i + 1}/{len(patterns_data)}")

        except Exception as e:
            print(f"Failed to compute embedding for pattern '{pattern_text[:50]}...': {e}")
            continue

    print(f"Successfully wrote {success_count} pattern embeddings to Supabase")


if __name__ == "__main__":
    main()
