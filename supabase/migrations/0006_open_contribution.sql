-- =============================================================================
-- 0006 — Open contribution
--
-- Run after 0002. Reversible; see the bottom of this file.
--
-- 0002 shipped a closed door: signing up made you a `reader`, and writing
-- access arrived only when a human approved your application. This opens it —
-- a confirmed email address is now enough to write.
--
-- What this does NOT change is publishing. Contributors still cannot put
-- anything on the live site; a post goes `draft → in_review` and an editor
-- decides. That distinction is the point. Opening the write gate costs you a
-- queue to read. Opening the publish gate would let a stranger put arbitrary
-- content on your domain, and no amount of convenience is worth that.
--
-- The approval flow is not deleted. The applications table, the review screen
-- and the policies all still work — they are just no longer the only way in,
-- so `/studio/apply` becomes something people use when they want to introduce
-- themselves rather than something they have to clear.
-- =============================================================================

-- One function decides the default, so reversing this is a one-line change
-- rather than an edit to trigger logic.
create or replace function public.default_new_user_role()
returns public.user_role
language sql
immutable
as $$
  select 'contributor'::public.user_role;
$$;


-- Same trigger as 0001, now asking that function instead of relying on the
-- column default.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    public.default_new_user_role()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- Anyone who signed up under the old rule and is still waiting. Editors and
-- admins are left alone — this only lifts readers.
update public.profiles
   set role = 'contributor'
 where role = 'reader';


-- Applications already in the queue are now moot as a gate, but leaving them
-- `pending` forever is untidy and would keep nagging the review screen.
update public.contributor_applications
   set status      = 'approved',
       review_note = coalesce(review_note, 'Auto-approved: the blog is open to contributors.'),
       reviewed_at = now()
 where status = 'pending';


-- ------------------------------------------------------------- reverting ----
-- To close it again, put the default back and demote whoever has not written
-- anything yet. Existing contributors keep their access either way — taking
-- writing rights away from someone who already has drafts is a different
-- decision, and should be a deliberate one.
--
--   create or replace function public.default_new_user_role()
--   returns public.user_role language sql immutable as $$
--     select 'reader'::public.user_role;
--   $$;
--
--   update public.profiles p
--      set role = 'reader'
--    where p.role = 'contributor'
--      and not exists (select 1 from public.posts where author_id = p.id);
