"""Aggregation service: triggers Tower job and polls Supabase for progress."""

import os
import uuid
from datetime import datetime, timezone

import tower
from supabase import create_client

from app.config import settings

# Tower SDK reads TOWER_API_KEY from os.environ directly
if settings.tower_api_key:
    os.environ.setdefault("TOWER_API_KEY", settings.tower_api_key)


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_key)


def start_aggregation(property_id: str) -> tuple[bool, str, str]:
    """Start an aggregation run via Tower.

    Returns (started, message, run_id).
    """
    supabase = _get_supabase()

    # Check for an already-running job for this property
    existing = (
        supabase.table("aggregation_runs")
        .select("run_id")
        .eq("property_id", property_id)
        .in_("status", ["pending", "progress"])
        .execute()
    )
    if existing.data:
        return False, "Aggregation already running for this property", ""

    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Insert pending record
    supabase.table("aggregation_runs").insert(
        {
            "run_id": run_id,
            "property_id": property_id,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }
    ).execute()

    # Trigger the Tower job
    result = tower.run_app(
        "checkmate-insights",
        parameters={"property_id": property_id, "run_id": run_id},
    )

    # Store the Tower run number
    tower_run_number = getattr(result, "seq", None) or getattr(result, "run_number", None)
    if tower_run_number is not None:
        supabase.table("aggregation_runs").update(
            {"tower_run_number": int(tower_run_number), "updated_at": now}
        ).eq("run_id", run_id).execute()

    return True, "Aggregation started", run_id


def get_run_progress(run_id: str) -> dict | None:
    """Query the aggregation_runs table for current progress."""
    supabase = _get_supabase()
    result = supabase.table("aggregation_runs").select("*").eq("run_id", run_id).execute()
    if result.data:
        return result.data[0]
    return None


def get_latest_run(property_id: str) -> dict | None:
    """Get the most recent aggregation run for a property."""
    supabase = _get_supabase()
    result = (
        supabase.table("aggregation_runs")
        .select("*")
        .eq("property_id", property_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None
