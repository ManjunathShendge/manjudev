# Manjunath P Shendge — Portfolio

A scroll-driven portfolio told as a story in eight chapters, with a full blog platform on Supabase behind it. React + TypeScript + Vite, Tailwind v4, shadcn/ui, Motion, Lenis.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
```

---

## The idea

You asked for it to read like you telling your own story, so the page is structured as chapters rather than resume sections, and the scroll is the narrator. The reader sets the pace: text is revealed word by word as they scroll, the timeline draws itself, the projects stack up like files on a desk, and the 350,000-row migration is something they physically scroll through.

| Chapter | Section | The scroll device |
|---|---|---|
| — | Hero | Name lines mask up on load, then parallax away as you leave |
| 01 | Origin | **Word-by-word scrub** — each word lifts out of the ink as you pass it |
| 02 | The Path | Gold timeline draws down with scroll; each marker ignites on arrival |
| 03 | Proof | Cards **pin and stack**, leaving a readable tab strip per project; each carries a **gallery** of real screenshots |
| 04 | The Hard Part | Pinned set-piece: counter, progress and grid all bound to scroll position |
| 05 | Toolkit | **GSAP staggered grid** — columns rise at different rates, project bento scales up in the centre |
| 06 | Writing | The latest posts, pulled live from the blog — the hand-off to `/blog` |
| 07 | Services | Freelance availability, build services grid, and SEO/GEO/SMM |
| 08 | What's Next | Direct contact rows plus the lead capture form |

Chapter 04 is the peak. `350,000` is not a count-up on a timer — it is `useTransform(scrollYProgress → rows)`, so the rows arrive at exactly the speed you scroll, the grid of 200 cells fills top-down as they land, and the four pipeline steps light one at a time. Scroll back up and the migration runs backwards.

---

## Background and cursor

**Hyperspeed (Three.js).** [Hyperspeed.jsx](src/components/Hyperspeed.jsx) is the React Bits component, kept verbatim except for one guarded line (see below). [HyperspeedBackground.tsx](src/components/HyperspeedBackground.tsx) wraps it, fixed behind the whole page.

Two adjustments were needed to make it live under a portfolio rather than a demo page:

- **Repainted to the site palette.** The stock preset is magenta/cyan neon, which fights the gold-on-ink identity everywhere else. Same geometry and motion — gold headlights moving away, periwinkle coming toward you, ink road, and the page background colour as fog so the far end dissolves into the page rather than into black.
- **It fades as you scroll.** At full strength the light trails run straight through body copy. Opacity is bound to `scrollY`: 0.62 in the hero where it is the statement, 0.2 behind the chapters where text has to be read.

It is `pointer-events-none`, so click-to-speed-up is off — a full-viewport interactive layer under a 14,000px document would swallow stray clicks. Ask if you want that wired to scroll velocity instead.

> **One local change to the vendored component.** `loadAssets()` is async, so under StrictMode's double-invoke the first app instance is disposed — which calls `forceContextLoss()` — before its `init()` runs. `initPasses()` then asks the dead context for `getContextAttributes()`, gets `null`, and throws on `.alpha`. The fix is a `if (!myApp.disposed)` guard before `init()`; it is commented in place. Re-applying an upstream update means re-applying that guard.

Its CSS is also scoped: the component ships a bare `canvas { … }` selector, which would capture the starfield canvas too.

**Cursor follower.** [CursorFollower.tsx](src/components/CursorFollower.tsx) — the native arrow stays exactly where it is (hiding it costs more in usability than it buys), and a gold ring chases it on spring physics, lagging on fast moves and settling when you stop. Over anything clickable the ring swells 28→46px, turns gold and fills, so the pointer itself reports what is interactive. A faster inner dot rides the arrow tip. Mouse only — `(pointer: fine)` and not reduced-motion.

---

## Graphics

Three kinds, no Lottie anywhere — everything is either a real screenshot, an SVG, or drawn from the data.

**1. Project galleries — real screenshots.** Every image in [public/projects/](public/projects/) was captured from your live deployments, not mocked up. Each card carries an Embla carousel (via shadcn's `carousel`) with arrows, a caption, hairline position markers, and click-to-open at full size in a dialog. The image drifts inside its frame as the card moves up the viewport, so the gallery is part of the scroll rather than a static box.

To refresh them after you ship changes:

```bash
npm i -D playwright-core          # once — drives your installed Edge, no download
node scripts/capture-shots.mjs
```

The script walks each page top to bottom first so lazy images and reveal animations fire, retries once, and refuses to save a page that returned an error.

> **Note:** `tripnexus.netlify.app/explore`, `/stays` and `/restaurants` returned *"This page couldn't load — a server error occurred"* when captured, so the TripNexus gallery is three shots of the homepage. Worth checking those routes on your deploy; once they're up, add them to `SHOTS` in the capture script.

**2. A scroll-drawn migration diagram.** [MigrationDiagram.tsx](src/components/graphics/MigrationDiagram.tsx) is hand-authored SVG: WPL source tables on the left, the Python pipeline in the middle, typed Postgres tables on the right. The connecting wires draw themselves via `pathLength` + `strokeDashoffset` bound to scroll progress, and gold packets travel along them — so the diagram is built while you read the chapter.

**3. A staggered stack grid (GSAP).** [StaggeredGrid.tsx](src/components/StaggeredGrid.tsx), adapted from the Codrops "Halcyon" pattern, opens chapter 05. Eighteen tool tiles rise from below at rates set by their distance from the centre column, and the middle three slots hold a bento of the three projects those tools built — the expanded panel shows the real screenshot, the collapsed ones sit on their side.

> **Two libraries, one page.** GSAP/ScrollTrigger drives this section; Motion drives everything else. They only coexist because [SmoothScroll.tsx](src/components/SmoothScroll.tsx) feeds Lenis into both — `lenis.on('scroll', ScrollTrigger.update)` plus stepping Lenis from `gsap.ticker`. Without that, ScrollTrigger caches stale positions and every trigger in this section fires at the wrong scroll offset. All the animation lives in a `gsap.context()` so StrictMode's double effect can't leave duplicate triggers behind.

**4. An honest stand-in for the internal project.** The attendance system has no public deployment, so [SignalPanel.tsx](src/components/graphics/SignalPanel.tsx) renders a deliberately abstract register filling in cell by cell, labelled *"abstract graphic"*. Inventing a screenshot of a real system would be a lie about the work, so the graphic doesn't pretend to be an interface.

---

## Design system

**Gold on violet ink.** The usual take on "futuristic dark" is near-black plus one acid-neon accent. This goes elsewhere: the ground `#08070C` is biased toward violet so the page sits in one hue family, and the single bold move is a warm gold — premium rather than gamer-RGB. Periwinkle appears only in the ambient canvas glow; mint only on the "open to roles" status dot, where it means something.

The palette is defined once in [src/index.css](src/index.css) as CSS variables on `:root`, duplicated on `.dark` so shadcn primitives resolve either way. Radius is `0.25rem` — sharp and technical, deliberately not `rounded-lg` on everything.

| Token | Value | Role |
|---|---|---|
| `--background` | `#08070C` | Violet-biased near-black |
| `--card` / `--secondary` | `#100E1A` / `#1A1628` | Panels and cards |
| `--gold` | `#E8B75C` | The accent — chapter numbers, active rail, the counter |
| `--peri` | `#7C7BFF` | Ambient canvas only |
| `--mint` | `#4ED2A8` | Availability status — semantic, not decorative |
| `--border` / `--hair` | `rgb(184 174 224 / .13 / .07)` | Two weights of hairline |

**This is a committed single-theme design.** There is no light mode — a dark world is the brief, so it stays dark in every viewer's theme.

### Type

Three faces, all bundled locally through `@fontsource-variable` so there is no font CDN to be blocked and nothing silently falls back to Arial.

- **Unbounded** — display. Wide geometric, used only for short uppercase headings and the narrative lines. Not Inter, not Space Grotesk.
- **Instrument Sans** — body.
- **JetBrains Mono** — the `.label` utility: chapter numbers, dates, spec keys, tech chips. Uppercase at `0.2em`.

Unbounded is very wide, so the hero size is capped at `clamp(2.4rem, 8.4vw, 7.5rem)` — the longer name line clipped its last letter at anything larger.

---

## Structure

```
public/projects/               real screenshots of the live deployments
public/_redirects              SPA fallback so /blog and /studio survive a refresh
scripts/capture-shots.mjs      re-captures the project screenshots
supabase/migrations/           the blog schema, run these in the SQL editor
docs/BLOG_SETUP.md             what you have to do to switch the blog on
src/
├── data/story.ts              ← all content lives here; edit this, not the components
├── data/stack.tsx             tool tiles + project bento for the stack grid
├── App.tsx                    routes — portfolio, blog, studio
├── pages/
│   ├── PortfolioPage.tsx      the scrolling story (was App.tsx before the blog)
│   ├── blog/                  public listing + post page
│   └── studio/                the CMS: dashboard, editor, review queue, people
├── lib/
│   ├── supabase.ts            the client, null until .env is filled in
│   └── blog/                  types, queries, mutations, auth context, formatting
├── components/
│   ├── SmoothScroll.tsx       Lenis momentum scrolling + eased hash navigation
│   ├── Starfield.tsx          ambient canvas: ~150 parallaxed particles
│   ├── ChapterRail.tsx        fixed left rail — progress + live chapter position
│   ├── TopBar.tsx             appears past the hero (the only nav on small screens)
│   ├── ChapterHeading.tsx     shared chapter opener
│   ├── Reveal.tsx             baseline whileInView reveal + DrawLine
│   ├── ScrollScript.tsx       the word-by-word scrub
│   ├── ProjectGallery.tsx     carousel + lightbox, with in-frame scroll parallax
│   ├── StaggeredGrid.tsx      GSAP column-stagger grid + project bento (chapter 05)
│   ├── blog/                  shell, post card, avatar, setup notice
│   ├── studio/                TipTap rich text editor, image upload field
│   ├── graphics/
│   │   ├── MigrationDiagram.tsx   scroll-drawn SVG of the data migration
│   │   └── SignalPanel.tsx        abstract stand-in for the internal project
│   ├── ui/                    shadcn — button, card, badge, separator, carousel, dialog
│   └── sections/              Hero, Origin, Path, Proof, HardPart, Toolkit, Writing,
│                              Services, Next
└── index.css                  tokens, fonts, .label utility, .prose-post
```

**Adding a gallery image:** drop the file in `public/projects/` and add `{ src, caption }` to that project's `shots` array in `story.ts`. A project with an empty `shots` array falls back to the abstract graphic automatically.

**To change any wording, dates, projects or chapter titles, edit [src/data/story.ts](src/data/story.ts).** The components read from it. Adding a chapter means adding an entry to `chapters` (the rail picks it up automatically), plus a section component with a matching `id`.

---

## Motion and accessibility

Everything is scroll- or intent-driven; the only looping animation is the ambient field and the status pulse.

`prefers-reduced-motion` is handled properly rather than blanket-disabled:

- Lenis never initialises — native scrolling only.
- `ScrollScript` renders as a normal paragraph at full contrast.
- The Hard Part drops its `420vh` pinned scrub, shows `350,000` outright and reveals all four steps at once.
- The starfield is not mounted at all.

Two things degrade deliberately on phones, both because pinned content taller than the viewport becomes unreachable:

- **The Hard Part** pins a compact block — counter, grid and only the *current* step, which swaps as you scroll — instead of all four steps at once.
- **Project cards do not stack.** They scroll normally, so each gallery is actually reachable. Stacking is `md:sticky` only.
- **Hyperspeed is not mounted at all** below 768px or under reduced-motion. A second WebGL context is a real battery and memory cost on a phone, for an effect barely visible at that width. The starfield carries the background alone in both cases, and the cursor follower is mouse-only.
- **The stack grid drops to four columns** and lifts the project bento out into a full-width strip above it. Seven columns on a 390px screen is ~50px per tile, which makes the logos and labels unreadable and the bento a third of that again.

Verified at 390×844: no horizontal overflow, no clipped text, all six gallery images loading.

---

## Lead capture form

[LeadForm.tsx](src/components/LeadForm.tsx), in chapter 08. Name, email, optional company, a multi-select service picker (11 options as toggle chips), project details, and explicit sending / sent / error states.

**Submission runs through Netlify Forms.** There is no server in this project and both client sites already deploy there. Two things make it work:

1. A hidden static twin of the form in [index.html](index.html) — Netlify's detection scans the *built HTML* and cannot see a form React renders at runtime. It must keep the same `name` and the same field names as the real one.
2. The React form POSTs url-encoded to `/` with `form-name` set.

Entries then appear under **Forms** in the Netlify dashboard; add a notification there to get them by email.

> **Locally it will fail, and that is expected.** Nothing listens at `/` in `npm run dev`, so submitting lands in the error state — verified: *"Could not send (Server responded 404). Email me at …"*, with the address as a working mailto fallback. If you deploy somewhere other than Netlify, swap the `fetch` in `onSubmit` for your endpoint (Formspree, a serverless function, whatever) and delete the hidden twin.

A honeypot field (`bot-field`) catches the dumber bots.

---

## Blog platform

A full CMS on Supabase, at `/blog` (public) and `/studio` (authoring). Chapter 06 on the portfolio is the hand-off; the site is otherwise unchanged.

**Setup is in [docs/BLOG_SETUP.md](docs/BLOG_SETUP.md)** — it is the only file you need. Short version: create a Supabase project, put two keys in `.env`, run the three files in [supabase/migrations/](supabase/migrations/), turn on email confirmation, and promote yourself to admin with one line of SQL.

**Until those keys exist the blog is inert, not broken.** `isSupabaseConfigured` is false, the client is `null`, and every blog screen renders a setup panel with the remaining steps on it. The portfolio does not notice.

What it does:

- **Public** — listing with full-text search, category and tag filters, a featured slot and pagination; post pages with a reading-progress hairline, a sticky contents list built from the h2/h3s, tags, share row, author card and related posts.
- **Authoring** — a TipTap rich text editor with image upload, auto-slug from the title, excerpt, cover, category, free-form tags, featured toggle, scheduling, SEO overrides and a share image, plus revision snapshots taken before every change to the title or body.
- **Workflow** — `draft → in_review → published`, with `changes_requested` carrying a note back to the author, `scheduled` for timed publishing and `archived` for taking something down without deleting it.
- **Contributors** — the blog is open: a confirmed email address grants the editor directly ([0006_open_contribution.sql](supabase/migrations/0006_open_contribution.sql)), with no application to clear. Publishing is deliberately *not* opened with it — drafts are harmless, a stranger publishing to your domain is not. Revoking is a role change under **People**.
- **Notifications** — optional and currently unwired, [0004_notifications.sql](supabase/migrations/0004_notifications.sql). Would email you when a post is submitted for review, via `pg_net` calling an HTTP mail API straight from Postgres. Needs one secret in Supabase Vault; a missing key is a silent no-op rather than a failed write.

**The permission model lives in the database.** [0002_blog_policies.sql](supabase/migrations/0002_blog_policies.sql) is the real thing; the studio only decides which buttons to draw. A contributor cannot publish, an editor cannot make themselves an admin, and neither rule depends on the browser behaving.

Two details worth carrying in your head:

- **Post HTML is sanitised on render, not on save** — see `prepareBody()` in [format.ts](src/lib/blog/format.ts). An editor is a convenience, not a security boundary, and a post can be edited by someone other than whoever publishes it. `iframe` is off the allowlist on purpose.
- **Link previews show the site-level tags.** Per-post titles and OG tags are written by JavaScript, which search crawlers run and the previewers in WhatsApp, Slack and X do not. Netlify's prerendering fixes it if it starts to matter.

Routes are code-split: the portfolio chunk carries Three.js and GSAP, the studio chunk carries TipTap, and a blog reader downloads neither.

---

## Before you deploy

**Two screenshots are still missing.** Gym Class Booking and Task Manager have no public deployment, so their cards render a "Screenshot pending" panel. Save the images as exactly these names and they appear automatically — no code change needed beyond swapping `shot: null` for the path in [story.ts](src/data/story.ts):

```
public/projects/gym.jpg
public/projects/taskmanager.jpg
```

**Check the inferred tech tags.** Everything in `moreProjects` was written from the running app, not from the repo. The Task Manager stack in particular (`Python / SQL / Jinja / Bootstrap`) is a guess from its server-rendered date format — correct it in [story.ts](src/data/story.ts) if it is wrong.

Optional: drop `resume.pdf` into [public/](public/) and add a third hero button linking to `/resume.pdf`.

### Netlify

Same as your other two projects — connect the repo with:

- Build command: `npm run build`
- Publish directory: `dist`

Then, for the blog:

- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Site configuration → Environment variables** and redeploy. Vite bakes them in at build time, so changing them needs a new build, not just a restart.
- [public/_redirects](public/_redirects) is already there and handles the SPA fallback for `/blog` and `/studio`.
- Put the deployed URL into Supabase under **Authentication → URL Configuration**, both as the Site URL and in the redirect allowlist, or confirmation links will land in the wrong place.

---

## Content decisions worth knowing

- **No skill percentage bars.** "React 85%" is a number you cannot defend in an interview. Grouped honestly instead, each group with a line on where it actually sits.
- **The Market Research role is in the story as "Detour"**, not hidden. A three-month step sideways that you came back from is a better narrative beat than a gap.
- **Internships are visually demoted** — same timeline, lighter treatment. Context, not headline.
- **Every entry has a "beat"** — one first-person line above the bullets. That is what makes it read as a story rather than a CV dump. They are in `story.ts`; rewrite them in your own voice if any feel off.
- The migration counter uses `en-US` grouping (`350,000`) to match how the figure is written on your CV.
