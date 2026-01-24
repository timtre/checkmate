"""Checkmate: Property-scoped AI Concierge API."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, conversations, escalation, evaluation, insights, properties, tokens

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Checkmate",
    description="Property-scoped AI concierge backend. "
    "Provides chat, evaluation, escalation, and insights APIs.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(evaluation.router)
app.include_router(escalation.router)
app.include_router(insights.router)
app.include_router(properties.router)
app.include_router(tokens.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "checkmate"}
