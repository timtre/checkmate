# Checkmate: AI Concierge for Vacation Rentals

> Property-scoped AI concierge with automatic quality control and continuous learning

## Problem Statement

Vacation rental property managers face a constant challenge: guests expect instant, accurate answers at any hour, but hiring 24/7 support staff is not economical. Generic chatbots fail because every property has unique details (door codes, parking instructions, house rules, local tips).

**Checkmate** solves this by combining:
- **Property-scoped RAG** for accurate, contextual answers
- **Automatic quality evaluation** to catch low-confidence or unsatisfactory responses
- **Intelligent escalation** to property managers when needed
- **Continuous learning** via Tower batch analytics that identify knowledge gaps

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.11+), Uvicorn |
| Frontend | React 18.3 + Vite + TypeScript (built with **Lovable**) |
| Vector Database | Supabase pgvector (1536-dim IVFFlat index) |
| LLM & Embeddings | OpenAI API (`text-embedding-3-small`, `gpt-5.1`) |
| Primary Data Store | Supabase PostgreSQL |
| Batch Processing | **Tower SDK** + Polars + PyArrow |
| UI Components | shadcn/ui, Radix UI, Tailwind CSS |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GUEST APP (React)                              │
│                         Token-based access per guest                        │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ REST API
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI BACKEND                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Chat Router  │  │  Evaluation  │  │  Escalation  │  │   Insights   │    │
│  │              │  │   Service    │  │   Service    │  │   Router     │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │            │
│         ▼                 ▼                 ▼                 ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CONCIERGE SERVICE (RAG + LLM)                  │   │
│  │                                                                     │   │
│  │  1. Embed guest question (text-embedding-3-small)                   │   │
│  │  2. Retrieve property context via pgvector similarity search        │   │
│  │  3. Lookup Tower pattern insights for confidence calibration        │   │
│  │  4. Generate response with OpenAI (gpt-5.1)                         │   │
│  │  5. Auto-evaluate confidence + escalation triggers                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐
│    SUPABASE     │    │     OPENAI      │    │        TOWER SDK            │
│                 │    │                 │    │                             │
│ - knowledge_base│    │ - Embeddings    │    │ Batch Jobs:                 │
│   (pgvector)    │    │ - Chat (gpt-5.1)│    │ 1. aggregate_insights.py    │
│ - conversations │    │                 │    │ 2. compute_embeddings.py    │
│ - messages      │    └─────────────────┘    │ 3. generate_kb_suggestions  │
│ - evaluations   │                           │                             │
│ - escalations   │◄──────────────────────────│ Writes aggregated insights  │
│ - question_     │                           │ back to Supabase for        │
│   patterns      │                           │ real-time AI consumption    │
│ - batch_        │                           │                             │
│   suggestions   │                           └─────────────────────────────┘
└─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPS CENTER (React)                                │
│  Property Manager Dashboard: Inbox, Knowledge Base, Analytics               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Guest Chat Interface (guest-app)

**Token-based secure access**: Each guest receives a unique URL (`/chat/{token}`) that grants access only to their property's concierge.

**Real-time AI responses with confidence scoring**: Every response includes an internal confidence score (0.0 to 1.0) based on:
- How well the knowledge base covers the question
- How specific and complete the answer is
- Historical performance on similar questions (from Tower insights)

**Property context retrieval via pgvector**: Questions are embedded and matched against property-specific knowledge base documents using cosine similarity search with a 0.3 threshold.

```sql
-- Vector similarity search with property filtering
SELECT content, 1 - (embedding <=> query_embedding) as similarity
FROM knowledge_base
WHERE property_id = $1 AND similarity > 0.3
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

### 2. Property Manager Dashboard (ops-center)

**Escalation Inbox**: View and respond to escalated conversations. PM replies are injected directly into the guest conversation.

**Knowledge Base Management**: Add, edit, and organize property documentation. Content is automatically chunked and embedded for RAG retrieval.

**Analytics & Insights**: View question patterns, confidence trends, and escalation themes aggregated by Tower batch jobs.

### 3. Automatic Evaluation Pipeline

Every AI response is automatically evaluated for escalation triggers:

| Trigger | Description |
|---------|-------------|
| `safety` | Gas leak, fire, flooding, injury, break-in, medical emergency |
| `access_blocked` | Locked out, wrong code, key missing, lockbox broken |
| `maintenance_urgent` | No hot water/electricity, plumbing leak, HVAC failure |
| `dissatisfied` | Explicit frustration with AI or guest asks for human |
| `cannot_answer` | Property-specific question not in KB that affects stay |
| `repeated_unanswered` | Same question asked multiple times without resolution |

Escalations are created automatically and property managers receive notifications.

### 4. Tower Batch Analytics

Three batch jobs power continuous learning:

#### Job 1: `aggregate_insights.py`
Aggregates conversation data into actionable insights:
- Question pattern frequency and confidence metrics
- Escalation theme grouping with sample questions
- LLM-generated KB suggestions based on knowledge gaps

#### Job 2: `compute_embeddings.py`
Pre-computes embeddings for question patterns, enabling:
- Real-time similarity lookup during inference
- Historical confidence calibration for new questions
- "Similar questions have had low confidence" warnings

#### Job 3: `generate_kb_suggestions.py`
Analyzes PM replies to escalations and drafts KB articles:
- Groups related escalations by topic
- Uses OpenAI to synthesize clear KB entries
- Surfaces suggestions for PM approval

**Progress Tracking via SSE**: Jobs write progress to `aggregation_runs` table, enabling real-time progress UI in ops-center.

---

## OpenAI Integration

### RAG Pipeline

1. **Query Embedding**: Guest message → `text-embedding-3-small` → 1536-dim vector
2. **Context Retrieval**: Vector similarity search against `knowledge_base` table
3. **Dynamic Prompt Enhancement**: System prompt augmented with:
   - Known knowledge gaps for this property
   - Tower pattern insights (historical confidence data)
4. **Response Generation**: `gpt-5.1` with structured output format:
   ```
   ANSWER: <response to guest>
   CONFIDENCE: <0.0 to 1.0>
   ESCALATE: <true or false>
   ESCALATE_REASON: <none|safety|access_blocked|...>
   ```

### Confidence Calibration with Tower Data

The concierge service reads pre-computed pattern embeddings during inference:

```python
# Find similar historical questions
tower_patterns = _get_similar_patterns_from_tower(query_embedding, property_id)

# Warn about topics with historically low confidence
if pattern["avg_confidence"] < 0.6 and pattern["similarity"] > 0.7:
    prompt += f"Tower Analytics: Similar questions have had low confidence..."
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `knowledge_base` | RAG documents with pgvector embeddings |
| `guest_tokens` | Token-based access control |
| `conversations` | Chat session metadata |
| `messages` | Individual messages with confidence + escalation flags |
| `evaluations` | Quality assessment records |
| `escalations` | Escalated conversations awaiting PM response |
| `question_patterns` | Aggregated question frequency + confidence |
| `pattern_embeddings` | Pre-computed embeddings for pattern similarity |
| `batch_suggestions` | LLM-generated KB improvement suggestions |
| `aggregation_runs` | Tower job progress tracking |

---

## Demo Walkthrough

### Setup
- Backend running on `localhost:8000`
- Guest app on `localhost:5173` (guest-app)
- Ops center on `localhost:5174` (ops-center)
- Seed data loaded for demo property

### Step 1: Guest Sends a Message
1. Open guest app with valid token: `/chat/{token}`
2. Send: "What's the WiFi password?"
3. **Show**: AI responds with high confidence using KB context

### Step 2: Low Confidence Triggers Escalation
1. Ask a question not in KB: "Where can I store my surfboard?"
2. **Show**: AI responds with lower confidence, acknowledges uncertainty
3. **Explain**: Response is auto-evaluated, escalation created

### Step 3: PM Receives Notification
1. Switch to ops-center
2. Navigate to Inbox
3. **Show**: New escalation card with guest question + AI answer

### Step 4: PM Replies
1. Click escalation to view details
2. Type reply: "You can store surfboards in the garage. Code is 4521."
3. Submit reply
4. **Show**: Reply appears in guest conversation (via polling)

### Step 5: Tower Aggregation
1. Trigger batch job: `poetry run tower run`
2. **Show**: Progress tracking in ops-center Analytics page
3. Explain 3 phases: Pattern aggregation → Escalation analysis → AI suggestions

### Step 6: KB Suggestion Generated
1. Navigate to Knowledge Base page
2. **Show**: Pending suggestion drafted from PM's surfboard reply
3. Approve suggestion → Added to knowledge base

### Step 7: Verify Learning
1. Return to guest app (new conversation)
2. Ask: "Where do I put my surfboard?"
3. **Show**: AI now answers confidently using new KB entry

---

## Running the Demo

```bash
# Terminal 1: Backend
cd backend && poetry run uvicorn app.main:app --reload --port 8000

# Terminal 2: Guest App
cd guest-app && npm run dev

# Terminal 3: Ops Center
cd ops-center && npm run dev

# Seed demo data (if needed)
cd backend && poetry run python seed.py

# Trigger Tower batch job
cd backend && poetry run tower run --parameter=property_id=<uuid>
```

---

## Summary

Checkmate demonstrates a production-ready AI concierge system that:

1. **Answers accurately** using property-scoped RAG with pgvector
2. **Knows its limits** via confidence scoring and automatic escalation
3. **Learns continuously** through Tower batch analytics
4. **Empowers property managers** with actionable insights and KB suggestions

The combination of real-time RAG inference with batch analytics creates a system that improves over time while maintaining human oversight for edge cases.
