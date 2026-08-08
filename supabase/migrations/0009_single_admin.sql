-- =============================================================================
-- 0009 — One admin, and it is an address rather than a role
--
-- Run after 0008.
--
-- Until now `is_admin()` asked a column: `profiles.role = 'admin'`. That is the
-- normal way to do it and it is fine when several people share the top role —
-- but it means admin is something that can be *granted*, and anyone holding it
-- could grant it onward. This pins it to one identity instead.
--
-- After this, exactly one account is an admin: the one whose auth email is
-- `owner_email()` below. Every policy in the schema already routes through
-- `is_admin()`, so redefining that one function moves the whole permission
-- model at once.
--
-- The trigger further down closes the other half. Without it, someone could
-- still be handed `role = 'admin'`, which would show them the admin screens
-- while the database silently refused every request they made — a worse
-- failure than being told no.
--
-- LOSING ACCESS: if that mailbox ever becomes unreachable, admin goes with it.
-- Recovery is to change the address in `owner_email()` from the Supabase SQL
-- editor, which runs as `postgres` and is not subject to any of this.
-- =============================================================================

create or replace function public.owner_email()
returns text
language sql
immutable
as $$
  select 'shendgemanoj878@gmail.com'::text;
$$;


/*
  Admin is now "are you signed in as the owner", asked of auth.users rather
  than of a column anyone with the right role could have written.

  Still `security definer`: the authenticated role cannot read auth.users, and
  this is how the check borrows that access without exposing the table. Still
  `stable`, so Postgres evaluates it once per statement rather than per row.
*/
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from auth.users u
     where u.id = auth.uid()
       and lower(u.email) = lower(public.owner_email())
  );
$$;


-- Editors are still a granted role — they publish and moderate, they do not
-- manage people. Routing this through is_admin() keeps the two definitions
-- from drifting apart later.
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or coalesce((select role from public.profiles where id = auth.uid()) = 'editor', false);
$$;


-- --------------------------------------------------- keep the column honest --
-- The UI reads `profiles.role` to decide what to draw, while the database now
-- reads the email to decide what to allow. If those two can disagree, someone
-- eventually sees an admin screen where every button fails. So: nobody except
-- the owner may hold the value at all.
create or replace function public.enforce_single_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  addr text;
begin
  if new.role = 'admin' then
    select lower(u.email) into addr from auth.users u where u.id = new.id;

    if addr is distinct from lower(public.owner_email()) then
      raise exception 'Only % may be an admin', public.owner_email();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_single_admin_trg on public.profiles;
create trigger enforce_single_admin_trg before insert or update on public.profiles
  for each row execute function public.enforce_single_admin();


-- --------------------------------------------------------- bring into line --
-- Anyone else currently carrying the role. Demoted to editor rather than to
-- contributor: they were trusted with publishing, and this migration is about
-- who administers, not about who writes.
update public.profiles p
   set role = 'editor'
  from auth.users u
 where u.id = p.id
   and p.role = 'admin'
   and lower(u.email) is distinct from lower(public.owner_email());

-- And the owner, if the account exists yet.
update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and lower(u.email) = lower(public.owner_email())
   and p.role <> 'admin';


-- ------------------------------------------------------- and on signup too --
-- So the owner never has to be promoted by hand again. Everyone else keeps
-- whatever `default_new_user_role()` says (contributor, since 0006).
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
    case
      when lower(new.email) = lower(public.owner_email()) then 'admin'::public.user_role
      else public.default_new_user_role()
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ----------------------------------------------------------------- check ----
-- Who holds what, after all of the above:
--
--   select u.email, p.role from public.profiles p
--     join auth.users u on u.id = p.id
--    order by p.role;
--
-- And prove the lock works — this should fail with "Only ... may be an admin":
--
--   update public.profiles set role = 'admin'
--    where id <> (select id from auth.users
--                  where lower(email) = lower(public.owner_email()));
