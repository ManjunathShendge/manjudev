-- =============================================================================
-- 0003 — Media storage, and optional scheduled publishing
--
-- Run after 0002.
-- =============================================================================

-- Public bucket: cover images are meant to be readable by anyone with the URL,
-- and a public bucket serves them straight off the CDN with no signing round
-- trip. Writes are still gated by the policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media',
  'blog-media',
  true,
  5242880,  -- 5 MB. Covers are resized before upload; this is the backstop.
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- Everything a contributor uploads lands under `<their user id>/…`, which is
-- what makes "you may only touch your own files" expressible as a policy.
drop policy if exists "blog media is publicly readable" on storage.objects;
create policy "blog media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'blog-media');

drop policy if exists "writers upload to their own folder" on storage.objects;
create policy "writers upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'blog-media'
    and public.can_write()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "writers replace their own media" on storage.objects;
create policy "writers replace their own media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'blog-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_editor())
  );

drop policy if exists "writers delete their own media" on storage.objects;
create policy "writers delete their own media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'blog-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_editor())
  );


-- ------------------------------------------------- scheduled publishing -----
-- `publish_due_posts()` (0001) flips scheduled posts that are due. Without a
-- scheduler it never runs, and a scheduled post simply stays scheduled.
--
-- Enable it by uncommenting the block below — Database → Extensions → pg_cron
-- has to be on first. Once a minute is plenty; the function is idempotent.
--
--   select cron.schedule(
--     'publish-due-posts',
--     '* * * * *',
--     $$ select public.publish_due_posts(); $$
--   );
--
-- To stop it:  select cron.unschedule('publish-due-posts');
