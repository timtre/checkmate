-- Property prompt rules (approved prompt_update suggestions)
-- These are appended to the system prompt for property-specific AI behavior

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
