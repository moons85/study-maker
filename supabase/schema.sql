create extension if not exists "pgcrypto";

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  folder_id uuid,
  topic text not null,
  normalized_topic text not null,
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  current_stage text not null default 'beginner' check (current_stage in ('beginner', 'intermediate', 'advanced')),
  unlocked_stage text not null default 'beginner' check (unlocked_stage in ('beginner', 'intermediate', 'advanced')),
  question_count integer not null default 10 check (question_count = 10),
  question_types text[] not null default array[]::text[],
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  order_no integer not null,
  type text not null check (type in ('ox', 'multiple_choice', 'blank', 'short_answer', 'essay')),
  stage text not null default 'beginner' check (stage in ('beginner', 'intermediate', 'advanced')),
  question text not null,
  options jsonb,
  hint text not null,
  answer jsonb not null,
  explanation text not null,
  related_concept text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  anonymous_id text not null,
  answers jsonb not null,
  stage text not null default 'beginner' check (stage in ('beginner', 'intermediate', 'advanced')),
  hint_usage jsonb not null default '[]'::jsonb,
  score integer not null check (score between 0 and 100),
  unlocked_next_stage boolean not null default false,
  feedback jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.study_folders (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  name text not null,
  color text not null default '#58CC02',
  icon text not null default 'book',
  system_type text not null default 'custom',
  created_at timestamptz not null default now(),
  unique (anonymous_id, name)
);

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
  status text not null default 'pending',
  session_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes'
);

create table if not exists public.wrong_notes (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  topic text not null,
  stage text not null check (stage in ('beginner', 'intermediate', 'advanced')),
  question_type text not null,
  question text not null,
  user_answer text not null default '',
  correct_answer jsonb not null,
  explanation text not null,
  related_concept text,
  mistake_type text not null default 'concept_gap'
    check (mistake_type in ('concept_gap', 'condition_misread', 'careless', 'essay_incomplete', 'term_confusion')),
  hint_used boolean not null default false,
  review_count int not null default 0,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'archived')),
  next_review_at timestamptz not null default now() + interval '1 day',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (anonymous_id, question_id)
);

create table if not exists public.study_sources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.study_sessions(id) on delete cascade,
  topic text not null,
  title text not null,
  url text not null,
  source_type text not null
    check (source_type in ('official', 'encyclopedia', 'lecture', 'community')),
  reliability text not null
    check (reliability in ('high', 'medium', 'low')),
  summary text,
  used_for text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  unique (session_id, url)
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  ip_hash text not null,
  action text not null check (action in ('study_generate', 'study_grade')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists study_sessions_anonymous_id_created_at_idx
  on public.study_sessions (anonymous_id, created_at desc);

create index if not exists questions_session_id_order_no_idx
  on public.questions (session_id, order_no);

create index if not exists questions_session_stage_order_idx
  on public.questions (session_id, stage, order_no);

create index if not exists submissions_session_id_created_at_idx
  on public.submissions (session_id, created_at desc);

create index if not exists wrong_notes_anonymous_status_idx
  on public.wrong_notes (anonymous_id, status, next_review_at, created_at desc);

create index if not exists wrong_notes_session_idx
  on public.wrong_notes (session_id, created_at desc);

create index if not exists wrong_notes_related_concept_idx
  on public.wrong_notes (anonymous_id, related_concept);

create index if not exists study_sources_session_idx
  on public.study_sources (session_id, source_type, reliability);

create index if not exists study_sources_topic_idx
  on public.study_sources (topic, source_type);

create index if not exists wrong_notes_due_today_idx
  on public.wrong_notes (anonymous_id, status, next_review_at)
  where status = 'open';

create index if not exists ai_usage_events_anon_action_created_idx
  on public.ai_usage_events (anonymous_id, action, created_at desc);

create index if not exists ai_usage_events_ip_action_created_idx
  on public.ai_usage_events (ip_hash, action, created_at desc);

alter table public.study_sessions enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.study_folders enable row level security;
alter table public.ai_generation_cache enable row level security;
alter table public.generation_locks enable row level security;
alter table public.wrong_notes enable row level security;
alter table public.study_sources enable row level security;
alter table public.ai_usage_events enable row level security;

-- MVP에서는 Next.js 서버 라우트가 service role/secret key로 DB 쓰기를 담당합니다.
-- 클라이언트 직접 DB 접근은 열지 않습니다.
