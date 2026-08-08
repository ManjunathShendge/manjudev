-- =============================================================================
-- 0007 — Remove the application flow
--
-- Run after 0006. This is destructive: it drops the applications table and
-- everything hanging off it. Nothing in the app reads it any more — the apply
-- form and the review screen are gone from the codebase too — so what is left
-- is a table nobody writes to and nobody reads.
--
-- If you might want the approval gate back, DO NOT RUN THIS. 0006 alone
-- already opens the blog up, and leaving these objects in place costs nothing
-- but a few kilobytes. This file is for when the decision has settled.
--
-- Access now works one way: confirm your email, get the editor. Publishing is
-- still an editor's call, which is the gate that actually protects the site.
-- =============================================================================

-- Triggers and functions first — 0004's notifier reads the table, so dropping
-- the table underneath it would leave a trigger that errors on every insert.
drop trigger if exists notify_new_application_trg on public.contributor_applications;
drop function if exists public.notify_new_application();

drop trigger if exists apply_application_decision_trg on public.contributor_applications;
drop function if exists public.apply_application_decision();

-- Policies go with the table, but naming them keeps this readable as a record
-- of what existed.
drop policy if exists "users submit their own application"          on public.contributor_applications;
drop policy if exists "users read their own application"            on public.contributor_applications;
drop policy if exists "editors decide applications"                 on public.contributor_applications;
drop policy if exists "admins delete applications"                  on public.contributor_applications;
drop policy if exists "users withdraw their own pending application" on public.contributor_applications;

drop table if exists public.contributor_applications;

drop type if exists public.application_status;
