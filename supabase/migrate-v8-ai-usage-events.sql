create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  ip_hash text not null,
  action text not null check (action in ('study_generate', 'study_grade')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_anon_action_created_idx
  on public.ai_usage_events (anonymous_id, action, created_at desc);

create index if not exists ai_usage_events_ip_action_created_idx
  on public.ai_usage_events (ip_hash, action, created_at desc);

alter table public.ai_usage_events enable row level security;

select pg_notify('pgrst', 'reload schema');
