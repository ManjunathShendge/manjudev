-- =============================================================================
-- 0002 — Row level security
--
-- Run after 0001. This file is the actual permission model; the app trusts it
-- rather than re-implementing the rules in the browser, because the browser is
-- where an attacker gets to edit the code.
--
-- The short version:
--   anyone           read published posts, categories, tags, author profiles
--   reader           the above, plus apply to contribute
--   contributor      write own posts, submit for review; cannot publish
--   editor           moderate everything; approve applications
--   admin            all of the above, plus grant roles
-- =============================================================================

alter table public.profiles                 enable row level security;
alter table public.categories               enable row level security;
alter table public.tags                     enable row level security;
alter table public.posts                    enable row level security;
alter table public.post_tags                enable row level security;
alter table public.post_revisions           enable row level security;
alter table public.contributor_applications enable row level security;

-- PostgREST reaches these tables as `anon` / `authenticated`; RLS above is what
-- actually decides who sees what.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.categories, public.tags,
                public.posts, public.post_tags to anon, authenticated;
grant insert, update, delete on public.profiles, public.categories, public.tags,
                public.posts, public.post_tags, public.contributor_applications
  to authenticated;
grant select on public.post_revisions, public.contributor_applications to authenticated;


-- ------------------------------------------------------------- profiles -----
drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Column-level grants cannot help here: every signed-in user is the same
-- database role, so "users update their own profile" would otherwise let
-- anyone hand themselves `admin`. The guard is a trigger instead.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- No JWT: this is the SQL editor or the service_role key, both of which
    -- are already trusted. This is also how the first admin gets promoted.
    if auth.uid() is null then return new; end if;
    if public.is_admin() then return new; end if;
    -- An editor may hand out authoring rights, but not moderation rights.
    if public.is_editor() and new.role in ('reader', 'contributor') then return new; end if;
    raise exception 'insufficient privilege to change role';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_trg on public.profiles;
create trigger guard_profile_role_trg before update on public.profiles
  for each row execute function public.guard_profile_role();


-- ----------------------------------------------------------- categories -----
drop policy if exists "categories are public" on public.categories;
create policy "categories are public"
  on public.categories for select using (true);

drop policy if exists "editors manage categories" on public.categories;
create policy "editors manage categories"
  on public.categories for all to authenticated
  using (public.is_editor()) with check (public.is_editor());


-- ----------------------------------------------------------------- tags -----
-- Categories are curated, tags are not: anyone who can write a post can coin a
-- tag, which is what keeps the tag list describing the actual writing.
drop policy if exists "tags are public" on public.tags;
create policy "tags are public"
  on public.tags for select using (true);

drop policy if exists "writers create tags" on public.tags;
create policy "writers create tags"
  on public.tags for insert to authenticated with check (public.can_write());

drop policy if exists "editors manage tags" on public.tags;
create policy "editors manage tags"
  on public.tags for all to authenticated
  using (public.is_editor()) with check (public.is_editor());


-- ---------------------------------------------------------------- posts -----
-- Three permissive SELECT policies, OR'd together: the public sees published
-- work, you always see your own, editors see everything.
drop policy if exists "published posts are public" on public.posts;
create policy "published posts are public"
  on public.posts for select
  using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists "authors read their own posts" on public.posts;
create policy "authors read their own posts"
  on public.posts for select to authenticated using (author_id = auth.uid());

drop policy if exists "editors read every post" on public.posts;
create policy "editors read every post"
  on public.posts for select to authenticated using (public.is_editor());

-- A contributor can create a post and submit it. The `status` clause is the
-- part that matters: it is what stops them publishing themselves.
drop policy if exists "writers create their own posts" on public.posts;
create policy "writers create their own posts"
  on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_write()
    and (public.is_editor() or status in ('draft', 'in_review'))
  );

drop policy if exists "authors edit their own unpublished posts" on public.posts;
create policy "authors edit their own unpublished posts"
  on public.posts for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'in_review', 'changes_requested'))
  with check (author_id = auth.uid() and status in ('draft', 'in_review'));

drop policy if exists "editors edit any post" on public.posts;
create policy "editors edit any post"
  on public.posts for update to authenticated
  using (public.is_editor()) with check (public.is_editor());

drop policy if exists "authors delete their own drafts" on public.posts;
create policy "authors delete their own drafts"
  on public.posts for delete to authenticated
  using (author_id = auth.uid() and status in ('draft', 'changes_requested'));

drop policy if exists "editors delete any post" on public.posts;
create policy "editors delete any post"
  on public.posts for delete to authenticated using (public.is_editor());


-- ------------------------------------------------------------ post_tags -----
-- No rules of its own — a join row is exactly as visible, and as editable, as
-- the post it hangs off. The subquery inherits the policies above.
drop policy if exists "post tags follow their post" on public.post_tags;
create policy "post tags follow their post"
  on public.post_tags for select
  using (exists (select 1 from public.posts p where p.id = post_id));

drop policy if exists "writers manage tags on their posts" on public.post_tags;
create policy "writers manage tags on their posts"
  on public.post_tags for all to authenticated
  using (
    exists (
      select 1 from public.posts p
       where p.id = post_id and (p.author_id = auth.uid() or public.is_editor())
    )
  )
  with check (
    exists (
      select 1 from public.posts p
       where p.id = post_id and (p.author_id = auth.uid() or public.is_editor())
    )
  );


-- ------------------------------------------------------- post_revisions -----
-- Read-only from the app's side; the snapshot trigger is `security definer`
-- and is the only thing that ever inserts.
drop policy if exists "authors and editors read revisions" on public.post_revisions;
create policy "authors and editors read revisions"
  on public.post_revisions for select to authenticated
  using (
    exists (
      select 1 from public.posts p
       where p.id = post_id and (p.author_id = auth.uid() or public.is_editor())
    )
  );


-- --------------------------------------------- contributor applications -----
drop policy if exists "users submit their own application" on public.contributor_applications;
create policy "users submit their own application"
  on public.contributor_applications for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users read their own application" on public.contributor_applications;
create policy "users read their own application"
  on public.contributor_applications for select to authenticated
  using (user_id = auth.uid() or public.is_editor());

drop policy if exists "editors decide applications" on public.contributor_applications;
create policy "editors decide applications"
  on public.contributor_applications for update to authenticated
  using (public.is_editor()) with check (public.is_editor());

drop policy if exists "admins delete applications" on public.contributor_applications;
create policy "admins delete applications"
  on public.contributor_applications for delete to authenticated
  using (public.is_admin());

-- Approving an application is one action, so it is one write. The role change
-- rides along in a trigger rather than being a second request the client could
-- fail to make.
create or replace function public.apply_application_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();

    if new.status = 'approved' then
      update public.profiles
         set role = 'contributor'
       where id = new.user_id
         and role = 'reader';   -- never demote an editor who happens to apply
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists apply_application_decision_trg on public.contributor_applications;
create trigger apply_application_decision_trg
  before update on public.contributor_applications
  for each row execute function public.apply_application_decision();
