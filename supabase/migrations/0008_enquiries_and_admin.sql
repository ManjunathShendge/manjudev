-- =============================================================================
-- 0008 — Lead enquiries, and the admin overview
--
-- Run after 0006. Two unrelated-looking things in one file because they are
-- the two halves of /admin: the data it collects, and the data it reports.
--
-- The enquiries table is the only place in this schema that an anonymous
-- stranger may write to. That is what a contact form is, so the defence is not
-- authentication — it is keeping the blast radius small: they may insert, they
-- may not read, update or delete, and the column constraints below cap how
-- much text one insert can carry.
-- =============================================================================

do $$ begin
  create type public.enquiry_status as enum ('new', 'read', 'replied', 'archived', 'spam');
exception when duplicate_object then null; end $$;


create table if not exists public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  company    text,
  -- The service chips, stored as an array rather than a joined string so the
  -- admin panel can filter on them later without parsing.
  services   text[] not null default '{}',
  message    text not null,

  status     public.enquiry_status not null default 'new',
  admin_note text,
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,

  created_at timestamptz not null default now(),

  -- Anonymous writes need a ceiling. Without these, one request can put a
  -- megabyte in your database, and nothing about a contact form needs that.
  constraint enquiries_name_len    check (char_length(name)    between 1 and 120),
  constraint enquiries_email_len   check (char_length(email)   between 3 and 200),
  constraint enquiries_company_len check (char_length(coalesce(company, '')) <= 160),
  constraint enquiries_message_len check (char_length(message) between 1 and 5000),
  constraint enquiries_services_n  check (coalesce(array_length(services, 1), 0) <= 20)
);

create index if not exists enquiries_status_idx on public.enquiries (status, created_at desc);


alter table public.enquiries enable row level security;

grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;

-- Write-only for the public. Note there is no `returning` available to them
-- either: PostgREST needs SELECT rights to hand a row back, and they have
-- none, which is why the client inserts without asking for the row.
drop policy if exists "anyone can send an enquiry" on public.enquiries;
create policy "anyone can send an enquiry"
  on public.enquiries for insert to anon, authenticated
  with check (true);

drop policy if exists "admins read enquiries" on public.enquiries;
create policy "admins read enquiries"
  on public.enquiries for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update enquiries" on public.enquiries;
create policy "admins update enquiries"
  on public.enquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete enquiries" on public.enquiries;
create policy "admins delete enquiries"
  on public.enquiries for delete to authenticated
  using (public.is_admin());


-- Stamp who dealt with it, so the panel does not have to send two writes.
create or replace function public.enquiries_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and new.status <> 'new' then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists enquiries_before_update_trg on public.enquiries;
create trigger enquiries_before_update_trg before update on public.enquiries
  for each row execute function public.enquiries_before_update();


-- ============================================================================
-- Admin overview
--
-- One row per person: who they are, when they last signed in, and what they
-- have written. It is a function rather than a view for two reasons — it needs
-- to read `auth.users` for the email and the last login, which the anon and
-- authenticated roles cannot do, and `security definer` is how it borrows that
-- access without handing the whole table over.
--
-- The `where public.is_admin()` is the guard. A non-admin calling this gets an
-- empty result rather than an error, and never sees a single address.
-- ============================================================================
create or replace function public.admin_people_overview()
returns table (
  id                uuid,
  full_name         text,
  email             text,
  role              public.user_role,
  joined_at         timestamptz,
  last_sign_in_at   timestamptz,
  email_confirmed   boolean,
  posts_total       bigint,
  posts_published   bigint,
  posts_drafting    bigint,
  posts_in_review   bigint,
  total_views       bigint,
  last_published_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    u.email::text,
    p.role,
    p.created_at,
    u.last_sign_in_at,
    (u.email_confirmed_at is not null),
    count(po.id),
    count(po.id) filter (where po.status = 'published'),
    count(po.id) filter (where po.status in ('draft', 'changes_requested')),
    count(po.id) filter (where po.status = 'in_review'),
    coalesce(sum(po.view_count), 0),
    max(po.published_at)
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.posts po on po.author_id = p.id
  where public.is_admin()
  group by p.id, p.full_name, u.email, p.role, p.created_at,
           u.last_sign_in_at, u.email_confirmed_at
  order by u.last_sign_in_at desc nulls last, p.created_at desc;
$$;

grant execute on function public.admin_people_overview() to authenticated;
