-- Per-client notes on individual calls
create table if not exists public.call_notes (
  id uuid primary key default gen_random_uuid(),
  portal_user_id uuid not null,
  call_id text not null,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  unique (portal_user_id, call_id)
);

create index if not exists call_notes_user_call_idx
  on public.call_notes (portal_user_id, call_id);

alter table public.call_notes enable row level security;
