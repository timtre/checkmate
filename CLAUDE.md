# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Checkmate is a property-scoped AI concierge built with a FastAPI backend and React frontend. It provides intelligent guest support for vacation rental properties using RAG (Retrieval-Augmented Generation) with Supabase pgvector for knowledge retrieval and OpenAI for LLM responses.

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
cd frontend && npm run lint

# Seed demo data (requires SUPABASE_URL and SUPABASE_KEY in backend/.env)
cd backend && poetry run python seed.py
```

## Architecture

**Data Flow:** Guest message → Chat Router → Concierge Service (RAG + LLM) → Evaluation Service → Escalation Service (if needed) → Response

**Key layers:**

- **Routers** (`backend/app/routers/`) — HTTP endpoints: chat, evaluation, escalation, insights, properties, tokens
- **Services** (`backend/app/services/`) — Business logic: concierge (RAG+LLM), knowledge_base (pgvector), evaluation (quality checks), escalation (PM notifications), tokens (guest access), tower_persistence (Supabase CRUD)
- **Models** (`backend/app/models/`) — `schemas.py` for Pydantic API models, `tower_schemas.py` for PyArrow persistence schemas

**External dependencies:**
- **Supabase** — pgvector for document embeddings, similarity search, and primary data persistence (conversations, messages, evaluations, escalations, question_patterns)
- **OpenAI** — Embeddings (`text-embedding-3-small`) for knowledge base and LLM chat (model configurable via `CHAT_MODEL`, default `gpt-5.1`)
- **Tower SDK** — Batch analytics pipeline only (insights aggregation via Apache Iceberg tables)

**Persistence:** Supabase is the primary data store for all CRUD operations. Tower Iceberg tables (with PyArrow schemas) are used by the batch pipeline for analytics aggregation.

**Multi-tenancy:** All data is scoped by `property_id`. Knowledge base, conversations, evaluations, and escalations are all filtered per-property.

**Evaluation pipeline:** Every AI response is automatically evaluated for low confidence, dissatisfaction signals, repeated questions, and knowledge gaps. Failed evaluations trigger escalations with email notifications.

**Frontend:** Vite + React + TypeScript at `frontend/`. Three pages: `GuestChatView` (guest-facing chat), `PMDashboard` (escalations and insights for property managers), and `AdminPanel` (knowledge base ingestion and testing). API client in `src/api.ts`.

**Database schema:** Defined in `backend/supabase/schema.sql`. Key tables: `knowledge_base` (with IVFFlat index on 1536-dim embeddings), `guest_tokens`, `conversations`, `messages`, `evaluations`, `escalations`, `question_patterns`. Vector search via the `match_knowledge_base` RPC function.

## Configuration

Environment variables loaded via Pydantic settings from `backend/.env` (see `backend/.env.example` for template). Key settings: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENAI_API_KEY`, `CHAT_MODEL`, `CONFIDENCE_THRESHOLD`.

## Tower Batch Pipeline

Located in `backend/tower/`. The `aggregate_insights.py` job aggregates question patterns across conversations to compute frequency, average confidence, and escalation counts. Configured via `Towerfile`.
