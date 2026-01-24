# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Checkmate is a property-scoped AI concierge built with a FastAPI backend and React frontend. It provides intelligent guest support for vacation rental properties using RAG (Retrieval-Augmented Generation) with Supabase pgvector for knowledge retrieval and OpenAI/Tower for LLM responses.

## Commands

```bash
# Backend
cd backend && poetry install
cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Format code (line-length: 100)
cd backend && poetry run black app/

# Check formatting
cd backend && poetry run black --check app/

# Run Tower batch job (insights aggregation)
cd backend && poetry run tower run --parameter=property_id=           # all properties
cd backend && poetry run tower run --parameter=property_id=<uuid>     # specific property

# Frontend
cd frontend && npm install
cd frontend && npm run dev
```

## Architecture

**Data Flow:** Guest message → Chat Router → Concierge Service (RAG + LLM) → Evaluation Service → Escalation Service (if needed) → Response

**Key layers:**

- **Routers** (`backend/app/routers/`) — HTTP endpoints: chat, evaluation, escalation, insights
- **Services** (`backend/app/services/`) — Business logic: concierge (RAG+LLM), knowledge_base (pgvector), evaluation (quality checks), escalation (PM notifications), tower_persistence (Iceberg storage)
- **Models** (`backend/app/models/`) — `schemas.py` for Pydantic API models, `tower_schemas.py` for PyArrow persistence schemas

**External dependencies:**
- **Supabase** — pgvector for document embeddings and similarity search
- **OpenAI** — Embeddings (`text-embedding-3-small`) for knowledge base
- **Tower SDK** — LLM chat (model configurable via `TOWER_CHAT_MODEL`) and Apache Iceberg table persistence

**Persistence:** Five Tower tables (conversations, messages, evaluations, escalations, question_patterns) using PyArrow schemas and Polars for querying.

**Multi-tenancy:** All data is scoped by `property_id`. Knowledge base, conversations, evaluations, and escalations are all filtered per-property.

**Evaluation pipeline:** Every AI response is automatically evaluated for low confidence, dissatisfaction signals, repeated questions, and knowledge gaps. Failed evaluations trigger escalations with email notifications.

**Frontend:** Vite + React test UI at `frontend/`. Provides a chat interface and knowledge base document ingestion panel for testing the backend API.

## Configuration

Environment variables loaded via Pydantic settings from `backend/.env` (see `backend/.env.example` for template). Key settings: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENAI_API_KEY`, `TOWER_CHAT_MODEL`, `CONFIDENCE_THRESHOLD`.

## Tower Batch Pipeline

Located in `backend/tower/`. The `aggregate_insights.py` job aggregates question patterns across conversations to compute frequency, average confidence, and escalation counts. Configured via `Towerfile`.
