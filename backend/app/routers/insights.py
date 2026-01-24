"""Insights router: aggregated analytics for properties."""

import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    AggregationProgressEvent,
    AggregationStatusResponse,
    AggregationTriggerResponse,
    BatchSuggestion,
    BatchSuggestionUpdateRequest,
    EscalationInsight,
    InsightsResponse,
    QuestionInsight,
)
from app.services import aggregation
from app.services.tower_persistence import persistence

router = APIRouter(prefix="/properties/{property_id}", tags=["insights"])


@router.delete("/insights")
def delete_insights(property_id: str):
    """Delete all question pattern insights for a property."""
    persistence.delete_all_question_patterns(property_id)
    return {"deleted": True}


@router.get("/insights", response_model=InsightsResponse)
def get_insights(property_id: str, limit: int = 10):
    """Get aggregated insights for a property."""
    stats = persistence.get_property_stats(property_id)
    most_asked_raw = persistence.get_most_asked(property_id, limit=limit)
    worst_answered_raw = persistence.get_worst_answered(property_id, limit=limit)
    escalation_insights_raw = persistence.get_escalation_insights(property_id, limit=limit)

    most_asked = [
        QuestionInsight(
            question_pattern=row["question_pattern"],
            count=row["count"],
            avg_confidence=round(row["avg_confidence"], 3),
            escalation_count=row["escalation_count"],
        )
        for row in most_asked_raw
    ]

    worst_answered = [
        QuestionInsight(
            question_pattern=row["question_pattern"],
            count=row["count"],
            avg_confidence=round(row["avg_confidence"], 3),
            escalation_count=row["escalation_count"],
        )
        for row in worst_answered_raw
    ]

    escalation_themes = [
        EscalationInsight(
            reason=row["reason"],
            escalation_count=row["escalation_count"],
            avg_confidence=round(row["avg_confidence"], 3),
            sample_questions=row.get("sample_questions", []),
        )
        for row in escalation_insights_raw
    ]

    return InsightsResponse(
        property_id=property_id,
        total_conversations=stats["total_conversations"],
        total_messages=stats["total_messages"],
        total_escalations=stats["total_escalations"],
        most_asked=most_asked,
        worst_answered=worst_answered,
        escalation_themes=escalation_themes,
    )


@router.get("/batch-suggestions", response_model=list[BatchSuggestion])
def get_batch_suggestions(property_id: str, status: str | None = None):
    """Get LLM-generated suggestions for KB additions and prompt updates."""
    return persistence.get_batch_suggestions(property_id, status=status)


@router.patch("/batch-suggestions/{suggestion_id}")
def update_batch_suggestion(suggestion_id: str, body: BatchSuggestionUpdateRequest):
    """Update a batch suggestion's status (pending/approved/dismissed)."""
    persistence.update_batch_suggestion_status(suggestion_id, body.status)
    return {"suggestion_id": suggestion_id, "status": body.status}


@router.post("/insights/aggregate", response_model=AggregationTriggerResponse)
def trigger_aggregation(property_id: str):
    """Trigger insight aggregation for a property via Tower."""
    started, message, run_id = aggregation.start_aggregation(property_id)
    if not started:
        raise HTTPException(status_code=409, detail=message)
    return AggregationTriggerResponse(status="started", property_id=property_id, run_id=run_id)


@router.get("/insights/aggregate/stream")
async def stream_aggregation_progress(property_id: str):
    """Stream aggregation progress via Server-Sent Events (polls Supabase)."""

    async def event_generator():
        # Find the latest run for this property
        run = aggregation.get_latest_run(property_id)
        if run is None:
            data = json.dumps(
                {
                    "phase": 0,
                    "phase_name": "",
                    "status": "idle",
                    "percent": 0,
                    "detail": "No active run",
                    "overall_percent": 0,
                }
            )
            yield f"event: progress\ndata: {data}\n\n"
            yield "event: close\ndata: {}\n\n"
            return

        run_id = run["run_id"]

        while True:
            row = aggregation.get_run_progress(run_id)
            if row is None:
                break

            data = json.dumps(
                {
                    "phase": row.get("phase", 0),
                    "phase_name": row.get("phase_name", ""),
                    "status": row.get("status", "pending"),
                    "percent": row.get("percent", 0),
                    "detail": row.get("detail", ""),
                    "overall_percent": row.get("overall_percent", 0),
                }
            )
            yield f"event: progress\ndata: {data}\n\n"

            if row.get("status") in ("completed", "error"):
                break

            await asyncio.sleep(2)

        yield "event: close\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/insights/aggregate/status", response_model=AggregationStatusResponse)
def get_aggregation_status(property_id: str):
    """Get the current aggregation status for a property."""
    run = aggregation.get_latest_run(property_id)
    if run is None:
        return AggregationStatusResponse(status="idle", property_id=property_id)

    status = run.get("status", "idle")
    if status == "progress":
        status = "running"

    progress = AggregationProgressEvent(
        phase=run.get("phase", 0),
        phase_name=run.get("phase_name", ""),
        status=run.get("status", "idle"),
        percent=run.get("percent", 0),
        detail=run.get("detail", ""),
        overall_percent=run.get("overall_percent", 0),
    )
    return AggregationStatusResponse(status=status, property_id=property_id, progress=progress)
