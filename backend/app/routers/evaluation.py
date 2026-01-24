"""Evaluation router: view automatic evaluation results."""

from fastapi import APIRouter

from app.services.tower_persistence import persistence

router = APIRouter(prefix="/properties/{property_id}", tags=["evaluation"])


@router.get("/conversations/{conversation_id}/evaluations")
def get_evaluations(property_id: str, conversation_id: str):
    """Retrieve all evaluations for a conversation.

    Each evaluation contains the verdict, confidence score, and reasons
    for any escalation triggers.
    """
    import polars as pl

    df = (
        persistence.evaluations.to_polars()
        .filter(
            (pl.col("conversation_id") == conversation_id) & (pl.col("property_id") == property_id)
        )
        .sort("created_at")
        .collect()
    )

    return {
        "conversation_id": conversation_id,
        "evaluations": df.to_dicts(),
    }


@router.get("/evaluations/summary")
def get_evaluation_summary(property_id: str):
    """Get a summary of evaluation verdicts for a property.

    Returns counts by verdict type and average confidence.
    """
    import polars as pl

    df = persistence.evaluations.to_polars().filter(pl.col("property_id") == property_id).collect()

    if df.is_empty():
        return {
            "property_id": property_id,
            "total_evaluations": 0,
            "by_verdict": {},
            "avg_confidence": 0.0,
        }

    by_verdict = df.group_by("verdict").agg(pl.count().alias("count")).to_dicts()
    avg_confidence = df["confidence"].mean()

    return {
        "property_id": property_id,
        "total_evaluations": len(df),
        "by_verdict": {row["verdict"]: row["count"] for row in by_verdict},
        "avg_confidence": round(avg_confidence, 3),
    }
