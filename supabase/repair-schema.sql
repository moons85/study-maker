-- Run this if tables were created before the latest schema.sql was applied.
-- Supabase SQL Editor에서 그대로 실행하세요.

alter table public.questions
  add column if not exists order_no integer;

update public.questions
set order_no = 1
where order_no is null;

alter table public.questions
  alter column order_no set not null;

create index if not exists questions_session_id_order_no_idx
  on public.questions (session_id, order_no);

