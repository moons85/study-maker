-- V7 review scheduling uses existing wrong_notes columns:
-- review_count, status, next_review_at.
--
-- Policy:
-- - status='open' means the note remains in the review queue.
-- - next_review_at controls whether the note is due today.
-- - completing a review increments review_count and pushes next_review_at forward.

create index if not exists wrong_notes_due_today_idx
  on public.wrong_notes (anonymous_id, status, next_review_at)
  where status = 'open';

select pg_notify('pgrst', 'reload schema');
