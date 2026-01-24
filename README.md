# Checkmate

**Property-scoped AI concierge for vacation rentals.**

Checkmate provides intelligent guest support powered by RAG (Retrieval-Augmented Generation). Each property maintains its own knowledge base, conversation history, and analytics — ensuring accurate, context-aware responses for every guest interaction.

---

## Features

- **RAG-powered guest support** — retrieves property-specific knowledge and generates grounded answers with confidence scoring
- **Automatic response evaluation** — every AI response is checked for low confidence, dissatisfaction signals, repeated questions, and knowledge gaps
- **Escalation workflow** — failed evaluations trigger escalations with PM email notifications and reply injection
- **Multi-tenant architecture** — all data (knowledge, conversations, evaluations, escalations) scoped by `property_id`
- **Batch analytics pipeline** — Tower job aggregates question patterns, computes frequency, average confidence, and escalation counts
- **Knowledge base ingestion** — document chunking with sentence-aware splitting and OpenAI embeddings (1536-dim vectors)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | FastAPI 0.115+ (Python 3.11+) |
| Frontend | React 19 + Vite + TypeScript |
| Data Validation | Pydantic v2, Pydantic Settings |
| Vector Database | Supabase pgvector (1536-dim, IVFFlat index) |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | Tower SDK (configurable model, default `gpt-5.1`) |
| Persistence | Tower Apache Iceberg tables (5 tables) |
| Batch Processing | Tower batch pipeline + Polars |
| Data Serialization | PyArrow |
| HTTP Client | httpx |
| Server | Uvicorn (ASGI) |
| Formatting | Black (line-length: 100) |
| Package Manager | Poetry (backend), npm (frontend) |

---

## Architecture

### Data Flow

```
Guest Message (POST /properties/{property_id}/chat)
       │
       ▼
┌─────────────┐
│ Chat Router  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Concierge Service                    │
│                                                   │
│  1. Create/fetch conversation                     │
│  2. Save guest message → Tower                    │
│  3. Retrieve context → Supabase pgvector          │
│  4. Build prompt (history + context)              │
│  5. Call Tower LLM → answer + confidence          │
│  6. Save assistant message → Tower                │
│  7. Track question pattern                        │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│            Evaluation Service                     │
│                                                   │
│  Check: low confidence, dissatisfaction,          │
│         repeated questions, knowledge gaps        │
│  Save verdict → Tower                             │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│            Escalation Service                     │
│                                                   │
│  If verdict ≠ OK:                                 │
│    → Create escalation record                     │
│    → Notify PM via email                          │
│    → Set response.escalated = True                │
└──────┬───────────────────────────────────────────┘
       │
       ▼
  ChatResponse (answer, confidence, sources, escalated)
```

### Layer Descriptions

- **Routers** (`app/routers/`) — HTTP endpoints handling request/response serialization
- **Services** (`app/services/`) — Business logic: RAG orchestration, quality evaluation, escalation workflow, persistence
- **Models** (`app/models/`) — Pydantic schemas for API contracts, PyArrow schemas for Iceberg tables
- **External Dependencies** — Supabase (vector store), OpenAI (embeddings), Tower (LLM + persistence)

### Multi-Tenancy

All data is scoped by `property_id`. Every query — knowledge retrieval, conversation history, evaluations, escalations, and analytics — filters by property to ensure complete data isolation between properties.

### Evaluation Pipeline

Every AI response is automatically evaluated against four criteria:

1. **Low Confidence** — confidence score below threshold (default 0.6)
2. **Dissatisfaction Signals** — guest message contains phrases like "that doesn't help", "speak to someone", "incorrect"
3. **Repeated Questions** — semantic token overlap with previous guest messages (threshold 0.8)
4. **Knowledge Gaps** — no sources matched the query

Failed evaluations trigger the escalation workflow.

---

## Prerequisites

- Python 3.11+
- [Poetry](https://python-poetry.org/)
- Node.js 18+ and npm (for frontend)
- Supabase project with pgvector extension enabled
- OpenAI API key (for embeddings)
- Tower SDK access (for LLM and persistence)

---

## Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd checkmate

# Backend setup
cd backend
poetry install
cp .env.example .env
# Edit .env with your credentials (see Configuration below)

# Set up Supabase schema
# Run the contents of backend/supabase/schema.sql in your Supabase SQL editor

# Seed demo data (optional)
poetry run python seed.py

# Start the backend server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend setup (in a separate terminal)
cd frontend
npm install
npm run dev
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.
The frontend will be available at `http://localhost:5173`.

---

## Configuration

All settings are loaded from environment variables (`.env` file) via Pydantic Settings.

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | — |
| `SUPABASE_KEY` | Supabase anon or service key | — |
| `OPENAI_API_KEY` | OpenAI API key (used for embeddings) | — |
| `TOWER_CHAT_MODEL` | LLM model routed through Tower | `gpt-5.1` |
| `EMBEDDING_MODEL` | OpenAI embedding model | `text-embedding-3-small` |
| `CONFIDENCE_THRESHOLD` | Minimum confidence before escalation | `0.6` |
| `ESCALATION_EMAIL_FROM` | Sender address for escalation emails | `concierge@checkmate.ai` |

---

## API Reference

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health check |

**Response:**
```json
{ "status": "ok", "service": "checkmate" }
```

---

### Chat

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/properties/{property_id}/chat` | Send a guest message and receive an AI response |

**Request Body:**
```json
{
  "message": "What time is check-in?",
  "conversation_id": null,
  "guest_name": "Alice"
}
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "answer": "Check-in is at 3:00 PM.",
  "confidence": 0.92,
  "sources": [
    {
      "document_id": "uuid",
      "title": "House Rules",
      "snippet": "Check-in time is 3:00 PM...",
      "similarity": 0.89
    }
  ],
  "escalated": false
}
```

---

### Knowledge Base

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/properties/{property_id}/knowledge-base` | Ingest a document into the property's knowledge base |

**Request Body:**
```json
{
  "title": "House Rules",
  "content": "Check-in is at 3:00 PM. Check-out is at 11:00 AM. No smoking...",
  "category": "rules",
  "metadata": {}
}
```

**Response:**
```json
{
  "document_id": "uuid",
  "chunks_created": 4
}
```

---

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/properties/{property_id}/conversations/{conversation_id}/messages` | Retrieve all messages in a conversation |

---

### Evaluations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/properties/{property_id}/conversations/{conversation_id}/evaluations` | Get evaluations for a conversation |
| `GET` | `/properties/{property_id}/evaluations/summary` | Get evaluation summary by verdict |

---

### Escalations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/properties/{property_id}/escalations` | List escalations (optional `?status=open`) |
| `GET` | `/escalations/{escalation_id}` | Get a specific escalation |
| `POST` | `/escalations/{escalation_id}/reply` | PM replies to an escalation |

**Reply Request Body:**
```json
{
  "reply_text": "Check-in is flexible, just let us know your ETA.",
  "replied_by": "pm@example.com"
}
```

**Reply Response:**
```json
{
  "escalation_id": "uuid",
  "status": "replied",
  "conversation_id": "uuid",
  "reply_injected": true
}
```

---

### Properties

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/properties` | List all properties |

---

### Guest Tokens

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/properties/{property_id}/tokens` | Create a guest access token |
| `GET` | `/tokens/{token}` | Validate a guest token |

---

### Insights

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/properties/{property_id}/insights` | Get aggregated analytics for a property |

**Response:**
```json
{
  "property_id": "uuid",
  "total_conversations": 142,
  "total_messages": 856,
  "total_escalations": 23,
  "most_asked": [
    {
      "question_pattern": "what time is check-in",
      "count": 34,
      "avg_confidence": 0.91,
      "escalation_count": 1
    }
  ],
  "worst_answered": [
    {
      "question_pattern": "is there a gym nearby",
      "count": 8,
      "avg_confidence": 0.42,
      "escalation_count": 5
    }
  ],
  "period_days": 30
}
```

---

## Database Schema

### Supabase — `knowledge_base` Table

Stores document chunks with vector embeddings for similarity search.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Chunk identifier |
| `document_id` | uuid | Parent document identifier |
| `property_id` | text | Property scope |
| `title` | text | Document title |
| `chunk_index` | integer | Position within document |
| `content` | text | Chunk text content |
| `category` | text | Document category (default: `general`) |
| `metadata` | jsonb | Arbitrary metadata |
| `embedding` | vector(1536) | OpenAI embedding vector |
| `created_at` | timestamptz | Ingestion timestamp |

**Indexes:** IVFFlat on `embedding` (100 lists, cosine ops), B-tree on `property_id`

**RPC Function:** `match_knowledge_base(query_embedding, match_count, filter_property_id, similarity_threshold)` — performs filtered vector similarity search.

### Tower Iceberg Tables

Five Apache Iceberg tables persisted via Tower SDK:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `checkmate_conversations` | Conversation metadata | conversation_id, property_id, guest_name, message_count |
| `checkmate_messages` | All messages (guest/assistant/PM) | message_id, role, content, confidence, sources_json |
| `checkmate_evaluations` | Evaluation verdicts | evaluation_id, verdict, confidence, reasons_json |
| `checkmate_escalations` | Escalation records | escalation_id, reason, status, pm_reply |
| `checkmate_question_patterns` | Aggregated insights | question_pattern, count, avg_confidence, escalation_count |

---

## Tower Batch Pipeline

Located in `backend/tower/`. The batch job aggregates question patterns across conversations.

**What it does:**
1. Loads messages and evaluations from Tower tables
2. Normalizes questions (lowercase, strip, truncate)
3. Joins messages with evaluations for confidence data
4. Groups by normalized question and property
5. Calculates aggregates: count, avg_confidence, escalation_count
6. Upserts results into `checkmate_question_patterns`

**Running the job:**
```bash
cd backend

# All properties
poetry run tower run --parameter=property_id=

# Specific property
poetry run tower run --parameter=property_id=<uuid>
```

**Scheduling:**
```bash
tower schedules create --app=checkmate-insights --cron="0 2 * * *"
```

---

## Project Structure

```
checkmate/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app, router includes, health endpoint
│   │   ├── config.py                  # Pydantic Settings (env vars)
│   │   ├── models/
│   │   │   ├── schemas.py             # Pydantic request/response models
│   │   │   └── tower_schemas.py       # PyArrow schemas for Iceberg tables
│   │   ├── routers/
│   │   │   ├── chat.py                # /chat and /knowledge-base endpoints
│   │   │   ├── evaluation.py          # /evaluations endpoints
│   │   │   ├── escalation.py          # /escalations endpoints
│   │   │   ├── insights.py            # /insights endpoint
│   │   │   ├── properties.py          # /properties endpoint
│   │   │   └── tokens.py             # /tokens endpoints
│   │   ├── services/
│   │   │   ├── concierge.py           # RAG + LLM response generation
│   │   │   ├── knowledge_base.py      # Supabase pgvector: ingest + retrieve
│   │   │   ├── evaluation.py          # Automatic quality checks
│   │   │   ├── escalation.py          # Escalation workflow + PM replies
│   │   │   ├── tokens.py             # Guest token management
│   │   │   └── tower_persistence.py   # Tower table CRUD operations
│   │   └── utils/
│   │       └── email.py               # Email service (mock)
│   ├── supabase/
│   │   └── schema.sql                 # pgvector table + RPC function
│   ├── tower/
│   │   ├── Towerfile                  # Batch job configuration
│   │   └── aggregate_insights.py      # Insights aggregation pipeline
│   ├── pyproject.toml                 # Poetry dependencies
│   ├── seed.py                        # Demo data seeding script
│   └── .env.example                   # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root component with routing
│   │   ├── api.ts                     # Backend API client
│   │   ├── components/                # Reusable UI components
│   │   └── pages/
│   │       ├── GuestChatView.tsx      # Guest-facing chat interface
│   │       ├── PMDashboard.tsx        # Property manager dashboard
│   │       └── AdminPanel.tsx         # Knowledge base management
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── CLAUDE.md                          # AI assistant guidance
```

---

## Development

### Backend

```bash
cd backend

# Run the server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Format code
poetry run black app/

# Check formatting
poetry run black --check app/
```

### Frontend

```bash
cd frontend

# Dev server (HMR at localhost:5173)
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

### Adding a New Endpoint

1. Define request/response models in `backend/app/models/schemas.py`
2. Create or extend a router in `backend/app/routers/`
3. Implement business logic in `backend/app/services/`
4. Include the router in `backend/app/main.py`
