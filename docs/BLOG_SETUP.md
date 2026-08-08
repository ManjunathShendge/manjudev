# Blog platform — setup

Everything on the code side is done. This is the list of things only you can do,
in the order they need doing. Budget about twenty minutes.

The site builds, deploys and runs perfectly well before any of it — the blog
screens show a "not connected yet" panel instead of throwing.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a region close to your readers (`ap-south-1`, Mumbai, for India).
3. Save the database password somewhere — you will not be shown it again.

## 2. Put the keys in `.env`

Copy the template and fill in two values from **Project Settings → API**:

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Both are meant to be public — the anon key is designed to ship in a browser
bundle, and every table is behind row level security. **Never** put the
`service_role` key in here; it bypasses RLS entirely.

Vite reads `.env` once at startup, so restart `npm run dev` afterwards.

`.env` is gitignored. On Netlify, add the same two variables under
**Site configuration → Environment variables**, then redeploy.

## 3. Run the migrations

Open the Supabase **SQL editor** and run these three files in order, pasting the
whole contents of each and pressing Run:

| Order | File | What it does |
|---|---|---|
| 1 | `supabase/migrations/0001_blog_schema.sql` | Tables, enums, triggers, functions |
| 2 | `supabase/migrations/0002_blog_policies.sql` | Row level security — the permission model |
| 3 | `supabase/migrations/0003_blog_storage.sql` | The `blog-media` bucket and its policies |
| — | `supabase/migrations/0004_notifications.sql` | Optional — email on new contributions. Needs the setup in step 6. |
| 4 | `supabase/migrations/0006_open_contribution.sql` | Signing up grants writing access directly. Publishing stays gated. Reversible. |
| 5 | `supabase/migrations/0007_remove_applications.sql` | Drops the application table and its triggers. Destructive — see the note in the file. |
| 6 | `supabase/migrations/0008_enquiries_and_admin.sql` | The lead-form table and the `/admin` overview. **Required** — the contact form writes here. |
| 7 | `supabase/migrations/0009_single_admin.sql` | Pins admin to one email address. Replaces step 5 below — after this, no manual promotion is needed. |

`0005_withdraw_application.sql` is skipped: it added a policy to a table that
`0007` removes. It is kept only so the numbering matches the git history.

Then optionally run `supabase/seed.sql` for six starter categories. Edit that
file first if you want different ones.

Optionally after that, `supabase/seed_posts.sql` publishes nine starter
articles under your byline — real, sourced pieces on the stack this site is
built with, written to be findable. It needs your profile to exist, so sign in
once at `/studio` first; it refuses to run otherwise rather than filing the
posts under nobody. Delete any you would rather not have from `/studio`.

Every file is safe to re-run.

> **If `0003` errors with "must be owner of table objects":** some Supabase
> projects do not let the SQL editor create policies on `storage.objects`. Run
> the first statement (the `insert into storage.buckets …`) on its own, then
> add the four policies through **Storage → blog-media → Policies → New
> policy → For full customisation**, pasting the `using` / `with check`
> expressions from the file. Same rules, different door.

## 4. Turn on email confirmation

**Authentication → Sign In / Providers → Email**:

- **Confirm email**: ON. This is the first half of the verification story — an
  unconfirmed address cannot get a session at all.
- **Secure email change**: ON.

**Authentication → URL Configuration**:

- **Site URL**: your production URL (e.g. `https://yoursite.netlify.app`).
- **Redirect URLs**: add `http://localhost:5173/**` for local development, and
  `https://yoursite.netlify.app/**`.

Without the redirect entries the confirmation link will bounce people to the
wrong place.

> Supabase's built-in mailer is rate-limited to a few messages an hour and is
> not meant for production. Once real people start signing up, add an SMTP
> provider under **Project Settings → Authentication → SMTP Settings**
> (Resend and Brevo both have usable free tiers).

## 5. Become the admin

Nothing to do, as long as you sign up with **shendgemanoj878@gmail.com**.
`0009` makes that address the admin automatically — see *Admin is an address,
not a role* below for why it works that way.

Go to `/studio`, click the **Create account** tab, use that address, and click
the confirmation link. Sign out and back in afterwards; the role is read once
when the session loads, so a session opened before the migration ran will still
think you are a contributor.

To change which address owns the site, edit `public.owner_email()` in `0009`
and re-run that file.

Confirm it took:

```sql
select u.email, p.role, u.email_confirmed_at
  from auth.users u
  join public.profiles p on p.id = u.id
 order by u.created_at desc;
```

Your row should say `admin`. If it does not, the account was created before
`0009` ran — re-running the file picks it up.

This has to be done in SQL exactly once, on purpose. There is no "first user
becomes admin" rule, because that is a race condition with a stranger's signup
on the other side of it.

## 6. Optional — get emailed when someone contributes

Being an admin gets you the **Applications** and **Review queue** screens. It
does not get you email; nothing sends any until you do this.

Run `supabase/migrations/0004_notifications.sql`, then give it somewhere to
send. Two events are wired up: a new contributor application, and a post
submitted for review. Both are rare and both are waiting on you, which is the
test for whether a notification earns its place.

Mail goes to **shendgemanoj878@gmail.com**, which is baked into
`public.admin_email()` in that migration. So there is exactly one thing to set
up: the API key.

**Get a Resend key.** Sign up at [resend.com](https://resend.com) → **API
Keys** → *Create*. Copy it (starts `re_…`); it is shown once.

**Store it** in the Supabase SQL editor. It goes in Vault, not in a table, so
the key never appears in a migration file or a query log:

```sql
select vault.create_secret('re_your_key_here', 'resend_api_key');
```

**Test it:**

```sql
select public.notify_admin('Test', '<p>Notifications are working.</p>');
select id, status_code, content from net._http_response order by id desc limit 5;
```

`200` means Resend accepted it. `401` is a bad API key. `403` almost always
means the `from` address uses a domain you have not verified.

> **On `onboarding@resend.dev`:** Resend lets you send from it without
> verifying anything, but only *to* the address you signed up with. That is
> exactly this use case — you emailing yourself — so it works with no DNS
> setup at all. If you later want notifications going anywhere else, verify a
> domain on Resend and change `notify_from`.

**To send somewhere else later**, add an override rather than editing the
migration — a Vault `notify_email` secret wins over the default:

```sql
select vault.create_secret('someone@else.com', 'notify_email');
```

Same for the sender, once you have a verified domain on Resend:

```sql
select vault.create_secret('Blog <hello@yourdomain.com>', 'notify_from');
```

To change one that already exists, delete it first — `create_secret` will not
overwrite:

```sql
delete from vault.secrets where name = 'notify_email';
select vault.create_secret('new@address.com', 'notify_email');
```

A missing or wrong key makes this a silent no-op rather than an error — a
misconfigured mail provider must never be the reason a contributor's
application fails to save.

## 7. Optional — scheduled publishing

Setting a post to **Scheduled** stores the time but nothing flips it on its own.
To make it automatic, enable **pg_cron** under Database → Extensions, then run:

```sql
select cron.schedule(
  'publish-due-posts',
  '* * * * *',
  $$ select public.publish_due_posts(); $$
);
```

Without this, a scheduled post simply waits for you to press Publish.

---

## How the roles work

| Role | Can |
|---|---|
| `reader` | Read published posts, nothing else. Nobody gets this by default — set it by hand to revoke someone's writing access. |
| `contributor` | Everything above, plus write drafts and submit them for review. **Cannot publish.** This is what a new signup gets. |
| `editor` | Everything above, plus publish and moderate the review queue. Grantable under **People**. |
| `admin` | Everything above, plus `/admin` and role management. **Not grantable** — see below. |

### Admin is an address, not a role

`0009_single_admin.sql` pins admin to one email: whatever `public.owner_email()`
returns, currently `shendgemanoj878@gmail.com`. Three things follow.

`is_admin()` asks `auth.users` for your email instead of reading
`profiles.role`, and every policy in the schema already routes through it — so
redefining that one function moves the whole permission model at once.

A trigger refuses to store `role = 'admin'` on anyone else, so the column and
the check can never disagree. Without it, someone could be handed the role, see
the admin screens, and have every request they made silently refused — a worse
failure than being told no. The studio's People screen no longer offers Admin
as a choice for the same reason.

Signing up with that address grants admin automatically, so there is no manual
promotion step any more.

**If you lose that mailbox, you lose admin.** Recovery is to change the address
inside `owner_email()` from the Supabase SQL editor, which runs as `postgres`
and is not subject to any of this. To move ownership deliberately, do the same
thing.

To check it took:

```sql
select u.email, p.role
  from public.profiles p join auth.users u on u.id = p.id
 order by p.role;
```

Roles are enforced in the database, not in the browser. The studio hides buttons
you cannot use, but a contributor who forges a publish request gets a rejected
write, not a published post.

## How someone becomes a contributor

There is no application step. `0006_open_contribution.sql` makes a confirmed
email address enough:

1. They sign up and click the confirmation link.
2. The editor is theirs. Drafts, image uploads, their own byline.
3. When a post is ready they submit it, and it lands in your review queue.
   Publishing is still yours alone.

Open means open. Anyone on the internet can create an account and upload to
your storage bucket. What protects the site is that none of it is public until
you publish it — which is why `0006` moves the write gate and leaves the
publish gate exactly where it was.

If someone abuses it, set their role to `reader` under **People** in the
studio. That revokes writing immediately; their existing drafts stay but become
uneditable, and nothing of theirs was ever public unless you published it.

### If you ever want a gate again

The approval flow — an application form, a queue, approve/reject with a note —
was built and then removed in `0007`. It is in the git history rather than in
the codebase. The simpler lever that remains: revert `0006` (the block at the
bottom of that file), which makes new signups `reader` again. They then have no
way in at all until you promote them by hand under **People**, which is
heavier-handed but needs no extra machinery.

## How a post reaches the public

```
draft ──submit──▶ in_review ──▶ published
  ▲                   │
  └── changes_requested ┘   (with a note the author reads in the editor)
```

`scheduled` sits between review and published, and `archived` is how a live
post comes down without being deleted.

Contributors can move a post between `draft` and `in_review`. Only editors and
admins can reach `published`, `scheduled` or `archived`.

---

## Routes

| Route | What |
|---|---|
| `/` | The portfolio |
| `/blog` | Post listing — search, category and tag filters, pagination |
| `/blog/:slug` | A post |
| `/studio` | Studio overview, or the sign-in screen when signed out |
| `/studio/posts` | Your posts (all posts, for editors) |
| `/studio/posts/new` | The editor |
| `/studio/review` | Review queue — editors |
| `/studio/applications` | Contributor applications — editors |
| `/studio/people` | Roles — admins |
| `/studio/apply` | Contributor application |
| `/studio/account` | Your profile and password |
| `/admin` | Enquiries, accounts and per-author content — admin only |

`public/_redirects` rewrites everything to `index.html` so these survive a hard
refresh on Netlify. On any other host, set up the equivalent SPA fallback.

---

## The admin panel

`/admin` is admin-only and separate from `/studio` on purpose — the studio is a
tool several people share, and mixing "read someone's email address" into a
screen contributors also use invites the kind of mistake where a permission
check moves and nobody notices. There is a link to it in the studio header
when your role is `admin`.

**Enquiries** — everything the contact form has collected. Filter by status,
expand a row to read the message and the services they picked, reply by email,
and mark it read / replied / archived / spam. The status change stamps who
handled it and when.

**People** — every account, with the email address, role, whether the address
is confirmed, when they last signed in, and what they have written. Expand a
row for that person's posts with per-post view counts.

That screen reads `auth.users`, which no browser-facing role is allowed to
touch. It works through `admin_people_overview()`, a `security definer`
function that checks `is_admin()` itself — a non-admin calling it directly gets
an empty result rather than an error, and never sees an address.

### The contact form

The form in chapter 08 writes to `public.enquiries`. That table is the only
place in the schema an anonymous stranger may write to, which is what a contact
form is; the defence is keeping the blast radius small rather than
authenticating. They may insert and nothing else — no read, no update, no
delete — and column constraints cap one submission at 5000 characters of
message and twenty service tags.

It used to go through Netlify Forms. That worked, but tied the form to one host
and never worked in development. **If you have not run `0008`, the form will
fail** with "the form is not set up correctly at my end" and offer your email
address instead.

---

## Things worth knowing

**Post bodies are sanitised on render, every time.** The editor writes HTML;
`prepareBody()` in `src/lib/blog/format.ts` runs it through DOMPurify with a
tag allowlist before it reaches the page. `iframe` is deliberately not on that
list — an embed is an arbitrary origin running inside your page. If you want
video embeds later, add a TipTap node that only accepts known hosts rather than
opening the tag up.

**Link previews will show the site-level tags, not the post's.** This is a
single-page app, so per-post titles and Open Graph tags are written by
JavaScript after the bundle runs. Google and Bing execute JavaScript and will
see them; the previewers in WhatsApp, Slack and X read the raw HTML and will
not. If that starts to matter, turn on Netlify's prerendering, or move the two
blog routes to a server-rendered setup.

**Images are not resized on upload.** The bucket caps files at 5 MB. A
1600px-wide cover saved as WebP is the right ballpark; a 12-megapixel phone
photo will be rejected.

**The types in `src/lib/blog/types.ts` are hand-written** to mirror the
migrations. If you change a column, change it there too. Once the schema
settles you can replace that file with
`npx supabase gen types typescript --project-id <id> > src/lib/blog/types.gen.ts`.

**Deleting a post does not delete its images.** They stay in the bucket under
`<your user id>/`. Storage is cheap; if it ever matters, clean up from the
Supabase Storage browser.
