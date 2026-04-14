-- Portal users table — one row per client login
create extension if not exists "pgcrypto";

create table if not exists public.portal_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  agent_id text not null,
  flow_id text,
  access_token text not null unique,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  email_sent_at timestamptz
);

create unique index if not exists portal_users_email_agent_idx
  on public.portal_users (lower(email), agent_id);

create index if not exists portal_users_token_idx
  on public.portal_users (access_token);

-- Service-role only; no public access via RLS
alter table public.portal_users enable row level security;
