/**
 * Writes public/sitemap.xml — the URL list Google reads — and the
 * public/robots.txt that points crawlers at it.
 *
 *   node scripts/generate-sitemap.mjs      (or: npm run sitemap)
 *
 * robots.txt is generated rather than hand-written for one line: `Sitemap:`
 * has to be an absolute URL, so it carries the same origin the sitemap does.
 * Written by hand, the two would disagree the first time this site moves to a
 * custom domain. Custom crawl rules go in ROBOTS below, not in the file.
 *
 * It runs as part of `npm run build`, ahead of `vite build`, because Vite
 * copies public/ into dist/ as one of its first steps. Generating afterwards
 * would leave the fresh file sitting in public/ and ship the previous one.
 *
 * The two static routes are hard-coded; blog posts are pulled from Supabase so
 * that publishing a post is enough to get it listed on the next deploy. Only
 * `/`, `/blog` and `/blog/:slug` belong here — /studio and /admin are private,
 * and a sitemap is a request to index.
 *
 * No dependencies and no @supabase/supabase-js: one anonymous GET against
 * PostgREST is less machinery than a client, and this file has to run before
 * anything is bundled. Row level security means the anon key can only ever see
 * published rows, which is exactly the set wanted here.
 *
 * A missing key or an unreachable Supabase is not a build failure — the script
 * warns and writes the two static routes on their own. A deploy that ships a
 * slightly short sitemap beats a deploy that does not happen.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const path = (rel) =>
  new URL(rel, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const OUT = path('../public/sitemap.xml')
const ROBOTS_OUT = path('../public/robots.txt')

/**
 * Vite reads .env; Node does not. On Netlify the variables are already in the
 * environment and this parse finds no file, which is the intended order —
 * a real environment variable always wins over the local file.
 */
function readEnvFile() {
  try {
    const out = {}
    for (const line of readFileSync(path('../.env'), 'utf8').split(/\r?\n/)) {
      const match = /^\s*([\w.-]+)\s*=\s*(.*)$/.exec(line)
      if (!match || line.trim().startsWith('#')) continue
      out[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
    return out
  } catch {
    return {}
  }
}

const env = { ...readEnvFile(), ...process.env }

/**
 * Origin the URLs are built against. Set SITE_URL in .env locally, and in the
 * Netlify environment for the deploy that matters — every URL in a sitemap has
 * to be absolute, and pointing them at the wrong host is worse than shipping no
 * sitemap at all. The default is the current Netlify subdomain, so a fresh
 * clone with no .env still generates something correct.
 *
 * The trailing slash is stripped here because every path below starts with
 * one, and `https://host//blog` is a different URL to a crawler.
 */
const SITE = (env.SITE_URL || 'https://manjudev.netlify.app').replace(/\/+$/, '')

const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Published posts, newest first.
 *
 * `canonical_url` is filtered out rather than rewritten: a post that names a
 * canonical elsewhere is a copy of something published somewhere else, and
 * listing our copy in the sitemap contradicts the tag on the page.
 */
async function fetchPosts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('sitemap: no Supabase credentials — writing static routes only')
    return []
  }

  const query = new URLSearchParams({
    select: 'slug,published_at,updated_at',
    status: 'eq.published',
    canonical_url: 'is.null',
    order: 'published_at.desc',
  })

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.warn(`sitemap: could not reach Supabase (${err.message}) — static routes only`)
    return []
  }
}

/** Sitemaps want a W3C date. Whole days are enough for a crawler. */
const day = (value) => {
  const date = value ? new Date(value) : new Date()
  return (Number.isNaN(date.getTime()) ? new Date() : date).toISOString().slice(0, 10)
}

// Slugs come out of slugify() and are already URL-safe, but a sitemap is XML
// and an unescaped & in a hand-edited slug would break the whole document.
const xml = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const entry = ({ loc, lastmod, changefreq, priority }) =>
  [
    '  <url>',
    `    <loc>${xml(SITE + loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')

const posts = await fetchPosts()
const newest = posts.length ? day(posts[0].updated_at || posts[0].published_at) : day()

const urls = [
  // The homepage changes whenever the site is redeployed, so the build date is
  // the honest answer for it.
  { loc: '/', lastmod: day(), changefreq: 'monthly', priority: '1.0' },
  { loc: '/blog', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
  ...posts.map((post) => ({
    loc: `/blog/${post.slug}`,
    lastmod: day(post.updated_at || post.published_at),
    changefreq: 'monthly',
    priority: '0.6',
  })),
]

const document = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/generate-sitemap.mjs — do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(entry).join('\n')}
</urlset>
`

writeFileSync(OUT, document, 'utf8')

/**
 * Crawl rules. `Disallow` keeps well-behaved crawlers out of the two signed-in
 * areas — it is a hint, not a lock, which is fine here because the real
 * protection is Supabase auth and row level security. It is not a secret list
 * either: robots.txt is public, so nothing goes in it that is not already
 * guessable from the navigation.
 *
 * Netlify serves a real file in preference to a redirect rule, so the SPA
 * catch-all in public/_redirects does not swallow either of these paths.
 */
const ROBOTS = [
  '# Generated by scripts/generate-sitemap.mjs — do not edit by hand.',
  '',
  'User-agent: *',
  'Allow: /',
  '',
  '# Signed-in areas. Nothing here is useful in a search result.',
  'Disallow: /studio',
  'Disallow: /admin',
  '',
  `Sitemap: ${SITE}/sitemap.xml`,
  '',
].join('\n')

writeFileSync(ROBOTS_OUT, ROBOTS, 'utf8')

console.log(`sitemap.xml — ${urls.length} URLs (${posts.length} posts) at ${SITE}`)
console.log(`robots.txt  — sitemap pointer + 2 disallow rules`)
