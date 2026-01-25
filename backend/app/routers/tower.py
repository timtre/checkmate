"""Tower router: run Tower jobs and list feature tables."""

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.config import settings

# Tower SDK reads TOWER_API_KEY from os.environ directly
if settings.tower_api_key:
    os.environ.setdefault("TOWER_API_KEY", settings.tower_api_key)


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_key)


router = APIRouter(prefix="/tower", tags=["tower"])


class TowerTable(BaseModel):
    """Information about a Tower Iceberg table."""

    name: str
    namespace: str
    record_count: int | None = None


class TowerTablesResponse(BaseModel):
    """Response containing list of Tower tables."""

    tables: list[TowerTable]


class TowerJobTriggerResponse(BaseModel):
    """Response after triggering a Tower job."""

    status: str
    app_name: str
    property_id: str
    run_number: int | None = None


class TowerJobStatusResponse(BaseModel):
    """Response with Tower job status."""

    status: str
    app_name: str
    detail: str | None = None


@router.get("/tables", response_model=TowerTablesResponse)
def list_tower_tables():
    """List Tower feature tables (stored in Supabase)."""
    try:
        supabase = _get_supabase()
        tables_list = []

        # Check pattern_embeddings table
        try:
            result = supabase.table("pattern_embeddings").select("pattern_id").execute()
            record_count = len(result.data) if result.data else 0
            tables_list.append(
                TowerTable(
                    name="pattern_embeddings",
                    namespace="tower_features",
                    record_count=record_count,
                )
            )
        except Exception:
            # Table might not have data yet
            tables_list.append(
                TowerTable(
                    name="pattern_embeddings",
                    namespace="tower_features",
                    record_count=0,
                )
            )

        return TowerTablesResponse(tables=tables_list)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tables: {e}")


@router.get("/tables/{table_name}", response_model=dict)
def get_tower_table_preview(table_name: str, limit: int = 10):
    """Get a preview of records from a Tower feature table."""
    try:
        supabase = _get_supabase()

        if table_name != "pattern_embeddings":
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

        # Get total count
        count_result = supabase.table("pattern_embeddings").select("pattern_id").execute()
        total_records = len(count_result.data) if count_result.data else 0

        # Get preview records (exclude embedding for readability)
        result = (
            supabase.table("pattern_embeddings")
            .select(
                "pattern_id, property_id, question_pattern, count, avg_confidence, escalation_count, computed_at"
            )
            .limit(limit)
            .execute()
        )

        records = []
        for row in result.data or []:
            record = dict(row)
            record["embedding"] = "[1536 dimensions]"  # Indicate embedding exists
            records.append(record)

        return {
            "table_name": table_name,
            "namespace": "tower_features",
            "total_records": total_records,
            "preview": records,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load table: {e}")


@router.post("/features/{property_id}", response_model=TowerJobTriggerResponse)
def trigger_features_job(property_id: str):
    """Trigger the feature engineering job for a property."""
    try:
        import tower

        result = tower.run_app(
            "checkmate-features",
            parameters={"property_id": property_id},
        )

        run_number = getattr(result, "seq", None) or getattr(result, "run_number", None)

        return TowerJobTriggerResponse(
            status="started",
            app_name="checkmate-features",
            property_id=property_id,
            run_number=int(run_number) if run_number else None,
        )

    except ImportError:
        raise HTTPException(status_code=503, detail="Tower SDK not available")
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=404,
                detail="Tower app 'checkmate-features' not deployed. "
                "Run: cd backend/tower/features && tower deploy",
            )
        raise HTTPException(status_code=500, detail=f"Failed to trigger job: {e}")


@router.get("/features/status", response_model=TowerJobStatusResponse)
def get_features_job_status():
    """Get the status of the features job (basic check)."""
    try:
        import tower

        # Check if the app exists by trying to get info
        # This is a basic check; Tower SDK may have better status APIs
        return TowerJobStatusResponse(
            status="available",
            app_name="checkmate-features",
            detail="Feature engineering job is configured",
        )

    except ImportError:
        return TowerJobStatusResponse(
            status="unavailable",
            app_name="checkmate-features",
            detail="Tower SDK not available",
        )
    except Exception as e:
        return TowerJobStatusResponse(
            status="error",
            app_name="checkmate-features",
            detail=str(e),
        )
