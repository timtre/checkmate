"""Insights router: aggregated analytics for properties."""

from fastapi import APIRouter

from app.models.schemas import InsightsResponse, QuestionInsight
from app.services.tower_persistence import persistence

router = APIRouter(prefix="/properties/{property_id}", tags=["insights"])


@router.get("/insights", response_model=InsightsResponse)
def get_insights(property_id: str, limit: int = 10):
    """Get aggregated insights for a property.

    Returns:
    - Most frequently asked questions
    - Worst answered questions (lowest avg confidence, asked 2+ times)
    - Overall conversation/message/escalation counts
    """
    stats = persistence.get_property_stats(property_id)
    most_asked_raw = persistence.get_most_asked(property_id, limit=limit)
    worst_answered_raw = persistence.get_worst_answered(property_id, limit=limit)

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

    return InsightsResponse(
        property_id=property_id,
        total_conversations=stats["total_conversations"],
        total_messages=stats["total_messages"],
        total_escalations=stats["total_escalations"],
        most_asked=most_asked,
        worst_answered=worst_answered,
    )
