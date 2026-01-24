"""Checkmate: Property-scoped AI Concierge API."""

import logging

from fastapi import FastAPI

from app.routers import chat, escalation, evaluation, insights

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Checkmate",
    description="Property-scoped AI concierge backend. "
    "Provides chat, evaluation, escalation, and insights APIs.",
    version="0.1.0",
)

app.include_router(chat.router)
app.include_router(evaluation.router)
app.include_router(escalation.router)
app.include_router(insights.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "checkmate"}
