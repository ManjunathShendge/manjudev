-- =============================================================================
-- Seed — starter posts
--
-- Nine published articles, written against research done in August 2026. Every
-- statistic in them is sourced, and every post carries a Sources list at the
-- foot: a claim you cannot attribute is a claim an AI answer will not cite.
--
-- Run order:
--   0001 → 0002 → (0006 / 0009) → seed.sql → THIS FILE
--
-- Requirements before running:
--   1. You have signed in at least once with the owner address below, so a
--      profile row exists to hang the byline on.
--   2. seed.sql has been run, or the categories block below fills the gap.
--
-- Safe to re-run. Posts match on `slug` and update in place, so editing a body
-- here and re-running is a legitimate workflow — though once you start editing
-- in the studio, this file will happily overwrite you. Edit in one place.
--
-- To change the byline, change the address in BOTH places marked OWNER below.
-- =============================================================================


-- ----------------------------------------------------------- categories -----
-- Mirrors seed.sql, plus one addition: Search & Growth, because the SEO/GEO
-- post is not an engineering post and filing it under Engineering would make
-- the category mean nothing.
insert into public.categories (name, slug, description, color, sort_order) values
  ('Engineering',    'engineering',    'Building things that have to survive real traffic.',      '#e8b75c', 1),
  ('Frontend',       'frontend',       'React, animation, and the parts users actually touch.',   '#7c7bff', 2),
  ('Backend',        'backend',        'APIs, schemas, queues and the work underneath the UI.',   '#4ed2a8', 3),
  ('AI & Agents',    'ai-agents',      'Working with models as components rather than as magic.', '#ff9f6b', 4),
  ('Case Studies',   'case-studies',   'Full walkthroughs of shipped projects.',                  '#e8b75c', 5),
  ('Search & Growth','search-growth',  'SEO, GEO, and being findable by people and machines.',    '#4ea8d2', 7),
  ('Notes',          'notes',          'Shorter pieces — things worth writing down.',             '#6c667e', 6)
on conflict (slug) do nothing;


-- ------------------------------------------------------------- preflight ----
-- Fail loudly and early. The alternative is nine posts landing with a null
-- author or a null category and nobody noticing until the page renders.
do $$
declare
  v_owner text := 'shendgemanoj878@gmail.com';   -- OWNER (1 of 2)
  v_author uuid;
  v_missing text;
begin
  select p.id into v_author
    from public.profiles p
    join auth.users u on u.id = p.id
   where lower(u.email) = lower(v_owner)
   limit 1;

  if v_author is null then
    raise exception
      'No profile for %. Sign up at /studio with that address first, then re-run this file.',
      v_owner;
  end if;

  select string_agg(s, ', ') into v_missing
    from unnest(array[
      'engineering', 'frontend', 'backend', 'ai-agents',
      'case-studies', 'search-growth', 'notes'
    ]) as s
   where not exists (select 1 from public.categories c where c.slug = s);

  if v_missing is not null then
    raise exception 'Missing categories: %. Run seed.sql first.', v_missing;
  end if;
end $$;


-- ------------------------------------------------------------------ tags ----
insert into public.tags (name, slug) values
  ('React',            'react'),
  ('Performance',      'performance'),
  ('Core Web Vitals',  'core-web-vitals'),
  ('Supabase',         'supabase'),
  ('PostgreSQL',       'postgresql'),
  ('RLS',              'rls'),
  ('Security',         'security'),
  ('Migration',        'migration'),
  ('WordPress',        'wordpress'),
  ('Next.js',          'nextjs'),
  ('TypeScript',       'typescript'),
  ('Vite',             'vite'),
  ('Tailwind CSS',     'tailwind-css'),
  ('Tooling',          'tooling'),
  ('AI Agents',        'ai-agents'),
  ('MCP',              'mcp'),
  ('LLMs',             'llms'),
  ('Reliability',      'reliability'),
  ('SEO',              'seo'),
  ('GEO',              'geo'),
  ('AI Search',        'ai-search'),
  ('CSS',              'css'),
  ('Databases',        'databases'),
  ('Python',           'python')
on conflict (slug) do nothing;


-- ----------------------------------------------------------------- posts ----
-- body_text and reading_minutes are derived from body_html rather than typed
-- out twice. The stripped text feeds the generated `search` column, so getting
-- it from the same source as the HTML is the only way they stay in agreement.
with author as (
  select p.id
    from public.profiles p
    join auth.users u on u.id = p.id
   where lower(u.email) = lower('shendgemanoj878@gmail.com')   -- OWNER (2 of 2)
   limit 1
),
raw (slug, title, excerpt, category_slug, featured, days_ago, seo_title, seo_description, body_html) as (
  values

  -- 01 ------------------------------------------------------------------
  (
    'migrating-350000-wordpress-rows-into-supabase',
    '350,000 rows had to move: migrating a WordPress property portal to Supabase',
    'A WPL listing is not a row, it is a scavenger hunt across meta tables. Here is the pipeline that moved a decade of real estate data into Postgres — and the redirect work that stopped the traffic following it out the door.',
    'case-studies', true, 3,
    'WordPress to Supabase migration: 350,000 rows, one pipeline',
    'How a real estate portal moved roughly 350,000 WordPress/WPL rows into Supabase Postgres: schema mapping, a re-runnable Python pipeline, lifting users into Supabase Auth, and the 301 map that protected organic traffic.',
    $html$
<p>All New Launches was a WordPress site with years of property data inside it. The rebuild runs on Next.js and Supabase, and the only version of that rebuild which counted as finished was the one where every listing, every agent and every login arrived on the other side.</p>
<p>Roughly 350,000 rows moved. This is what that actually involved.</p>

<h2>Why a WPL listing is not a row</h2>
<p>WordPress does not store a property. It stores a post, and then it stores facts about that post in a separate key-value table, one row per fact. Real estate plugins add their own tables on top with their own conventions. So the first job was not writing code at all — it was answering the question <em>what is a listing?</em> in terms the old database would agree with.</p>
<p>That answer took days and it was the highest-value part of the project. Every hour spent there removed a week of surprises later.</p>

<h2>Rule one: the pipeline must be re-runnable</h2>
<p>The first version of any migration script fails somewhere in the middle. If a failure at row 210,000 means starting again from zero, you will avoid running it, which means you will test it less, which is how bad data reaches production.</p>
<p>So the Python pipeline was built in batches with a checkpoint, and every write was an upsert keyed on the legacy id:</p>
<pre><code>-- the shape that makes a re-run harmless
insert into listings (legacy_id, title, price, ...)
values (...)
on conflict (legacy_id) do update
  set title = excluded.title,
      price = excluded.price;</code></pre>
<p>Once a re-run costs nothing, you run it twenty times, and the twentieth run is the one you trust.</p>

<h2>Design the destination for the product you are writing</h2>
<p>The tempting shortcut is to reproduce the old schema in Postgres and call it a migration. It is not. It is a relocation, and it carries every compromise the old plugin made into a codebase that has to live with them for years.</p>
<p>The Supabase schema was designed for the application being built: typed columns instead of stringly-typed meta, foreign keys that are actually enforced, and Row Level Security from day one rather than bolted on when the agent dashboard shipped. The mapping between old and new lived entirely inside the migration scripts, which is exactly where that ugliness belongs — in code that gets deleted once it has run.</p>

<h2>Users are the frightening part</h2>
<p>Listings can be re-imported. Accounts cannot. An agent whose login stops working does not file a bug report, they phone someone and they are angry.</p>
<p>WordPress password hashes are not Supabase Auth password hashes, so the honest options are a forced reset flow or a hash-compatible verification step. Either way, the sequence that works is: create the auth user, link it to the profile row, verify the count matches the source, and only then point the frontend at it. Verifying the count is not optional. It is the only thing standing between you and a silent partial import.</p>

<h2>The part nobody budgets for: search</h2>
<p>A migration is a technical project with a marketing failure mode. Businesses have lost around 40% of their organic traffic in the month after a replatform, and the cause is almost never the framework. It is that nobody owned the search handover.</p>
<p>Three failure modes account for most of it: URLs change without 301 redirects, so link equity evaporates; metadata does not transfer, so the search result listing changes underneath you; or the site launches with crawl errors or a stray noindex left over from staging.</p>
<p>The rules that prevented it here were blunt:</p>
<ul>
  <li>Every URL that returned 200 before must return 200 or 301 after. Nothing that used to work is allowed to 404.</li>
  <li>Prefer keeping the URL over redirecting it. Each hop loses a little.</li>
  <li>The redirect map is generated from the old database, not hand-written. Hand-written maps are always incomplete.</li>
  <li>Titles, descriptions and canonicals are part of the data model, not a template afterthought.</li>
</ul>
<p>The first 30 days after launch decide the outcome, so the crawl reports get read daily during that window whether or not anything looks wrong.</p>

<h2>What I would do differently</h2>
<p>I would write the verification queries before the transform code. Not after. Knowing in advance what "this worked" looks like as a number — row counts per table, orphan checks, null rates on columns that must not be null — turns a nervous launch into a boring one, and boring is the goal.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://www.devcritters.com/blog/wordpress-to-nextjs-migration-cost" target="_blank" rel="noopener noreferrer">WordPress to Headless CMS &amp; Next.js migration: cost, timeline &amp; risks (2026) — DevCritters</a></li>
  <li><a href="https://seoparity.com/blog/headless-wordpress-seo" target="_blank" rel="noopener noreferrer">Headless WordPress SEO: Next.js implementation guide — SEOParity</a></li>
  <li><a href="https://focusreactive.com/blog/wordpress-migration/" target="_blank" rel="noopener noreferrer">How to migrate WordPress to a headless CMS (2026) — FocusReactive</a></li>
</ul>
$html$
  ),

  -- 02 ------------------------------------------------------------------
  (
    'supabase-rls-patterns-that-survive-a-refactor',
    'Row Level Security that survives a refactor',
    'RLS is the only authorisation that still holds when someone adds a second client, a cron job, or an AI agent to your system. It is also the easiest thing to accidentally make slow.',
    'backend', true, 9,
    'Supabase RLS patterns for 2026: policies that stay fast',
    'Practical Supabase Row Level Security patterns — indexing the columns policies touch, wrapping auth.uid() in a subquery, security definer helpers that avoid recursion, and why the service key must never reach the browser.',
    $html$
<p>Authorisation written in your API layer protects your API layer. Authorisation written in the database protects the data. The difference stops being philosophical the first time something reaches your tables that is not your API: a scheduled job, a second frontend, an internal script, an agent with a tool that runs SQL.</p>
<p>That is the argument for Row Level Security. Below is what it takes to run it without paying for it in latency.</p>

<h2>RLS is your floor, not your only defence</h2>
<p>Keep the application checks. They give better error messages and a better experience — telling someone "you cannot edit a published post" is friendlier than an empty result set. But the database is what makes the rule true. Application checks are the explanation; RLS is the enforcement.</p>

<h2>Pattern 1: index every column a policy touches</h2>
<p>A policy runs per row. If it filters on <code>author_id</code> and there is no index on <code>author_id</code>, you have attached a sequential scan to every query against that table. Missing indexes on policy columns are the single most common cause of "RLS made my app slow", and it is not really RLS that did it.</p>
<pre><code>create index if not exists posts_author_idx on public.posts (author_id);</code></pre>

<h2>Pattern 2: wrap function calls in a select</h2>
<p>This one looks like a typo and is worth a large multiple in throughput:</p>
<pre><code>-- evaluated once, as an initplan
using ( author_id = (select auth.uid()) )

-- evaluated per row
using ( author_id = auth.uid() )</code></pre>
<p>The subquery form lets the planner hoist the call out of the row loop. On a large table the difference is the difference between a policy you can ship and one you quietly disable.</p>

<h2>Pattern 3: security definer helpers break recursion</h2>
<p>Put a policy on <code>profiles</code> that reads <code>profiles</code> to find out whether you are an admin, and Postgres will evaluate the policy to evaluate the policy, forever. The fix is a <code>security definer</code> function that reads the table outside the policy's own rules:</p>
<pre><code>create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $fn$
  select role from public.profiles where id = auth.uid();
$fn$;</code></pre>
<p><code>set search_path</code> is not decoration. A definer function without a pinned search path is a privilege escalation waiting for someone with the right to create a schema.</p>

<h2>Pattern 4: several small policies beat one large one</h2>
<p>Permissive policies are ORed together. That means you can write one policy per audience — the public, the author, the moderator — and read each of them on its own:</p>
<pre><code>-- anyone may read published posts
create policy posts_read_published on public.posts
  for select using (status = 'published');

-- authors may read their own, whatever the status
create policy posts_read_own on public.posts
  for select using (author_id = (select auth.uid()));</code></pre>
<p>One giant condition with four ORs in it does the same job and cannot be reviewed. Policies are read far more often than they are written.</p>

<h2>Pattern 5: keep the privileged key out of the browser</h2>
<p>The anon key is designed to be public; RLS is what makes that safe. The service key bypasses RLS entirely and belongs only on a server you control. In a Vite app, remember that anything with a <code>VITE_</code> prefix is compiled into the bundle you ship — there is no such thing as a secret in there.</p>
<p>The related mistake is subtler and more common: a table created without <code>enable row level security</code> at all. It is exposed through the API and has no policies to restrain it, which reads as "no rules" rather than "no access". Audit for tables with RLS off; that is the class of error behind a lot of the publicised Supabase data exposures.</p>

<h2>Test it as a stranger</h2>
<p>The test that matters is the one that runs signed out and expects zero rows. Write it once per table. It fails the day someone adds a permissive policy in a hurry, which is exactly the day you want to hear about it.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://github.com/orgs/supabase/discussions/14576" target="_blank" rel="noopener noreferrer">RLS performance and best practices — Supabase discussion #14576</a></li>
  <li><a href="https://makerkit.dev/blog/tutorials/supabase-rls-best-practices" target="_blank" rel="noopener noreferrer">Supabase RLS best practices: production patterns for multi-tenant apps — Makerkit</a></li>
  <li><a href="https://www.frontendtechlead.com/blog/supabase-production-architecture-2026" target="_blank" rel="noopener noreferrer">Taking Supabase to production in 2026: the architecture deep dive</a></li>
</ul>
$html$
  ),

  -- 03 ------------------------------------------------------------------
  (
    'postgres-18-what-actually-changes',
    'Postgres 18 in practice: async I/O, UUIDv7, and what actually changes',
    'Postgres 18 shipped in September 2025 with the largest I/O change in the project''s history and a UUID that finally sorts. Most of it you get by upgrading. Two things are worth changing your own code for.',
    'backend', false, 16,
    'Postgres 18 for app developers: async I/O and UUIDv7',
    'What PostgreSQL 18''s asynchronous I/O subsystem, io_method, uuidv7() and OAuth support mean in real applications — and the two changes actually worth making in your schema.',
    $html$
<p>PostgreSQL 18 was released on 25 September 2025. Most release notes are a list of things you will never type. This one has two entries that change how an application behaves, and they are worth separating from the noise.</p>

<h2>Asynchronous I/O, and why you get it for free</h2>
<p>Until 18, a Postgres backend reading from disk asked for one block and waited. The new AIO subsystem lets a backend queue many reads at once, which turns sequential scans, bitmap heap scans and vacuum from a series of round trips into something the storage layer can pipeline. Reported gains land around 2–3x in read-heavy scenarios.</p>
<p>The behaviour is controlled by <code>io_method</code>. The default uses worker processes; on modern Linux, <code>io_uring</code> hands the queuing to the kernel. The relevant point for application developers is that this is an operational win, not an API: you do not write different SQL to get it. If you are on managed Postgres — Supabase, Neon, RDS — you get it when your provider moves you to 18, and the only thing worth doing is checking which major version you are actually on rather than assuming.</p>

<h2>uuidv7(), and the index you did not know you were hurting</h2>
<p>Random UUIDs are a lovely primary key and a poor index key. Because v4 values are random, consecutive inserts land in unrelated parts of the B-tree, so the pages you are writing to are scattered, cache locality suffers, and the index does not compress well.</p>
<p>UUIDv7 puts a timestamp at the front. Values generated in sequence sort in sequence, so inserts land together the way a bigserial would, while keeping the properties that made you choose a UUID: generatable on the client, unguessable across tables, safe to merge between systems. Postgres 18 ships <code>uuidv7()</code> natively, with monotonicity guaranteed within a session.</p>
<pre><code>create table events (
  id         uuid primary key default uuidv7(),
  payload    jsonb not null,
  created_at timestamptz not null default now()
);</code></pre>
<p>Two caveats before you convert everything:</p>
<ul>
  <li><strong>It leaks creation time.</strong> The timestamp is right there in the identifier. For an order id that is fine, and often useful. For anything where the creation moment is sensitive, it is a disclosure.</li>
  <li><strong>Do not rewrite existing tables for it.</strong> The gain is on insert locality; backfilling new ids across a live schema costs far more than it returns. Use v7 for new tables and leave v4 where it already is.</li>
</ul>

<h2>OAuth at the connection level</h2>
<p>Postgres 18 also adds OAuth 2.0 as a connection authentication method, which matters mostly to platform teams: database access can be issued by the same identity provider as everything else, and revoked in the same place. If your database credentials currently live in a spreadsheet, this is the version to read about.</p>

<h2>The honest summary</h2>
<p>Upgrade for the I/O. Adopt <code>uuidv7()</code> on new tables. Ignore the rest until you need it. A major version upgrade whose headline feature requires no code change is the best kind there is.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://www.postgresql.org/docs/release/18.0/" target="_blank" rel="noopener noreferrer">PostgreSQL 18.0 release notes</a></li>
  <li><a href="https://xata.io/blog/going-down-the-rabbit-hole-of-postgres-18-features" target="_blank" rel="noopener noreferrer">Postgres 18 features: async I/O, UUIDv7, OAuth and more — Xata</a></li>
  <li><a href="https://www.thenile.dev/blog/uuidv7" target="_blank" rel="noopener noreferrer">UUIDv7 comes to PostgreSQL 18 — Nile</a></li>
</ul>
$html$
  ),

  -- 04 ------------------------------------------------------------------
  (
    'react-compiler-killed-your-usememo',
    'The React Compiler killed your useMemo. Now what?',
    'The compiler reached 1.0 in October 2025 and manual memoisation stopped being a performance skill. The interesting part is what that exposes underneath: the re-renders that were never the real problem.',
    'frontend', false, 23,
    'React Compiler in 2026: life after useMemo and useCallback',
    'React Compiler 1.0 removes the need for manual useMemo, useCallback and React.memo. What to delete, what to keep, and the performance problems memoisation was never fixing.',
    $html$
<p>Where things stand in mid-2026: React 19 went stable in December 2024, the line has moved through 19.2, and roughly 48% of daily React users are on it. The React Compiler left beta and hit 1.0 in October 2025. It is no longer a thing you try on a branch.</p>
<p>What it does is mechanical and boring in the best way: at build time it works out which values and callbacks in a component can be reused between renders, and memoises them for you. Meta reported up to 12% faster initial loads and navigations on the Quest Store, and around 2.5x on some interactions.</p>

<h2>What to delete</h2>
<p>Delete the defensive memoisation. Every <code>useMemo</code> wrapping a two-field object literal, every <code>useCallback</code> around a handler that does nothing expensive, every <code>React.memo</code> added because a component "felt heavy". They were guesses, and the compiler now makes better ones — consistently, on every component, including the ones nobody remembered to wrap.</p>
<p>Manual memoisation for performance is no longer the standard pattern. Reviewing a PR that adds a <code>useCallback</code> "to be safe" is now a reasonable place to leave a comment.</p>

<h2>What to keep</h2>
<p>Keep memoisation that exists for correctness rather than speed. If a value's identity is part of an API contract — a dependency array feeding an effect that fires a network request, a key for an external cache, an object handed to a third-party library that does its own identity comparison — that is not a performance optimisation and the compiler is not trying to replace it.</p>
<p>The useful rule: if you cannot write one sentence explaining what breaks when the memo is removed, remove it.</p>

<h2>The rules of React are now load-bearing</h2>
<p>Here is the trade. The compiler can only reuse a value safely if your component behaves the way React says components behave: no mutation during render, no reading or writing refs during render, props and state treated as immutable. Code that broke those rules used to be merely fragile. Now it can be miscompiled, and the resulting bug will look like stale data rather than like a rule violation.</p>
<p>So the linter stops being optional. Turn on the React hooks lint rules, fix what it finds, and treat a compiler bailout as a signal about that component rather than as noise.</p>

<h2>What re-renders were never the problem</h2>
<p>This is the part I find genuinely interesting. For years "why is this slow?" was answered with "it re-renders too much", because that was the thing we had a tool for. With the compiler handling it, what is left is the set of problems that were always the real ones:</p>
<ul>
  <li><strong>Request waterfalls.</strong> Three sequential round trips before anything renders. No amount of memoisation touches this.</li>
  <li><strong>Bundle size.</strong> Code the user downloads and parses before they can interact.</li>
  <li><strong>Rendering thousands of rows</strong> when the viewport shows twenty.</li>
  <li><strong>Layout thrash</strong> — reading geometry after writing to the DOM, in a loop.</li>
  <li><strong>Images and fonts</strong>, still, in 2026, most of the weight of most pages.</li>
</ul>
<p>The compiler did not just remove some boilerplate. It removed the most popular excuse for not profiling.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://react.dev/versions" target="_blank" rel="noopener noreferrer">React versions — react.dev</a></li>
  <li><a href="https://react.dev/blog/2024/12/05/react-19" target="_blank" rel="noopener noreferrer">React v19 — react.dev</a></li>
  <li><a href="https://saschb2b.com/blog/react-compiler-year-in-review" target="_blank" rel="noopener noreferrer">The React Compiler at eighteen months: the arc, the debates, and what's next</a></li>
  <li><a href="https://strapi.io/blog/state-of-react-2025-key-takeaways" target="_blank" rel="noopener noreferrer">State of React 2025–2026: key takeaways</a></li>
</ul>
$html$
  ),

  -- 05 ------------------------------------------------------------------
  (
    'inp-is-the-core-web-vital-you-are-failing',
    'INP is the Core Web Vital you are failing',
    'The thresholds have not moved since 2024. Around 43% of sites still miss the 200ms interaction budget, and nearly every miss is one of four things.',
    'frontend', false, 31,
    'INP in 2026: why 43% of sites fail 200ms, and how to fix it',
    'Interaction to Next Paint is the most commonly failed Core Web Vital in 2026. The four usual causes — long tasks, hydration, uncontrolled input work, layout thrash — and what to measure instead of Lighthouse.',
    $html$
<p>The numbers first, because they have been stable long enough to be worth memorising:</p>
<ul>
  <li><strong>LCP</strong> — largest contentful paint — good under <strong>2.5s</strong>.</li>
  <li><strong>INP</strong> — interaction to next paint — good under <strong>200ms</strong>.</li>
  <li><strong>CLS</strong> — cumulative layout shift — good under <strong>0.1</strong>.</li>
</ul>
<p>The thresholds are unchanged in 2026 and identical on mobile and desktop, which sounds fair and is not: the same budget on a mid-range phone is a much harder thing to hit. INP replaced First Input Delay as an official metric in March 2024, and it is now the vital sites fail most — roughly 43% miss it.</p>

<h2>Why INP is harder than the metric it replaced</h2>
<p>FID measured the delay before the browser started handling your <em>first</em> interaction. It was, in retrospect, generous: it ignored everything your handler then did, and it ignored every interaction after the first.</p>
<p>INP measures the whole thing — input delay, processing, and the paint that follows — across the visit, and reports close to the worst of them. You cannot pass it by being fast once. You pass it by never being slow.</p>

<h2>The four causes</h2>
<h3>1. Long tasks you did not write</h3>
<p>Analytics, chat widgets, tag managers, consent banners. Each one occupies the main thread, and while it is there your click does nothing. Audit third parties by what they cost, load them late, and be willing to say no to one.</p>

<h3>2. Doing all the work inside the handler</h3>
<p>A handler that updates state, recalculates a list, and writes to storage keeps the thread busy until it is done. Split it: do the part the user must see immediately, then yield before the rest.</p>
<pre><code>button.addEventListener('click', async () => {
  applyVisualFeedback()        // paint this now
  await scheduler.yield()      // give the browser a frame
  doTheExpensiveWork()         // continue afterwards
})</code></pre>

<h3>3. Controlled inputs that re-render the page</h3>
<p>Every keystroke updating state at the top of the tree means every keystroke re-runs the tree. Keep input state local, lift it only when something else genuinely needs it, and debounce the derived work rather than the input value itself — a laggy text field is the most noticeable INP failure there is.</p>

<h3>4. Layout thrash</h3>
<p>Reading <code>offsetHeight</code> after a style write forces a synchronous layout. In a loop over list items, that is one forced layout per item. Batch your reads, then batch your writes.</p>

<h2>Measure it in the field, not in the lab</h2>
<p>Lighthouse does not click anything, so it cannot report a real INP — it estimates. The number that counts comes from real users: CrUX, or your own RUM using the <code>web-vitals</code> library, attributed to the element that was slow. Without attribution you know the score and not the culprit, which is the most frustrating position to optimise from.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://www.corewebvitals.io/core-web-vitals" target="_blank" rel="noopener noreferrer">What are the Core Web Vitals? LCP, INP &amp; CLS explained (2026)</a></li>
  <li><a href="https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide" target="_blank" rel="noopener noreferrer">Core Web Vitals 2026: INP, LCP &amp; CLS optimization guide</a></li>
  <li><a href="https://meteoraweb.com/en/analisi-dei-dati-e-metriche/core-web-vitals-2026-lcp-inp-cls-thresholds-and-seo-impact" target="_blank" rel="noopener noreferrer">Core Web Vitals 2026: thresholds and SEO impact — Meteora</a></li>
</ul>
$html$
  ),

  -- 06 ------------------------------------------------------------------
  (
    'the-javascript-toolchain-went-native',
    'The JavaScript toolchain went native, and 2026 is the year you feel it',
    'Tailwind in Rust, Vite on Rolldown, TypeScript in Go. Three separate rewrites landed within eighteen months of each other, and the compound effect on an ordinary project is not subtle.',
    'engineering', false, 38,
    'Vite 8, Rolldown and TypeScript 7: the native toolchain in 2026',
    'Tailwind''s Oxide engine, Vite 8 on Rolldown and TypeScript 7''s Go compiler moved the JavaScript toolchain to native code. The real numbers, the one blocker in TypeScript 7, and a migration order that avoids breakage.',
    $html$
<p>For a decade the tools that build JavaScript were themselves written in JavaScript. That is no longer true of any of the ones you use daily, and the changeover mostly finished in the last eighteen months.</p>

<h2>Tailwind v4: Rust, and configuration that lives in CSS</h2>
<p>Tailwind v4 arrived in January 2025 with its engine rewritten in Rust on top of Lightning CSS. Full builds run several times faster; incremental rebuilds are measured in microseconds rather than milliseconds, which is the difference between "the page updated" and "I watched it update".</p>
<p>The change with more consequence is architectural: configuration moved out of <code>tailwind.config.js</code> and into CSS via <code>@theme</code>. Your design tokens become real custom properties. One operational note — Oxide ships a native binary, so an Alpine-based CI image may need an extra package where a standard Node image just works.</p>

<h2>Vite 8: one bundler instead of two</h2>
<p>Vite 8 went stable on 12 March 2026 and retired the split personality it had lived with since the beginning: esbuild for dev, Rollup for production, and a class of bug that only appeared in one of them. Both are replaced by Rolldown, a single Rust bundler, with Oxc handling transform and minification.</p>
<p>The benchmark numbers are unusually concrete. On the team's own 19,000-module test, a production build that took Rollup 40.10 seconds finished in 1.61 seconds. Reported in the wild: Linear from 46 seconds to 6, GitLab from two and a half minutes to twenty-two seconds, Ramp down 57%, Beehiiv 64%.</p>
<p>A compatibility layer converts most esbuild and Rollup options automatically, so for most projects the upgrade is a version bump and a careful look at any custom plugin.</p>

<h2>TypeScript 7: the Go compiler, and the one catch</h2>
<p>Microsoft announced the native rewrite in March 2025 under the name Corsa, shipped a beta in April 2026, an RC on 18 June, and 7.0 on 8 July 2026. Full builds land roughly 8–12x faster. On a large monorepo that turns type-checking from a coffee break into a keystroke.</p>
<p>The catch is worth knowing before you upgrade in anger: <strong>7.0 has no stable programmatic API</strong>. Anything that drives the compiler as a library — typescript-eslint, ts-jest, ts-morph, and the template type-checking behind Vue, Svelte and Astro — cannot run on it yet. That API is targeted for 7.1.</p>

<h2>A migration order that does not hurt</h2>
<ol>
  <li><strong>Tailwind v4 first.</strong> It is self-contained, and by early 2026 the plugin ecosystem had caught up.</li>
  <li><strong>Vite 8 next.</strong> Biggest wall-clock win, lowest blast radius, and the compat layer does most of the work.</li>
  <li><strong>TypeScript 7 last</strong>, and only where nothing in your pipeline needs the compiler API. A perfectly reasonable 2026 setup runs tsgo for builds and stays on the 6.x line for linting until 7.1 lands.</li>
</ol>

<h2>Why this is not vanity</h2>
<p>Nobody ships a feature because their bundler is fast. But a rebuild that takes twelve milliseconds instead of a third of a second changes what you are willing to try, and a type-check that finishes before you have switched windows changes how often you run it. The tooling is not the product. It is the feedback loop, and the feedback loop is how the product gets good.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://vite.dev/blog/announcing-vite8-beta" target="_blank" rel="noopener noreferrer">Announcing Vite 8 beta — vite.dev</a></li>
  <li><a href="https://www.infoq.com/news/2026/05/vite-v8-rust/" target="_blank" rel="noopener noreferrer">Vite version 8: unified Rust-based bundler and up to 30x faster builds — InfoQ</a></li>
  <li><a href="https://morello.dev/blog/typescript-7-is-here" target="_blank" rel="noopener noreferrer">TypeScript 7 is here: the Go compiler rewrite</a></li>
  <li><a href="https://ecorpit.com/typescript-7-migration-readiness-eslint-astro-blockers-2026/" target="_blank" rel="noopener noreferrer">TypeScript 7.0 migration: adopt in stages</a></li>
</ul>
$html$
  ),

  -- 07 ------------------------------------------------------------------
  (
    'why-agent-pilots-do-not-ship',
    'Most agent pilots never ship. The arithmetic explains a lot of it.',
    'An agent that is 85% reliable at each step succeeds about a fifth of the time across ten steps. Nearly every serious agent problem in 2026 is a restatement of that sentence.',
    'ai-agents', true, 45,
    'Why AI agent pilots fail in 2026 — and what shipping ones do',
    'Studies put the enterprise AI agent pilot failure rate at 86–89%, and deployed agents average a 56.6% task success rate. The compounding-error maths behind it, plus the five things production agents have in common.',
    $html$
<p>The statistic doing the rounds in 2026 is that 88% of AI agent projects never reach production. Independent studies through the year put the range at 86–89%, so the number is roughly right, and the more interesting figure sits underneath it: across 6,259 deployed agents and 4.5 million runs, measured task success came in at <strong>56.6%</strong>.</p>
<p>That is agents which did ship. Slightly better than a coin toss.</p>

<h2>Start with the arithmetic</h2>
<p>Take an agent whose every step — choosing a tool, filling arguments, reading a result, deciding what is next — works 85% of the time. That sounds good. Over a ten-step task:</p>
<pre><code>0.85 ^ 10 ≈ 0.197</code></pre>
<p>About one run in five completes. Nothing is broken; no single component is unreliable; the task simply has too many places to fall over. This is why demos are so misleading. A demo is one happy path, run by the person who built it, on data they chose.</p>

<h2>What the ones that ship have in common</h2>

<h3>1. A shorter chain</h3>
<p>The fastest reliability win is removing steps. Most "agentic" workflows contain three or four decisions that are not decisions at all — they have one correct answer and could be a function call. Make the deterministic parts deterministic and let the model handle only what genuinely needs judgement. A workflow with a model inside it beats an agent that plans the workflow, almost every time, in production.</p>

<h3>2. Tools treated as the reliability surface</h3>
<p>Agents fail at the seams: a tool returns an unexpected shape, an error is swallowed, a retry duplicates a write. This is where the Model Context Protocol earned its position — around 97 million monthly SDK downloads, over 9,400 public servers, native support from every major provider, and donated to the Agentic AI Foundation under the Linux Foundation in December 2025. About 41% of surveyed software organisations now run MCP servers in limited or broad production.</p>
<p>The value is not novelty. It is that a tool boundary with a schema, a version and an error contract is a thing you can test.</p>

<h3>3. Evals before demos</h3>
<p>If you cannot state today's success rate as a number, you cannot tell whether a prompt change helped. Thirty recorded real tasks with known-good outcomes, run on every change, will tell you more than any amount of manual trying.</p>

<h3>4. Failure made cheap and visible</h3>
<p>Assume steps fail. Make writes idempotent so a retry is safe, log the full trace including the tool arguments, cap the loop, and give the agent a way to hand back to a human that is not an exception. An agent that gives up clearly is worth more than one that improvises confidently.</p>

<h3>5. Scope discipline</h3>
<p>Scope creep and data quality together account for roughly 61% of failures. Both are decisions made before any code exists. A narrow agent over clean data beats a broad one over a warehouse nobody has audited, and the narrow one can be extended later — the broad one can only be abandoned.</p>

<h2>The uncomfortable summary</h2>
<p>Adoption is real: about 31% of enterprises have at least one agent in production, led by banking and insurance near 47%, with healthcare around 18% and government 14%. But the gap between pilot and production is not a model-quality gap. It is an engineering gap, and it is made of the same things every distributed system has always been made of — retries, idempotency, observability, and a clear definition of done.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://www.fiddler.ai/blog/ai-agent-failure-rate" target="_blank" rel="noopener noreferrer">AI agent failure rate: why 70–95% fail in production — Fiddler AI</a></li>
  <li><a href="https://www.luizneto.ai/ai-agent-production-gap-2026/" target="_blank" rel="noopener noreferrer">AI agents in production succeed 56.6% of the time</a></li>
  <li><a href="https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/" target="_blank" rel="noopener noreferrer">The 2026 MCP roadmap — Model Context Protocol blog</a></li>
  <li><a href="https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points" target="_blank" rel="noopener noreferrer">AI agent adoption 2026: 120+ enterprise data points</a></li>
</ul>
$html$
  ),

  -- 08 ------------------------------------------------------------------
  (
    'geo-writing-for-the-sources-an-llm-cites',
    'GEO is not SEO with a new name',
    'The overlap between Google''s top links and the sources an AI answer cites has fallen from around 70% to under 20%. Ranking and being cited have become two different jobs.',
    'search-growth', false, 52,
    'Generative Engine Optimization in 2026: how to get cited by AI',
    'AI search now handles an estimated 12–18% of English informational queries. What generative engine optimization actually requires: retrievable passages, citable claims, and content structured for RAG.',
    $html$
<p>Search stopped being a list. For a growing share of questions, the answer is a paragraph assembled from a handful of sources, with citations attached — and the job has changed from earning one of ten blue links to being one of the two to seven sources the model leans on.</p>
<p>The scale is no longer speculative. ChatGPT passed 900 million weekly active users in early 2026, AI Overviews appear on a large proportion of result pages, and AI search engines handle an estimated 12–18% of English-language informational queries, up from under 2% a year earlier.</p>

<h2>The number that should change your reporting</h2>
<p>Analysis from the GEO tooling space puts the overlap between Google's top links and AI-cited sources at <strong>below 20%, down from about 70%</strong>. If that holds even approximately, a rank-tracking dashboard is now measuring a different question from the one your traffic depends on.</p>

<h2>The mechanism is retrieval, so optimise the passage</h2>
<p>Underneath every one of these systems is retrieval-augmented generation: documents are indexed and embedded, a query pulls back semantically relevant <em>passages</em>, and the model writes an answer from them. The unit of competition is not your page. It is the chunk of your page that gets retrieved, read alone, without your navigation, your intro, or the three paragraphs of context above it.</p>
<p>Everything below follows from that single fact.</p>

<h3>Answer first, in the section itself</h3>
<p>Each section should make sense pulled out and read on its own. That means the claim comes before the build-up, and pronouns referring back to earlier sections are a liability — "it does this" is useless in isolation, "Postgres 18 does this" survives the trip.</p>

<h3>Prefer claims a model can attribute</h3>
<p>"Significantly faster" is not citable. "40.10 seconds to 1.61 seconds on a 19,000-module build" is. Numbers, dates, versions and named sources give a generative system something concrete to lift, and concrete things get lifted. This is also, conveniently, what makes writing good.</p>

<h3>Structure is retrieval metadata</h3>
<p>Headings phrased as the question a person would actually ask; one idea per section; comparisons in a table rather than a paragraph; steps in an ordered list. This is not formatting for humans that happens to help machines — chunkers split on structure, so your headings decide where the passage boundaries fall.</p>

<h3>Say when it was true</h3>
<p>Dated claims and visible last-updated dates matter more in a system that has to choose between conflicting sources. Undated content loses to dated content on anything that moves.</p>

<h2>What carries over unchanged</h2>
<p>All the boring parts. If a crawler cannot fetch and render your page, nothing above applies — a client-rendered SPA that ships its content only after JavaScript runs is at a real disadvantage, and prerendering or server rendering is the fix. Clean URLs, fast responses, structured data, sensible internal links: still the floor.</p>
<p>And the oldest requirement of all still decides it. Retrieval systems are unusually harsh on padding, because padding does not embed as anything in particular. The page that answers the question in its first hundred words is the page that gets used.</p>

<h2>How to measure it</h2>
<p>Positions alone will not tell you. Track whether you are cited: run the questions you want to own through the major assistants on a schedule and record whether your domain appears, and watch for referral traffic from AI sources in analytics. It is a coarser signal than rank tracking. It is also the one that reflects the answer people are actually reading.</p>

<h2>Sources</h2>
<ul>
  <li><a href="https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142" target="_blank" rel="noopener noreferrer">Mastering generative engine optimization in 2026 — Search Engine Land</a></li>
  <li><a href="https://en.wikipedia.org/wiki/Generative_engine_optimization" target="_blank" rel="noopener noreferrer">Generative engine optimization — Wikipedia</a></li>
  <li><a href="https://www.brightter.com/articles/how-ai-engines-decide-what-to-cite-technical-geo-framework" target="_blank" rel="noopener noreferrer">How AI engines decide what to cite: a technical GEO framework</a></li>
</ul>
$html$
  ),

  -- 09 ------------------------------------------------------------------
  (
    'note-theme-beats-tailwind-config',
    'Note: @theme is a better idea than tailwind.config.js',
    'Tailwind v4 moved configuration out of JavaScript and into CSS. It reads like a preference until the first time you need a design token somewhere Tailwind does not reach.',
    'notes', false, 60,
    'Tailwind v4 @theme vs tailwind.config.js — why CSS won',
    'Tailwind CSS v4 replaced the JavaScript config with the @theme directive. The practical argument: your tokens become real custom properties, usable outside Tailwind.',
    $html$
<p>The v4 migration note everyone repeats is that <code>tailwind.config.js</code> is gone and configuration now lives in CSS. Stated like that it sounds like churn. It is not, and the reason is small and specific.</p>

<h2>A JavaScript config is invisible at runtime</h2>
<p>Under v3, your palette existed inside a build step. Tailwind read it, generated classes, and the values never appeared in the browser as anything you could reference. So the moment you needed a brand colour somewhere Tailwind did not generate a class for — a canvas fill, an inline SVG stop, a third-party widget's CSS variable, a chart library''s options object — you copied the hex code. Then you had two sources of truth, and one of them changed later.</p>

<h2>@theme emits custom properties</h2>
<pre><code>@theme {
  --color-gold: oklch(0.79 0.13 82);
  --font-display: "Instrument Serif", serif;
}</code></pre>
<p>That gives you the utilities <em>and</em> a real <code>--color-gold</code> in the cascade. The canvas reads it with <code>getComputedStyle</code>. The SVG uses <code>fill: var(--color-gold)</code>. A media query can redefine it and every consumer follows. The token stopped being a build-time constant and became part of the document.</p>

<h2>The cost</h2>
<p>You lose JavaScript in the config, which mattered to anyone generating scales in a loop. In practice most theme files were static objects that only looked like code. Worth the trade.</p>
$html$
  )

)
insert into public.posts (
  slug, title, excerpt, body_html, body_text,
  category_id, author_id, status, featured,
  reading_minutes, published_at, seo_title, seo_description
)
select
  r.slug,
  r.title,
  r.excerpt,
  r.body_html,
  txt.body_text,
  c.id,
  a.id,
  'published',
  r.featured,
  -- 200 words per minute, floor of one.
  greatest(1, ceil(
    coalesce(array_length(regexp_split_to_array(txt.body_text, '\s+'), 1), 0) / 200.0
  )::int),
  now() - make_interval(days => r.days_ago),
  r.seo_title,
  r.seo_description
from raw r
cross join author a
join public.categories c on c.slug = r.category_slug
-- Strip tags, collapse whitespace, decode the entities the bodies actually use.
cross join lateral (
  select btrim(regexp_replace(
    replace(replace(replace(
      regexp_replace(r.body_html, '<[^>]+>', ' ', 'g'),
      '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
    '\s+', ' ', 'g'
  )) as body_text
) txt
on conflict (slug) do update set
  title           = excluded.title,
  excerpt         = excluded.excerpt,
  body_html       = excluded.body_html,
  body_text       = excluded.body_text,
  category_id     = excluded.category_id,
  featured        = excluded.featured,
  reading_minutes = excluded.reading_minutes,
  seo_title       = excluded.seo_title,
  seo_description = excluded.seo_description;


-- ------------------------------------------------------------- post_tags ----
insert into public.post_tags (post_id, tag_id)
select p.id, t.id
from (values
  ('migrating-350000-wordpress-rows-into-supabase', 'supabase'),
  ('migrating-350000-wordpress-rows-into-supabase', 'postgresql'),
  ('migrating-350000-wordpress-rows-into-supabase', 'migration'),
  ('migrating-350000-wordpress-rows-into-supabase', 'wordpress'),
  ('migrating-350000-wordpress-rows-into-supabase', 'nextjs'),
  ('migrating-350000-wordpress-rows-into-supabase', 'python'),
  ('migrating-350000-wordpress-rows-into-supabase', 'seo'),

  ('supabase-rls-patterns-that-survive-a-refactor', 'supabase'),
  ('supabase-rls-patterns-that-survive-a-refactor', 'postgresql'),
  ('supabase-rls-patterns-that-survive-a-refactor', 'rls'),
  ('supabase-rls-patterns-that-survive-a-refactor', 'security'),

  ('postgres-18-what-actually-changes', 'postgresql'),
  ('postgres-18-what-actually-changes', 'databases'),
  ('postgres-18-what-actually-changes', 'performance'),

  ('react-compiler-killed-your-usememo', 'react'),
  ('react-compiler-killed-your-usememo', 'performance'),

  ('inp-is-the-core-web-vital-you-are-failing', 'core-web-vitals'),
  ('inp-is-the-core-web-vital-you-are-failing', 'performance'),
  ('inp-is-the-core-web-vital-you-are-failing', 'seo'),
  ('inp-is-the-core-web-vital-you-are-failing', 'react'),

  ('the-javascript-toolchain-went-native', 'typescript'),
  ('the-javascript-toolchain-went-native', 'vite'),
  ('the-javascript-toolchain-went-native', 'tailwind-css'),
  ('the-javascript-toolchain-went-native', 'tooling'),

  ('why-agent-pilots-do-not-ship', 'ai-agents'),
  ('why-agent-pilots-do-not-ship', 'mcp'),
  ('why-agent-pilots-do-not-ship', 'llms'),
  ('why-agent-pilots-do-not-ship', 'reliability'),

  ('geo-writing-for-the-sources-an-llm-cites', 'geo'),
  ('geo-writing-for-the-sources-an-llm-cites', 'seo'),
  ('geo-writing-for-the-sources-an-llm-cites', 'ai-search'),
  ('geo-writing-for-the-sources-an-llm-cites', 'llms'),

  ('note-theme-beats-tailwind-config', 'tailwind-css'),
  ('note-theme-beats-tailwind-config', 'css')
) as m(post_slug, tag_slug)
join public.posts p on p.slug = m.post_slug
join public.tags  t on t.slug = m.tag_slug
on conflict do nothing;


-- ---------------------------------------------------------------- report ----
-- Read this output. Nine rows, each with a category, a byline and a tag count.
select
  p.published_at::date as published,
  c.name               as category,
  p.reading_minutes    as mins,
  count(pt.tag_id)     as tags,
  p.title
from public.posts p
left join public.categories c on c.id = p.category_id
left join public.post_tags pt on pt.post_id = p.id
where p.slug in (
  'migrating-350000-wordpress-rows-into-supabase',
  'supabase-rls-patterns-that-survive-a-refactor',
  'postgres-18-what-actually-changes',
  'react-compiler-killed-your-usememo',
  'inp-is-the-core-web-vital-you-are-failing',
  'the-javascript-toolchain-went-native',
  'why-agent-pilots-do-not-ship',
  'geo-writing-for-the-sources-an-llm-cites',
  'note-theme-beats-tailwind-config'
)
group by p.id, c.name
order by p.published_at desc;
