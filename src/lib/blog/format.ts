import DOMPurify from "dompurify"

/** Words per minute for the "5 min read" estimate. Deliberately unhurried. */
const WPM = 220

/**
 * URL-safe slug. Strips diacritics first so "Café Deploys" becomes
 * "cafe-deploys" rather than losing the word.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/gu, "") // combining marks left behind by NFKD
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/** Plain text out of the editor's HTML, for search indexing and word counts. */
export function htmlToText(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ")
  const el = document.createElement("div")
  el.innerHTML = html
  return (el.textContent ?? "").replace(/\s+/g, " ").trim()
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WPM))
}

/**
 * Anything a contributor wrote is untrusted by the time it reaches a reader's
 * browser — the editor sanitises nothing, and a post can be edited by someone
 * other than the person who published it. So it is sanitised here, on render,
 * every time.
 *
 * `iframe` is not on the list on purpose: an embed is an arbitrary origin
 * running inside the page. If you want video embeds later, add a dedicated
 * TipTap node that only accepts known hosts rather than opening the tag up.
 */
const ALLOWED_TAGS = [
  "p", "br", "hr", "strong", "em", "u", "s", "code", "pre", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
]

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return ""
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class", "colspan", "rowspan"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i,
    FORBID_ATTR: ["style", "onerror", "onload"],
  })
}

// Links inside a post point outward; open them in a new tab and cut the
// opener reference while we are already walking the tree.
if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("href")?.startsWith("http")) {
      node.setAttribute("target", "_blank")
      node.setAttribute("rel", "noopener noreferrer")
    }
  })
}

/** "12 Mar 2026" — short, unambiguous, no locale surprises in the ordering. */
export function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/** "3 days ago" for studio lists, where recency matters more than the date. */
export function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ]

  let value = seconds
  let unit: Intl.RelativeTimeFormatUnit = "second"
  for (const [size, next] of steps) {
    if (Math.abs(value) < size) break
    value = Math.round(value / size)
    unit = next
  }

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-value, unit)
}

/** `datetime-local` inputs want "YYYY-MM-DDTHH:mm" in local time, not ISO. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInputValue(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export type Heading = { id: string; text: string; level: 2 | 3 }

/**
 * Sanitise, then stamp an anchor id onto every h2/h3 and hand back the list.
 * Doing both in one pass is the point: a contents list whose links are derived
 * separately from the ids they target will eventually disagree with them.
 */
export function prepareBody(html: string): { html: string; headings: Heading[] } {
  const clean = sanitizeHtml(html)
  if (typeof window === "undefined" || !clean) return { html: clean, headings: [] }

  const el = document.createElement("div")
  el.innerHTML = clean

  const seen = new Set<string>()
  const headings: Heading[] = []

  el.querySelectorAll("h2, h3").forEach((node) => {
    const text = (node.textContent ?? "").trim()
    if (!text) return

    const base = slugify(text) || "section"
    let id = base
    // Two sections can legitimately share a name; the anchor cannot.
    let n = 2
    while (seen.has(id)) id = `${base}-${n++}`
    seen.add(id)

    node.setAttribute("id", id)
    headings.push({ id, text, level: node.tagName === "H2" ? 2 : 3 })
  })

  return { html: el.innerHTML, headings }
}
