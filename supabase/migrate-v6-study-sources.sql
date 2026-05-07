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

create index if not exists study_sources_session_idx
  on public.study_sources (session_id, source_type, reliability);

create index if not exists study_sources_topic_idx
  on public.study_sources (topic, source_type);

alter table public.study_sources enable row level security;

select pg_notify('pgrst', 'reload schema');
