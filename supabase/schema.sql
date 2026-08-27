-- Groundwork schema — run once in the Supabase SQL editor.
-- Access is server-side only via the service key; RLS stays enabled with no
-- public policies, so the anon key can read/write nothing.

create extension if not exists "pgcrypto";

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  theme text not null,
  prompt text not null,
  helper text not null default '',
  source_refs text[] not null default '{}',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('async', 'live')),
  name text not null,
  role text not null,
  team text not null default '',
  email text not null default '',
  session_name text,
  session_date date,
  attendees jsonb not null default '[]',
  resume_token uuid not null unique default gen_random_uuid(),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses (id) on delete cascade,
  question_id uuid not null references questions (id) on delete cascade,
  body text not null default '',
  is_unsure boolean not null default false,
  is_skipped boolean not null default false,
  speaker text,
  covered boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (response_id, question_id)
);

create index if not exists answers_response_idx on answers (response_id);
create index if not exists answers_question_idx on answers (question_id);

alter table questions enable row level security;
alter table responses enable row level security;
alter table answers enable row level security;
