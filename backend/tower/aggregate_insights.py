"""Tower batch pipeline: aggregate conversation data into insight metrics.

Reads from Supabase, aggregates question patterns and escalation themes,
then writes results back to Supabase tables.

Progress is reported to the `aggregation_runs` table for real-time tracking.

Schedule via: tower schedules create --app=checkmate-insights --cron="0 2 * * *"
"""

import json
import os
import uuid
from datetime import datetime, timezone

import polars as pl
import tower
from openai import OpenAI
from supabase import create_client


def update_progress(supabase, run_id: str, phase: int, phase_name: str, percent: int, detail: str):
    """Write progress to the aggregation_runs table."""
    if not run_id:
        return
    phase_offsets = {1: 0, 2: 25, 3: 50, 4: 75}
    phase_weight = 25
    overall = phase_offsets.get(phase, 0) + int(percent * phase_weight / 100)
    supabase.table("aggregation_runs").update(
        {
            "phase": phase,
            "phase_name": phase_name,
            "status": "progress",
            "percent": percent,
            "detail": detail,
            "overall_percent": min(overall, 100),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("run_id", run_id).execute()


def main():
    property_id = tower.parameter("property_id") or ""
    run_id = tower.parameter("run_id") or ""

    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

    try:
        _run_phases(supabase, property_id, run_id)
        if run_id:
            supabase.table("aggregation_runs").update(
                {
                    "phase": 4,
                    "phase_name": "Category Suggestions",
                    "status": "completed",
                    "percent": 100,
                    "detail": "All phases completed",
                    "overall_percent": 100,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("run_id", run_id).execute()
    except Exception as e:
        if run_id:
            supabase.table("aggregation_runs").update(
                {
                    "status": "error",
                    "detail": str(e)[:500],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("run_id", run_id).execute()
        raise


def _run_phases(supabase, property_id: str, run_id: str):
    # --- Phase 1: Question pattern aggregation ---
    update_progress(supabase, run_id, 1, "Question Patterns", 0, "Fetching guest messages")

    messages_query = supabase.table("messages").select("*").eq("role", "guest")
    if property_id:
        messages_query = messages_query.eq("property_id", property_id)
    messages_data = messages_query.execute().data or []

    if not messages_data:
        update_progress(supabase, run_id, 1, "Question Patterns", 100, "No messages found")
        print("No guest messages found")
        return

    messages_df = pl.DataFrame(messages_data)

    update_progress(supabase, run_id, 1, "Question Patterns", 20, "Fetching evaluations")

    evals_query = supabase.table("evaluations").select("*")
    if property_id:
        evals_query = evals_query.eq("property_id", property_id)
    evals_data = evals_query.execute().data or []
    evals_df = (
        pl.DataFrame(evals_data)
        if evals_data
        else pl.DataFrame(
            schema={"message_id": pl.Utf8, "confidence": pl.Float64, "verdict": pl.Utf8}
        )
    )

    update_progress(supabase, run_id, 1, "Question Patterns", 40, "Aggregating patterns")

    questions = messages_df.with_columns(
        pl.col("content").str.to_lowercase().str.strip_chars().alias("normalized")
    )

    joined = questions.join(
        evals_df.select(["message_id", "confidence", "verdict"]),
        left_on="message_id",
        right_on="message_id",
        how="left",
        suffix="_eval",
    )

    aggregated = (
        joined.group_by(["property_id", "normalized"])
        .agg(
            pl.len().alias("count"),
            pl.col("confidence_eval").mean().alias("avg_confidence"),
            (pl.col("verdict") != "ok").sum().alias("escalation_count"),
        )
        .sort("count", descending=True)
    )

    now = datetime.now(timezone.utc).isoformat()
    total = len(aggregated)
    for i, row in enumerate(aggregated.iter_rows(named=True)):
        pattern_text = (row["normalized"] or "")[:200]
        if not pattern_text:
            continue

        existing = (
            supabase.table("question_patterns")
            .select("pattern_id")
            .eq("property_id", row["property_id"])
            .eq("question_pattern", pattern_text)
            .execute()
        )

        record = {
            "property_id": row["property_id"],
            "question_pattern": pattern_text,
            "count": row["count"],
            "avg_confidence": row["avg_confidence"] if row["avg_confidence"] is not None else 0.5,
            "escalation_count": row["escalation_count"],
            "last_asked_at": now,
        }

        if existing.data:
            supabase.table("question_patterns").update(record).eq(
                "pattern_id", existing.data[0]["pattern_id"]
            ).execute()
        else:
            record["pattern_id"] = str(uuid.uuid4())
            supabase.table("question_patterns").insert(record).execute()

        if (i + 1) % max(1, total // 5) == 0 or i == total - 1:
            pct = int((i + 1) / total * 100)
            update_progress(
                supabase,
                run_id,
                1,
                "Question Patterns",
                min(pct, 99),
                f"Upserting {i + 1}/{total} patterns",
            )

    update_progress(supabase, run_id, 1, "Question Patterns", 100, f"Aggregated {total} patterns")
    print(f"Phase 1: Aggregated {total} question patterns")

    # --- Phase 2: Escalation analysis ---
    update_progress(supabase, run_id, 2, "Escalation Analysis", 0, "Fetching escalations")

    esc_query = supabase.table("escalations").select("*")
    if property_id:
        esc_query = esc_query.eq("property_id", property_id)
    escalations_data = esc_query.execute().data or []

    if not escalations_data:
        update_progress(supabase, run_id, 2, "Escalation Analysis", 100, "No escalations found")
        print("Phase 2: No escalations found, skipping")
        # Skip to phase 3 with no escalation data
        _phase3_llm_suggestions(supabase, property_id, run_id, aggregated, None, now)
        return

    esc_df = pl.DataFrame(escalations_data)
    esc_df = esc_df.with_columns(
        pl.col("guest_message").str.to_lowercase().str.strip_chars().alias("normalized_question")
    )

    update_progress(supabase, run_id, 2, "Escalation Analysis", 30, "Grouping by reason")

    esc_grouped = (
        esc_df.group_by(["property_id", "reason"])
        .agg(
            pl.len().alias("escalation_count"),
            pl.col("confidence").mean().alias("avg_confidence"),
            pl.col("normalized_question").alias("all_questions"),
        )
        .sort("escalation_count", descending=True)
    )

    total_esc = len(esc_grouped)
    for i, row in enumerate(esc_grouped.iter_rows(named=True)):
        questions_list = row["all_questions"] or []
        question_counts: dict[str, int] = {}
        for q in questions_list:
            if q:
                question_counts[q] = question_counts.get(q, 0) + 1
        top_questions = sorted(question_counts, key=question_counts.get, reverse=True)[:3]

        insight_id = f"{row['property_id']}:{row['reason']}"
        record = {
            "insight_id": insight_id,
            "property_id": row["property_id"],
            "reason": row["reason"],
            "escalation_count": row["escalation_count"],
            "avg_confidence": row["avg_confidence"] if row["avg_confidence"] is not None else 0.0,
            "sample_questions": top_questions,
            "last_seen_at": now,
        }
        supabase.table("escalation_insights").upsert(record).execute()

        if (i + 1) % max(1, total_esc // 3) == 0 or i == total_esc - 1:
            pct = int((i + 1) / total_esc * 100)
            update_progress(
                supabase,
                run_id,
                2,
                "Escalation Analysis",
                min(pct, 99),
                f"Processing {i + 1}/{total_esc} themes",
            )

    update_progress(
        supabase,
        run_id,
        2,
        "Escalation Analysis",
        100,
        f"Aggregated {total_esc} escalation themes",
    )
    print(f"Phase 2: Aggregated {total_esc} escalation insight groups")

    # --- Phase 3: LLM-generated suggestions ---
    _phase3_llm_suggestions(supabase, property_id, run_id, aggregated, esc_grouped, now)

    # --- Phase 4: Category suggestions from "other" escalations ---
    _phase4_category_suggestions(supabase, property_id, run_id, esc_df, now)


def _phase3_llm_suggestions(supabase, property_id, run_id, aggregated, esc_grouped, now):
    update_progress(supabase, run_id, 3, "AI Suggestions", 0, "Preparing data for LLM")

    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    property_ids = set(aggregated["property_id"].to_list())
    if property_id:
        property_ids = {property_id} & property_ids
    if not property_ids:
        update_progress(supabase, run_id, 3, "AI Suggestions", 100, "No properties to analyze")
        return

    suggestions_count = 0
    total_props = len(property_ids)

    for idx, pid in enumerate(property_ids):
        prop_patterns = aggregated.filter(pl.col("property_id") == pid).sort("avg_confidence")
        worst_patterns = []
        for row in prop_patterns.head(10).iter_rows(named=True):
            if (
                row["avg_confidence"] is not None
                and row["avg_confidence"] < 0.7
                and row["count"] >= 2
            ):
                worst_patterns.append(
                    f"- \"{row['normalized']}\" (asked {row['count']}x, "
                    f"avg confidence: {row['avg_confidence']:.0%})"
                )

        esc_themes = []
        if esc_grouped is not None:
            prop_escalations = esc_grouped.filter(pl.col("property_id") == pid)
            for row in prop_escalations.iter_rows(named=True):
                samples = ", ".join(f'"{q}"' for q in (row["all_questions"] or [])[:2])
                esc_themes.append(
                    f"- Reason: {row['reason']} ({row['escalation_count']}x). Examples: {samples}"
                )

        if not worst_patterns and not esc_themes:
            continue

        # Fetch existing KB content
        kb_result = (
            supabase.table("knowledge_base")
            .select("title, category, content")
            .eq("property_id", pid)
            .order("chunk_index")
            .execute()
        )
        kb_entries = kb_result.data or []
        kb_content = "\n".join(entry.get("content", "") for entry in kb_entries)

        prompt_parts = [
            "Analyze the following guest question patterns for a vacation rental property concierge AI.\n"
        ]
        if worst_patterns:
            prompt_parts.append(
                "Poorly answered questions (low confidence):\n" + "\n".join(worst_patterns)
            )
        if esc_themes:
            prompt_parts.append("\nEscalation themes:\n" + "\n".join(esc_themes))

        if kb_content:
            prompt_parts.append(
                "\nExisting knowledge base content (for reference):\n" + kb_content
            )

        prompt_parts.append("""
Based on this data, generate specific, actionable suggestions. For each suggestion provide:
- type: either "kb_addition" (add content to the knowledge base) or "prompt_update" (adjust the AI system prompt)
- title: short title (max 10 words)
- content: the specific text to add or change
- reasoning: why this would help (1 sentence)
- source_patterns: list of the question patterns that motivated this suggestion

GUIDELINES FOR CHOOSING SUGGESTION TYPE:
- Use "kb_addition" when guests ask questions that require SPECIFIC FACTUAL ANSWERS (codes, times, locations, instructions, policies) that are missing or incomplete in the KB - even if a related topic exists, suggest adding the specific missing details
- Use "prompt_update" ONLY for behavioral/tone issues or when the AI needs guidance on HOW to respond (not WHAT information to provide)
- When in doubt, prefer "kb_addition" - missing factual content is the most common cause of low confidence answers

Respond with a JSON array of suggestions (max 5). Example:
[{"type": "kb_addition", "title": "Add parking instructions", "content": "Parking is available in the garage on level 2. Use code 4521 to enter.", "reasoning": "Guests frequently ask about parking with low confidence answers.", "source_patterns": ["where do i park", "parking instructions"]}]

Return ONLY the JSON array, no other text.""")

        pct = int((idx + 0.5) / total_props * 100)
        update_progress(
            supabase,
            run_id,
            3,
            "AI Suggestions",
            min(pct, 95),
            f"Generating suggestions for property {idx + 1}/{total_props}",
        )

        try:
            response = openai_client.chat.completions.create(
                model="gpt-5.1",
                messages=[{"role": "user", "content": "\n".join(prompt_parts)}],
                max_completion_tokens=2000,
            )
            raw = response.choices[0].message.content or "[]"
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
            suggestions = json.loads(raw)
        except (json.JSONDecodeError, Exception) as e:
            print(f"  Phase 3: Failed to generate suggestions for {pid}: {e}")
            continue

        for s in suggestions:
            suggestion_id = str(uuid.uuid4())
            supabase.table("batch_suggestions").upsert(
                {
                    "suggestion_id": suggestion_id,
                    "property_id": pid,
                    "suggestion_type": s.get("type", "kb_addition"),
                    "title": s.get("title", "")[:200],
                    "content": s.get("content", ""),
                    "reasoning": s.get("reasoning", ""),
                    "source_patterns": s.get("source_patterns", []),
                    "status": "pending",
                    "created_at": now,
                }
            ).execute()
            suggestions_count += 1

    update_progress(
        supabase,
        run_id,
        3,
        "AI Suggestions",
        100,
        f"Generated {suggestions_count} suggestions",
    )
    print(f"Phase 3: Generated {suggestions_count} suggestions across {total_props} properties")


def _phase4_category_suggestions(supabase, property_id, run_id, esc_df, now):
    """Analyze 'other' escalations to suggest new categories."""
    update_progress(supabase, run_id, 4, "Category Suggestions", 0, "Analyzing 'other' escalations")

    # Filter to only "other" escalations
    other_escalations = esc_df.filter(pl.col("reason") == "other")

    if len(other_escalations) == 0:
        update_progress(
            supabase, run_id, 4, "Category Suggestions", 100, "No 'other' escalations found"
        )
        print("Phase 4: No 'other' escalations found, skipping")
        return

    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # Group by property
    property_ids = set(other_escalations["property_id"].to_list())
    if property_id:
        property_ids = {property_id} & property_ids
    if not property_ids:
        update_progress(supabase, run_id, 4, "Category Suggestions", 100, "No matching properties")
        return

    suggestions_count = 0
    total_props = len(property_ids)

    for idx, pid in enumerate(property_ids):
        prop_others = other_escalations.filter(pl.col("property_id") == pid)

        # Filter out escalations that have already been processed in previous runs
        existing_suggestions = (
            supabase.table("category_suggestions")
            .select("source_escalation_ids")
            .eq("property_id", pid)
            .execute()
        )
        processed_ids = set()
        for row in existing_suggestions.data or []:
            processed_ids.update(row.get("source_escalation_ids") or [])

        if processed_ids:
            prop_others = prop_others.filter(~pl.col("escalation_id").is_in(processed_ids))

        if len(prop_others) < 2:
            # Need at least 2 "other" escalations to suggest a new category
            continue

        # Collect escalation data for the prompt
        escalation_data = []
        escalation_ids = []
        for row in prop_others.iter_rows(named=True):
            escalation_data.append(
                {
                    "guest_message": row.get("guest_message", ""),
                    "ai_answer": row.get("ai_answer", ""),
                }
            )
            escalation_ids.append(row.get("escalation_id", ""))

        # Build LLM prompt
        prompt = f"""Analyze the following escalations that were categorized as "other" (not fitting existing categories).

Existing escalation categories are:
- safety: Gas leak, fire, flooding, injury, break-in, medical emergency
- access_blocked: Locked out, wrong code, key missing, lockbox broken
- maintenance_urgent: No hot water/electricity, plumbing leak, HVAC failure
- dissatisfied: Explicit frustration with AI or guest asks for a human/manager
- cannot_answer: Property-specific question not in knowledge base
- repeated_unanswered: Same question asked multiple times without resolution

"Other" escalations that need categorization:
{json.dumps(escalation_data, indent=2)}

Look for patterns among these escalations. If you find a recurring theme that would benefit from a new category, suggest it.

For each suggested category provide:
- suggested_category: A short snake_case identifier (e.g., "booking_changes", "amenity_requests")
- description: One sentence explaining when this category should be used
- reasoning: Why this pattern warrants a new category
- sample_questions: 2-3 example guest messages that fit this category

Only suggest categories that:
1. Have at least 2 escalations that would fit
2. Are distinct from existing categories
3. Would help property managers respond more effectively

Respond with a JSON array of suggestions (max 3). If no clear patterns emerge, return an empty array [].
Example:
[{{"suggested_category": "booking_changes", "description": "Guest wants to modify reservation dates, add guests, or change booking details", "reasoning": "Multiple guests needed help with booking modifications which require PM action", "sample_questions": ["Can I extend my stay by one night?", "I need to add another guest to my reservation"]}}]

Return ONLY the JSON array, no other text."""

        pct = int((idx + 0.5) / total_props * 100)
        update_progress(
            supabase,
            run_id,
            4,
            "Category Suggestions",
            min(pct, 95),
            f"Analyzing property {idx + 1}/{total_props}",
        )

        try:
            response = openai_client.chat.completions.create(
                model="gpt-5.1",
                messages=[{"role": "user", "content": prompt}],
                max_completion_tokens=1500,
            )
            raw = response.choices[0].message.content or "[]"
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
            suggestions = json.loads(raw)
        except (json.JSONDecodeError, Exception) as e:
            print(f"  Phase 4: Failed to generate category suggestions for {pid}: {e}")
            continue

        # Extract sample questions from the escalations
        sample_questions = [
            row.get("guest_message", "")[:200]
            for row in prop_others.head(5).iter_rows(named=True)
            if row.get("guest_message")
        ]

        for s in suggestions:
            suggestion_id = str(uuid.uuid4())
            supabase.table("category_suggestions").upsert(
                {
                    "suggestion_id": suggestion_id,
                    "property_id": pid,
                    "suggested_category": s.get("suggested_category", "")[:50],
                    "description": s.get("description", "")[:500],
                    "reasoning": s.get("reasoning", "")[:500],
                    "source_escalation_ids": escalation_ids[:10],
                    "sample_questions": s.get("sample_questions", sample_questions)[:5],
                    "escalation_count": len(prop_others),
                    "status": "pending",
                    "created_at": now,
                }
            ).execute()
            suggestions_count += 1

    update_progress(
        supabase,
        run_id,
        4,
        "Category Suggestions",
        100,
        f"Generated {suggestions_count} category suggestions",
    )
    print(
        f"Phase 4: Generated {suggestions_count} category suggestions across {total_props} properties"
    )


if __name__ == "__main__":
    main()
