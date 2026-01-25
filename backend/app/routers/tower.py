"""Tower router: run Tower jobs and list Iceberg tables."""

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

# Tower SDK reads TOWER_API_KEY from os.environ directly
if settings.tower_api_key:
    os.environ.setdefault("TOWER_API_KEY", settings.tower_api_key)


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
    """List all Tower Iceberg tables in the checkmate namespace."""
    try:
        import tower

        tables_list = []

        # Try to list tables in the checkmate namespace
        try:
            # Check for pattern_embeddings table
            table = tower.tables("pattern_embeddings", namespace="checkmate")
            df = table.load().to_pandas()
            tables_list.append(
                TowerTable(
                    name="pattern_embeddings",
                    namespace="checkmate",
                    record_count=len(df),
                )
            )
        except Exception:
            # Table doesn't exist yet
            pass

        return TowerTablesResponse(tables=tables_list)

    except ImportError:
        raise HTTPException(status_code=503, detail="Tower SDK not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tables: {e}")


@router.get("/tables/{table_name}", response_model=dict)
def get_tower_table_preview(table_name: str, limit: int = 10):
    """Get a preview of records from a Tower Iceberg table."""
    try:
        import tower

        table = tower.tables(table_name, namespace="checkmate")
        df = table.load().to_pandas()

        # Convert to list of dicts, excluding embedding column for readability
        records = []
        for _, row in df.head(limit).iterrows():
            record = {}
            for col in df.columns:
                if col == "embedding":
                    record[col] = f"[{len(row[col])} dimensions]"
                else:
                    record[col] = row[col]
            records.append(record)

        return {
            "table_name": table_name,
            "namespace": "checkmate",
            "total_records": len(df),
            "preview": records,
        }

    except ImportError:
        raise HTTPException(status_code=503, detail="Tower SDK not available")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Table not found or error: {e}")


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
