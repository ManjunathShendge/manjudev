import { useEffect } from "react"

type Meta = {
  title?: string
  description?: string | null
  image?: string | null
  canonical?: string | null
  /** Posts are articles; listings are not. Drives og:type. */
  type?: "website" | "article"
}

const DEFAULT_TITLE = "Manjunath P Shendge — Software Engineer"

function setTag(selector: string, create: () => HTMLMetaElement | HTMLLinkElement, value: string) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  if (el instanceof HTMLMetaElement) el.content = value
  else el.href = value
}

/**
 * Title, description and Open Graph tags for a client-rendered route.
 *
 * Worth being honest about the limits: this is a single-page app, so the tags
 * are written after the bundle runs. Crawlers that execute JavaScript (Google,
 * Bing) see them; the link previewers in Slack, WhatsApp and X read the raw
 * HTML and will show the site-level tags from index.html instead. Prerendering
 * — Netlify's built-in option, or moving the blog routes to SSR — is the fix
 * when that starts to matter.
 */
export function useDocumentMeta({ title, description, image, canonical, type = "website" }: Meta) {
  useEffect(() => {
    const previous = document.title
    const full = title ? `${title} — Manjunath P Shendge` : DEFAULT_TITLE
    document.title = full

    const set = (attr: "name" | "property", key: string, value: string) => {
      setTag(
        `meta[${attr}="${key}"]`,
        () => {
          const el = document.createElement("meta")
          el.setAttribute(attr, key)
          return el
        },
        value,
      )
    }

    set("name", "description", description ?? "")
    set("property", "og:title", full)
    set("property", "og:description", description ?? "")
    set("property", "og:type", type)
    set("property", "og:url", window.location.href)
    set("name", "twitter:card", image ? "summary_large_image" : "summary")
    if (image) {
      set("property", "og:image", image)
      set("name", "twitter:image", image)
    }

    setTag(
      'link[rel="canonical"]',
      () => {
        const el = document.createElement("link")
        el.rel = "canonical"
        return el
      },
      canonical || window.location.href,
    )

    return () => {
      document.title = previous
    }
  }, [title, description, image, canonical, type])
}
