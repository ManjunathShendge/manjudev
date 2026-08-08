-- =============================================================================
-- 0001 — Blog schema
--
-- Run this first, in the Supabase SQL editor (or `supabase db push`).
-- It is written to be re-runnable: every object is guarded, so re-running it
-- after an edit will not destroy content.
--
-- Shape of the thing, in one paragraph: a post belongs to one author and one
-- category, carries many tags, and moves through a status workflow
-- (draft → in_review → published) that decides who is allowed to see it. Roles
-- live on the profile. Everything else here exists to serve that.
-- =============================================================================

-- ---------------------------------------------------------------- enums -----
-- `create type` has no `if not exists`, hence the swallow.
do $$ begin
  create type public.user_role as enum ('reader', 'contributor', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum (
    'draft',              -- private to the author
    'in_review',          -- submitted, waiting on an editor
    'changes_requested',  -- sent back with a note
    'scheduled',          -- approved, goes live at scheduled_for
    'published',          -- public
    'archived'            -- taken down, kept
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;


-- ------------------------------------------------------------- profiles -----
-- One row per auth user, created by trigger. Deliberately holds no email:
-- this table is world-readable so bylines work for logged-out visitors, and an
-- email address is not something a byline needs.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  avatar_url   text,
  bio          text,
  website      text,
  github_url   text,
  linkedin_url text,
  twitter_url  text,
  role         public.user_role not null default 'reader',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);


-- ----------------------------------------------------------- categories -----
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  -- Hex colour used for the chip in the UI. Falls back to gold when null.
  color       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);


-- ----------------------------------------------------------------- tags -----
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------- posts -----
create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,

  cover_url       text,
  cover_alt       text,

  -- Rich text, authored in TipTap. Sanitised again on render — a contributor
  -- is a semi-trusted author, not a trusted one.
  body_html       text not null default '',
  -- Plain-text twin, written by the client. Drives search and reading time;
  -- keeping it separate means neither has to parse HTML in the database.
  body_text       text not null default '',

  category_id     uuid references public.categories (id) on delete set null,
  author_id       uuid not null references public.profiles (id) on delete cascade,

  status          public.post_status not null default 'draft',
  featured        boolean not null default false,
  reading_minutes int not null default 1,

  published_at    timestamptz,
  scheduled_for   timestamptz,

  seo_title       text,
  seo_description text,
  og_image_url    text,
  canonical_url   text,

  -- Editor feedback, shown to the author on the post they submitted.
  review_note     text,
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,

  view_count      bigint not null default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- `to_tsvector(regconfig, text)` is immutable when the config is a literal,
  -- which is what lets this be a stored generated column rather than a trigger.
  search          tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(body_text, '')
    )
  ) stored
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc);
create index if not exists posts_author_idx   on public.posts (author_id);
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_featured_idx on public.posts (featured) where featured;
create index if not exists posts_search_idx   on public.posts using gin (search);


-- ------------------------------------------------------------ post_tags -----
create table if not exists public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id  uuid not null references public.tags  (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists post_tags_tag_idx on public.post_tags (tag_id);


-- ------------------------------------------------ post revision history -----
-- A snapshot of the body as it was *before* each edit, so a bad save is
-- recoverable. Written by trigger; nothing in the app inserts here.
create table if not exists public.post_revisions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  title      text,
  excerpt    text,
  body_html  text,
  saved_by   uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists post_revisions_post_idx
  on public.post_revisions (post_id, created_at desc);


-- --------------------------------------------- contributor applications -----
-- The verification gate. Signing up gets you a confirmed email and nothing
-- else; writing access is granted by a human after reading this.
create table if not exists public.contributor_applications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.profiles (id) on delete cascade,
  full_name          text not null,
  email              text not null,
  bio                text not null,
  portfolio_url      text,
  writing_sample_url text,
  topics             text[] not null default '{}',
  pitch              text not null,
  status             public.application_status not null default 'pending',
  review_note        text,
  reviewed_by        uuid references public.profiles (id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists contributor_applications_status_idx
  on public.contributor_applications (status, created_at desc);


-- ============================================================================
-- Functions and triggers
-- ============================================================================

-- Every new auth user gets a profile. `security definer` because the inserting
-- session is the auth service, not a role with rights on public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Role lookup used by every policy below. `security definer` is not a
-- convenience here — a policy on `profiles` that reads `profiles` recurses
-- forever, and this is what breaks the cycle.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- Editors moderate; admins do that plus everything else.
create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() in ('editor', 'admin'), false);
$$;

-- Who is allowed to author at all. This is the contributor gate.
create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() in ('contributor', 'editor', 'admin'), false);
$$;


create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();


-- Keeps the timestamps honest so the client never has to.
create or replace function public.posts_before_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  -- First time it goes public, stamp it. Re-publishing later keeps the
  -- original date: the post is not new again because it was edited.
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  -- Leaving review in either direction records who looked at it.
  if tg_op = 'UPDATE' and new.status is distinct from old.status
     and new.status in ('published', 'changes_requested', 'scheduled', 'archived') then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists posts_before_write_trg on public.posts;
create trigger posts_before_write_trg before insert or update on public.posts
  for each row execute function public.posts_before_write();


-- Snapshot the old body whenever it actually changes. Skipping no-op saves
-- keeps the history readable instead of one row per autosave.
create or replace function public.posts_snapshot_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.body_html is distinct from new.body_html
     or old.title is distinct from new.title then
    insert into public.post_revisions (post_id, title, excerpt, body_html, saved_by)
    values (old.id, old.title, old.excerpt, old.body_html, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists posts_snapshot_revision_trg on public.posts;
create trigger posts_snapshot_revision_trg after update on public.posts
  for each row execute function public.posts_snapshot_revision();


-- View counter. Public and unauthenticated, so it is `security definer` and
-- deliberately narrow: it can only ever add one to one column of one post.
create or replace function public.increment_post_views(post_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts
     set view_count = view_count + 1
   where slug = post_slug
     and status = 'published';
$$;

grant execute on function public.increment_post_views(text) to anon, authenticated;


-- Scheduled publishing. Flips anything whose time has come; safe to call as
-- often as you like. See 0003 for wiring it to pg_cron.
create or replace function public.publish_due_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  moved integer;
begin
  update public.posts
     set status = 'published',
         published_at = coalesce(published_at, scheduled_for, now())
   where status = 'scheduled'
     and scheduled_for is not null
     and scheduled_for <= now();
  get diagnostics moved = row_count;
  return moved;
end;
$$;
