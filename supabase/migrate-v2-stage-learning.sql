create extension if not exists "pgcrypto";

create table if not exists public.study_folders (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  name text not null,
  color text not null default '#58CC02',
  icon text not null default 'book',
  system_type text not null default 'custom'
    check (system_type in ('all', 'recent', 'favorite', 'wrong_review', 'custom')),
  created_at timestamptz not null default now(),
  unique (anonymous_id, name)
);

alter table public.study_sessions
  add column if not exists folder_id uuid references public.study_folders(id) on delete set null,
  add column if not exists normalized_topic text,
  add column if not exists current_stage text not null default 'beginner'
    check (current_stage in ('beginner', 'intermediate', 'advanced')),
  add column if not exists unlocked_stage text not null default 'beginner'
    check (unlocked_stage in ('beginner', 'intermediate', 'advanced'));

alter table public.study_sessions
  alter column level set default 'beginner',
  alter column question_count set default 10,
  alter column question_types set default array[]::text[];

update public.study_sessions
set normalized_topic = topic
where normalized_topic is null;

alter table public.study_sessions
  alter column normalized_topic set not null;

alter table public.questions
  add column if not exists stage text not null default 'beginner'
    check (stage in ('beginner', 'intermediate', 'advanced')),
  add column if not exists hint text,
  add column if not exists related_concept text;

update public.questions
set hint = '핵심 개념과 문제의 표현을 다시 연결해보세요.'
where hint is null;

update public.questions
set related_concept = '핵심 개념'
where related_concept is null;

alter table public.questions
  alter column hint set not null,
  alter column related_concept set not null;

alter table public.submissions
  add column if not exists stage text not null default 'beginner'
    check (stage in ('beginner', 'intermediate', 'advanced')),
  add column if not exists hint_usage jsonb not null default '[]'::jsonb,
  add column if not exists unlocked_next_stage boolean not null default false;

create table if not exists public.ai_generation_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  normalized_topic text not null,
  stage text not null check (stage in ('beginner', 'intermediate', 'advanced')),
  content jsonb not null,
  questions jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table if not exists public.generation_locks (
  lock_key text primary key,
  anonymous_id text not null,
  normalized_topic text not null,
  stage text not null check (stage in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  session_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes'
);

create index if not exists study_folders_anonymous_id_idx
  on public.study_folders (anonymous_id, created_at desc);

create index if not exists study_sessions_topic_stage_idx
  on public.study_sessions (anonymous_id, normalized_topic, current_stage, created_at desc);

create index if not exists questions_session_stage_order_idx
  on public.questions (session_id, stage, order_no);

create index if not exists ai_generation_cache_key_idx
  on public.ai_generation_cache (cache_key, expires_at);

alter table public.study_folders enable row level security;
alter table public.ai_generation_cache enable row level security;
alter table public.generation_locks enable row level security;

select pg_notify('pgrst', 'reload schema');

