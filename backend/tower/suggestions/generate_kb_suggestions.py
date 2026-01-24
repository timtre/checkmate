"""Tower batch job: generate Knowledge Base article suggestions from replied escalations.

Analyzes PM replies to escalations and uses OpenAI to draft knowledge base articles.
These are surfaced as suggestions for PM approval in the admin dashboard.

Run via: tower run --parameter=property_id=<id>
"""

import os
import uuid
from datetime import datetime, timezone

from openai import OpenAI
from supabase import create_client

BATCH_SIZE = 5

SYSTEM_PROMPT = """You are a knowledge base article writer for a vacation rental property.
Given a set of guest questions and the property manager's replies, write a clear, helpful
knowledge base article that would allow an AI concierge to answer similar questions in the future.

Guidelines:
- Write in a factual, informative tone
- Include all relevant details from the PM's replies
- Structure the content clearly with short paragraphs
- Focus on being useful for future guests asking similar questions
- Do NOT include greetings or sign-offs

Respond with JSON in this exact format:
{"title": "...", "content": "...", "category": "..."}

Category should be one of: general, check-in, check-out, amenities, rules, local-tips, parking, wifi, safety, maintenance
"""


def build_user_prompt(escalations: list[dict]) -> str:
    parts = []
    for esc in escalations:
        parts.append(f"Guest asked: {esc['guest_message']}\n" f"PM replied: {esc['pm_reply']}")
    return "\n\n---\n\n".join(parts)


def main():
    property_id = os.getenv("property_id", "")

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_KEY"]
    openai_api_key = os.environ["OPENAI_API_KEY"]

    supabase = create_client(supabase_url, supabase_key)
    client = OpenAI(api_key=openai_api_key)

    # Fetch replied escalations that haven't been processed yet
    query = (
        supabase.table("escalations").select("*").eq("status", "replied").eq("kb_suggestion_id", "")
    )
    if property_id:
        query = query.eq("property_id", property_id)

    result = query.order("replied_at").execute()
    escalations = result.data or []

    if not escalations:
        print(f"No unprocessed replied escalations for property_id={property_id or 'all'}")
        return

    # Group by property_id
    by_property: dict[str, list[dict]] = {}
    for esc in escalations:
        pid = esc["property_id"]
        by_property.setdefault(pid, []).append(esc)

    total_suggestions = 0

    for pid, prop_escalations in by_property.items():
        # Process in batches of BATCH_SIZE
        for i in range(0, len(prop_escalations), BATCH_SIZE):
            batch = prop_escalations[i : i + BATCH_SIZE]

            user_prompt = build_user_prompt(batch)

            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                )

                import json

                article = json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"OpenAI call failed for property {pid}: {e}")
                continue

            suggestion_id = str(uuid.uuid4())
            escalation_ids = [esc["escalation_id"] for esc in batch]

            # Insert suggestion
            supabase.table("kb_suggestions").insert(
                {
                    "suggestion_id": suggestion_id,
                    "property_id": pid,
                    "title": article.get("title", "Untitled"),
                    "content": article.get("content", ""),
                    "category": article.get("category", "general"),
                    "source_escalation_ids": escalation_ids,
                    "status": "pending",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            ).execute()

            # Mark source escalations as processed
            for esc_id in escalation_ids:
                supabase.table("escalations").update({"kb_suggestion_id": suggestion_id}).eq(
                    "escalation_id", esc_id
                ).execute()

            total_suggestions += 1
            print(f"Created suggestion '{article.get('title')}' from {len(batch)} escalations")

    print(f"Done. Created {total_suggestions} Knowledge Base suggestions.")


if __name__ == "__main__":
    main()
