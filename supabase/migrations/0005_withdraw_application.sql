-- =============================================================================
-- 0005 — Let people withdraw their own application
--
-- Run after 0002 (and after 0004 if you are using notifications).
--
-- 0002 gave applicants insert and select on their own row, and nothing else —
-- which made submitting a one-way door. An application is a request, and a
-- request you cannot take back is a trap: the usual reason to withdraw is
-- wanting to rewrite a pitch, not changing your mind about writing.
--
-- The `status = 'pending'` clause is the whole rule. Once someone has read it
-- and made a decision, that decision is a record — withdrawing an approval to
-- escape it, or a rejection to erase it, are both things this should not allow.
-- =============================================================================

drop policy if exists "users withdraw their own pending application"
  on public.contributor_applications;

create policy "users withdraw their own pending application"
  on public.contributor_applications for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

-- The DELETE grant already exists from 0002; this is only the policy that
-- decides which rows it applies to.
