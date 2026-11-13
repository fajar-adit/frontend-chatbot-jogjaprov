-- Dedicated tables for Laras chatbot service.
-- Run in Supabase Dashboard -> SQL Editor using an administrator account.
-- RAGFlow itself owns the document index; these tables store only chat sessions/history.

create extension if not exists pgcrypto;

create table if not exists public.laras_chatbot_sessions (
    id uuid primary key default gen_random_uuid(),
    ragflow_chat_id text not null,
    ragflow_session_id text null,
    title text not null default 'Percakapan baru',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.laras_chatbot_messages (
    id bigint generated always as identity primary key,
    session_id uuid not null references public.laras_chatbot_sessions(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    sources jsonb not null default '{"chunks":[]}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_laras_bot_messages_session_created
    on public.laras_chatbot_messages(session_id, created_at, id);

create index if not exists idx_laras_bot_sessions_updated
    on public.laras_chatbot_sessions(updated_at desc);

-- No browser/anon policies are created. Access this database only through the Go service.
-- Keep DATABASE_URL secret in the backend environment; do not put it in VITE_* variables.
alter table public.laras_chatbot_sessions enable row level security;
alter table public.laras_chatbot_messages enable row level security;
