-- =============================================================================
-- 0004 — Email notifications (optional)
--
-- Run after 0003, and only if you want to be emailed when someone contributes.
-- Without it the studio still collects everything; you just have to go and look.
--
-- Two events are worth interrupting you for:
--   * somebody applies to write here
--   * a contributor submits a post for review
--
-- Both are rare and both are blocked on you, which is the test for whether a
-- notification earns its place. Comments, views and signups are not here on
-- purpose — a notification you learn to ignore is worse than none.
--
-- Delivery goes through Resend (resend.com). Setup is in docs/BLOG_SETUP.md;
-- the short version is one secret in Supabase Vault:
--
--   select vault.create_secret('re_your_key_here', 'resend_api_key');
--
-- Mail goes to shendgemanoj878@gmail.com — see `admin_email()` below. Until the
-- key exists this file is inert: the triggers run, find no key, and return
-- without sending.
-- =============================================================================

-- pg_net makes HTTP calls from Postgres, and makes them asynchronously — the
-- request is queued, so a slow or unreachable mail provider cannot hold up (or
-- roll back) the write that triggered it.
create extension if not exists pg_net;


-- Email bodies interpolate names and titles that people typed. Escape them.
create or replace function public.html_escape(input text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(replace(
           coalesce(input, ''),
           '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$$;


-- Where notifications go by default. The site owner's address, so the only
-- thing that has to be configured is the API key. Override it without touching
-- this file by storing a `notify_email` secret in Vault — see below.
create or replace function public.admin_email()
returns text
language sql
immutable
as $$
  select 'shendgemanoj878@gmail.com'::text;
$$;


/*
  One place that knows how to send. The API key comes from Vault rather than
  from an argument or a constant, so it never appears in a trigger definition,
  a query log, or a migration file in your repository. The recipient is not a
  secret, so it gets a sensible default instead.

  A missing key is a silent no-op, not an error. The alternative is a
  contributor's application failing to save because your mail provider is
  misconfigured, which is the wrong thing to break.
*/
create or replace function public.notify_admin(subject text, body_html text)
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  api_key    text;
  to_email   text;
  from_email text;
begin
  select decrypted_secret into api_key    from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into to_email   from vault.decrypted_secrets where name = 'notify_email';
  select decrypted_secret into from_email from vault.decrypted_secrets where name = 'notify_from';

  to_email := coalesce(to_email, public.admin_email());

  if api_key is null then
    return;
  end if;

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || api_key
    ),
    body    := jsonb_build_object(
      'from',    coalesce(from_email, 'Blog <onboarding@resend.dev>'),
      'to',      jsonb_build_array(to_email),
      'subject', subject,
      'html',    body_html
    )
  );
end;
$$;


-- --------------------------------------------- a new contributor applies -----
create or replace function public.notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_admin(
    'New contributor application — ' || coalesce(new.full_name, 'someone'),
    '<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:34rem">'
      || '<p><strong>' || public.html_escape(new.full_name) || '</strong> ('
      || public.html_escape(new.email) || ') wants to write for the blog.</p>'
      || '<p style="white-space:pre-wrap"><strong>Bio</strong><br>'
      || public.html_escape(new.bio) || '</p>'
      || '<p style="white-space:pre-wrap"><strong>Pitch</strong><br>'
      || public.html_escape(new.pitch) || '</p>'
      || case when array_length(new.topics, 1) is null then ''
              else '<p><strong>Topics</strong><br>'
                   || public.html_escape(array_to_string(new.topics, ', ')) || '</p>' end
      || case when new.portfolio_url is null then ''
              else '<p><a href="' || public.html_escape(new.portfolio_url) || '">Portfolio</a></p>' end
      || case when new.writing_sample_url is null then ''
              else '<p><a href="' || public.html_escape(new.writing_sample_url) || '">Writing sample</a></p>' end
      || '<p>Approve or reject it under <strong>Applications</strong> in the studio.</p>'
      || '</div>'
  );
  return new;
end;
$$;

drop trigger if exists notify_new_application_trg on public.contributor_applications;
create trigger notify_new_application_trg
  after insert on public.contributor_applications
  for each row execute function public.notify_new_application();


-- ------------------------------------------ a post is submitted for review ---
create or replace function public.notify_post_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_name text;
begin
  -- Only the transition into review, not every save while it sits there.
  if new.status <> 'in_review' or old.status = 'in_review' then
    return new;
  end if;

  select full_name into author_name from public.profiles where id = new.author_id;

  perform public.notify_admin(
    'Submitted for review — ' || new.title,
    '<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:34rem">'
      || '<p><strong>' || public.html_escape(coalesce(author_name, 'Someone')) || '</strong>'
      || ' submitted <strong>' || public.html_escape(new.title) || '</strong>.</p>'
      || case when new.excerpt is null then ''
              else '<p>' || public.html_escape(new.excerpt) || '</p>' end
      || '<p>' || new.reading_minutes || ' min read. It is in the review queue.</p>'
      || '</div>'
  );
  return new;
end;
$$;

drop trigger if exists notify_post_submitted_trg on public.posts;
create trigger notify_post_submitted_trg
  after update on public.posts
  for each row execute function public.notify_post_submitted();


-- ----------------------------------------------------------------- check -----
-- After configuring the secrets, send yourself one:
--
--   select public.notify_admin('Test', '<p>Notifications are working.</p>');
--
-- Then look at what actually happened — pg_net records every response:
--
--   select id, status_code, content from net._http_response order by id desc limit 5;
--
-- 200 means Resend accepted it. 401 is a bad API key; 403 usually means the
-- `from` domain is not verified on your Resend account.
