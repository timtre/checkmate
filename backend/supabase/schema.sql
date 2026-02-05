-- Enable pgvector extension
create extension if not exists vector;

-- Knowledge base table for RAG
create table if not exists knowledge_base (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null,
    property_id text not null,
    title text not null,
    chunk_index integer not null default 0,
    content text not null,
    category text default 'general',
    metadata jsonb default '{}',
    embedding vector(1536),  -- text-embedding-3-small dimension
    created_at timestamptz default now()
);

-- Index for vector similarity search
create index if not exists knowledge_base_embedding_idx
    on knowledge_base using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- Index for property filtering
create index if not exists knowledge_base_property_idx
    on knowledge_base (property_id);

-- Guest tokens for tokenized access links
create table if not exists guest_tokens (
    id uuid primary key default gen_random_uuid(),
    token text unique not null,
    property_id text not null,
    guest_name text,
    created_at timestamptz default now(),
    expires_at timestamptz
);

create index if not exists guest_tokens_token_idx on guest_tokens (token);
create index if not exists guest_tokens_property_idx on guest_tokens (property_id);

-- Properties
create table if not exists properties (
    property_id text primary key,
    name text not null default '',
    image_url text default '',
    created_at timestamptz default now()
);

-- Conversations
create table if not exists conversations (
    conversation_id text primary key,
    property_id text not null,
    guest_name text default 'Guest',
    started_at timestamptz default now(),
    last_message_at timestamptz default now(),
    message_count integer default 0,
    escalation_count integer default 0
);

create index if not exists conversations_property_idx on conversations (property_id);

-- Messages
create table if not exists messages (
    message_id text primary key,
    conversation_id text not null references conversations(conversation_id),
    property_id text not null,
    role text not null,
    content text not null,
    confidence float default 0.0,
    sources_json text default '[]',
    escalated boolean not null default false,
    created_at timestamptz default now()
);

create index if not exists messages_conversation_idx on messages (conversation_id);
create index if not exists messages_property_idx on messages (property_id);

-- Evaluations
create table if not exists evaluations (
    evaluation_id text primary key,
    conversation_id text not null,
    message_id text not null,
    property_id text not null,
    verdict text not null,
    confidence float default 0.0,
    reasons_json text default '[]',
    escalation_id text default '',
    created_at timestamptz default now()
);

create index if not exists evaluations_property_idx on evaluations (property_id);

-- Escalations
create table if not exists escalations (
    escalation_id text primary key,
    property_id text not null,
    conversation_id text not null,
    message_id text not null,
    guest_message text not null,
    ai_answer text not null,
    confidence float default 0.0,
    reason text not null,
    status text default 'open',
    pm_reply text default '',
    replied_by text default '',
    kb_suggestion_id text default '',
    created_at timestamptz default now(),
    replied_at timestamptz
);

create index if not exists escalations_property_idx on escalations (property_id);

-- Knowledge Base Suggestions (drafted from PM replies to escalations)
create table if not exists kb_suggestions (
    suggestion_id text primary key,
    property_id text not null,
    title text not null,
    content text not null,
    category text default 'general',
    source_escalation_ids text[] default '{}',
    status text default 'pending',
    created_at timestamptz default now(),
    reviewed_at timestamptz
);

create index if not exists kb_suggestions_property_idx on kb_suggestions (property_id);
create index if not exists kb_suggestions_status_idx on kb_suggestions (property_id, status);

-- Question patterns
create table if not exists question_patterns (
    pattern_id text primary key,
    property_id text not null,
    question_pattern text not null,
    count integer default 1,
    avg_confidence float default 0.0,
    escalation_count integer default 0,
    last_asked_at timestamptz default now()
);

create index if not exists question_patterns_property_idx on question_patterns (property_id);
create unique index if not exists question_patterns_unique_idx
    on question_patterns (property_id, question_pattern);

-- Escalation insights (aggregated by Tower batch job)
create table if not exists escalation_insights (
    insight_id text primary key,
    property_id text not null,
    reason text not null,
    escalation_count integer default 0,
    avg_confidence float default 0.0,
    sample_questions text[] default '{}',
    last_seen_at timestamptz default now(),
    created_at timestamptz default now()
);

create index if not exists escalation_insights_property_idx
    on escalation_insights (property_id);

-- Batch suggestions (LLM-generated by Tower batch job)
create table if not exists batch_suggestions (
    suggestion_id text primary key,
    property_id text not null,
    suggestion_type text not null,
    title text not null,
    content text not null,
    reasoning text default '',
    source_patterns text[] default '{}',
    status text default 'pending',
    created_at timestamptz default now()
);

create index if not exists batch_suggestions_property_idx
    on batch_suggestions (property_id);
create index if not exists batch_suggestions_status_idx
    on batch_suggestions (property_id, status);

-- Category suggestions (LLM-suggested new categories from "other" escalations)
create table if not exists category_suggestions (
    suggestion_id text primary key,
    property_id text not null,
    suggested_category text not null,
    description text not null,
    reasoning text default '',
    source_escalation_ids text[] default '{}',
    sample_questions text[] default '{}',
    escalation_count integer default 0,
    status text default 'pending',  -- pending, approved, dismissed
    created_at timestamptz default now(),
    reviewed_at timestamptz
);

create index if not exists category_suggestions_property_idx
    on category_suggestions (property_id);
create index if not exists category_suggestions_status_idx
    on category_suggestions (property_id, status);

-- Aggregation runs (tracks Tower job progress)
create table if not exists aggregation_runs (
    run_id text primary key,
    property_id text not null,
    phase int default 0,
    phase_name text default '',
    status text default 'pending',
    percent int default 0,
    detail text default '',
    overall_percent int default 0,
    tower_run_number int,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists aggregation_runs_property_idx
    on aggregation_runs (property_id);
create index if not exists aggregation_runs_status_idx
    on aggregation_runs (property_id, status);

-- Property prompt rules (approved prompt_update suggestions)
create table if not exists property_prompt_rules (
    rule_id text primary key,
    property_id text not null,
    title text not null,
    content text not null,
    source_suggestion_id text,
    active boolean default true,
    created_at timestamptz default now()
);

create index if not exists property_prompt_rules_property_idx
    on property_prompt_rules (property_id);
create index if not exists property_prompt_rules_active_idx
    on property_prompt_rules (property_id, active);

-- RPC function for similarity search with property filtering
create or replace function match_knowledge_base(
    query_embedding vector(1536),
    match_count int default 5,
    filter_property_id text default '',
    similarity_threshold float default 0.3
)
returns table (
    id uuid,
    document_id uuid,
    property_id text,
    title text,
    content text,
    category text,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        kb.id,
        kb.document_id,
        kb.property_id,
        kb.title,
        kb.content,
        kb.category,
        1 - (kb.embedding <=> query_embedding) as similarity
    from knowledge_base kb
    where
        (filter_property_id = '' or kb.property_id = filter_property_id)
        and 1 - (kb.embedding <=> query_embedding) > similarity_threshold
    order by kb.embedding <=> query_embedding
    limit match_count;
end;
$$;
