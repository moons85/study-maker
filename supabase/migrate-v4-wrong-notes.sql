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

create index if not exists wrong_notes_anonymous_status_idx
  on public.wrong_notes (anonymous_id, status, next_review_at, created_at desc);

create index if not exists wrong_notes_session_idx
  on public.wrong_notes (session_id, created_at desc);

create index if not exists wrong_notes_related_concept_idx
  on public.wrong_notes (anonymous_id, related_concept);

alter table public.wrong_notes enable row level security;

select pg_notify('pgrst', 'reload schema');
