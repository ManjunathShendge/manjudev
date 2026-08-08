import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { RichTextEditor } from "@/components/studio/RichTextEditor"
import { ImageField } from "@/components/studio/ImageField"
import { useAuth } from "@/lib/blog/auth"
import { getPostById, listCategories, listRevisions } from "@/lib/blog/queries"
import { savePost } from "@/lib/blog/mutations"
import {
  formatDate,
  htmlToText,
  readingMinutes,
  slugify,
  timeAgo,
  toLocalInputValue,
  fromLocalInputValue,
} from "@/lib/blog/format"
import {
  STATUS_META,
  type Category,
  type PostDraft,
  type PostRevision,
  type PostStatus,
} from "@/lib/blog/types"
import { cn } from "@/lib/utils"

const field =
  "w-full rounded-none border border-hair bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-faint transition-colors duration-300 focus:border-gold/50 focus:outline-none"

const EMPTY: PostDraft = {
  title: "",
  slug: "",
  excerpt: "",
  cover_url: null,
  cover_alt: "",
  body_html: "",
  body_text: "",
  category_id: null,
  tags: [],
  featured: false,
  status: "draft",
  scheduled_for: null,
  seo_title: "",
  seo_description: "",
  og_image_url: null,
  canonical_url: "",
}

/**
 * The CMS proper: one screen that holds everything about a post, with the
 * writing in the middle and every decision about it down the right.
 *
 * The status buttons are the interesting part. What a contributor sees is
 * "save" and "submit"; an editor additionally sees "publish" and "schedule".
 * That split is cosmetic — the same rule is a policy in 0002, and a contributor
 * who forges a publish request gets a rejected write, not a published post.
 */
export function PostEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isEditor } = useAuth()

  const [draft, setDraft] = useState<PostDraft>(EMPTY)
  const [categories, setCategories] = useState<Category[]>([])
  const [revisions, setRevisions] = useState<PostRevision[]>([])
  const [reviewNote, setReviewNote] = useState<string | null>(null)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)

  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [tagInput, setTagInput] = useState("")

  // Once someone edits the slug by hand, the title stops driving it — renaming
  // a published post should not silently break its URL.
  const slugTouched = useRef(false)

  const patch = useCallback((next: Partial<PostDraft>) => {
    setDraft((prev) => ({ ...prev, ...next }))
    setDirty(true)
  }, [])

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) {
      setDraft(EMPTY)
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)

    getPostById(id)
      .then((post) => {
        if (!alive) return
        if (!post) {
          setError("That post does not exist, or is not yours to open.")
          return
        }
        slugTouched.current = true
        setPublishedAt(post.published_at)
        setReviewNote(post.review_note)
        setDraft({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          cover_url: post.cover_url,
          cover_alt: post.cover_alt ?? "",
          body_html: post.body_html,
          body_text: post.body_text,
          category_id: post.category_id,
          tags: post.post_tags.map((t) => t.tag?.name).filter((n): n is string => Boolean(n)),
          featured: post.featured,
          status: post.status,
          scheduled_for: post.scheduled_for,
          seo_title: post.seo_title ?? "",
          seo_description: post.seo_description ?? "",
          og_image_url: post.og_image_url,
          canonical_url: post.canonical_url ?? "",
        })
        setDirty(false)
        return listRevisions(post.id).then((r) => alive && setRevisions(r))
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [id])

  const persist = useCallback(
    async (nextStatus?: PostStatus) => {
      if (!user) return
      setSaving(true)
      setError(null)

      const payload: PostDraft = { ...draft, status: nextStatus ?? draft.status }

      try {
        const saved = await savePost(payload, user.id)
        setDirty(false)
        setSavedAt(new Date())
        setDraft((prev) => ({ ...prev, id: saved.id, slug: saved.slug, status: saved.status }))
        setPublishedAt(saved.published_at)
        if (!draft.id) navigate(`/studio/posts/${saved.id}`, { replace: true })
        else void listRevisions(saved.id).then(setRevisions)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save")
      } finally {
        setSaving(false)
      }
    },
    [draft, user, navigate],
  )

  // ⌘S / Ctrl+S. Writers reach for it whether or not you implement it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (!saving) void persist()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [persist, saving])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const addTag = (raw: string) => {
    const name = raw.trim().replace(/,$/, "")
    if (!name || draft.tags.includes(name)) return
    patch({ tags: [...draft.tags, name] })
  }

  if (loading) return <p className="label animate-pulse text-faint">Loading the post…</p>

  const words = htmlToText(draft.body_html).split(/\s+/).filter(Boolean).length
  const canPublish = isEditor
  const canSubmit = ["draft", "changes_requested"].includes(draft.status)

  return (
    <div className="grid gap-6">
      {/* ---------------------------------------------------------- head -- */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-hair pb-4">
        <Link to="/studio/posts" className="label text-faint no-underline hover:text-foreground">
          ← Posts
        </Link>
        <span className={cn("label border px-2 py-0.5", STATUS_META[draft.status].tone)}>
          {STATUS_META[draft.status].label}
        </span>

        <span className="label text-faint">
          {dirty ? "Unsaved changes" : savedAt ? `Saved ${timeAgo(savedAt.toISOString())}` : ""}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {draft.id && (
            <a
              href={`/blog/${draft.slug}`}
              target="_blank"
              rel="noreferrer"
              className="label border border-hair px-3 py-2 text-muted-foreground no-underline transition-colors duration-300 hover:border-gold/40 hover:text-gold"
            >
              Preview
            </a>
          )}

          <button
            type="button"
            onClick={() => void persist()}
            disabled={saving}
            className="label border border-hair px-3 py-2 text-muted-foreground transition-colors duration-300 hover:border-border hover:text-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {!canPublish && canSubmit && (
            <button
              type="button"
              onClick={() => void persist("in_review")}
              disabled={saving || !draft.title.trim()}
              className="label border border-gold/50 bg-gold/10 px-3 py-2 text-gold transition-colors duration-300 hover:bg-gold/20 disabled:opacity-50"
            >
              Submit for review
            </button>
          )}

          {canPublish && (
            <>
              {draft.status === "published" ? (
                <button
                  type="button"
                  onClick={() => void persist("archived")}
                  disabled={saving}
                  className="label border border-hair px-3 py-2 text-muted-foreground transition-colors duration-300 hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                >
                  Unpublish
                </button>
              ) : (
                draft.scheduled_for && (
                  <button
                    type="button"
                    onClick={() => void persist("scheduled")}
                    disabled={saving}
                    className="label border border-hair px-3 py-2 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold disabled:opacity-50"
                  >
                    Schedule
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => void persist("published")}
                disabled={saving || !draft.title.trim()}
                className="label border border-mint/50 bg-mint/10 px-3 py-2 text-mint transition-colors duration-300 hover:bg-mint/20 disabled:opacity-50"
              >
                {draft.status === "published" ? "Update live post" : "Publish"}
              </button>
            </>
          )}
        </div>
      </header>

      {error && (
        <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {reviewNote && draft.status === "changes_requested" && (
        <div className="border border-destructive/30 bg-destructive/5 p-4">
          <p className="label text-destructive">Changes requested</p>
          <p className="mt-2 text-sm text-muted-foreground">{reviewNote}</p>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-10">
        {/* ------------------------------------------------------- body -- */}
        <div className="grid min-w-0 gap-5">
          <label className="grid gap-2">
            <span className="label text-faint">Title</span>
            <input
              value={draft.title}
              onChange={(e) => {
                const title = e.target.value
                patch(
                  slugTouched.current ? { title } : { title, slug: slugify(title) },
                )
              }}
              placeholder="What is this post called?"
              className="w-full rounded-none border border-hair bg-background/60 px-4 py-3.5 font-display text-lg font-semibold tracking-tight text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-faint focus:border-gold/50 focus:outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="label text-faint">URL slug</span>
            <div className="flex items-center border border-hair bg-background/60 focus-within:border-gold/50">
              <span className="label border-r border-hair px-3 py-2.5 text-faint">/blog/</span>
              <input
                value={draft.slug}
                onChange={(e) => {
                  slugTouched.current = true
                  patch({ slug: slugify(e.target.value) })
                }}
                placeholder="auto-from-title"
                className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-faint focus:outline-none"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="label text-faint">
              Excerpt <span className="text-faint/70">— the card and search summary</span>
            </span>
            <textarea
              rows={2}
              value={draft.excerpt}
              onChange={(e) => patch({ excerpt: e.target.value })}
              placeholder="One or two sentences."
              className={cn(field, "resize-y")}
            />
          </label>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <span className="label text-faint">Body</span>
              <span className="label text-faint">
                {words} words · {readingMinutes(htmlToText(draft.body_html))} min read
              </span>
            </div>
            {user && (
              <RichTextEditor
                value={draft.body_html}
                onChange={(html) => patch({ body_html: html })}
                userId={user.id}
              />
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- settings -- */}
        <aside className="grid content-start gap-6">
          <Panel title="Publishing">
            <p className="text-xs leading-relaxed text-faint">{STATUS_META[draft.status].hint}</p>
            {publishedAt && (
              <p className="label mt-3 text-faint">Live since {formatDate(publishedAt)}</p>
            )}

            {canPublish && (
              <label className="mt-4 grid gap-2">
                <span className="label text-faint">Schedule for</span>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(draft.scheduled_for)}
                  onChange={(e) => patch({ scheduled_for: fromLocalInputValue(e.target.value) })}
                  className={cn(field, "scheme-dark")}
                />
                <span className="text-xs text-faint">
                  Set a time, then press Schedule. Requires the pg_cron job in 0003 — without it a
                  scheduled post waits for you to publish it by hand.
                </span>
              </label>
            )}

            {canPublish && (
              <label className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => patch({ featured: e.target.checked })}
                  className="size-4 accent-[#e8b75c]"
                />
                <span className="text-sm text-muted-foreground">Feature at the top of the blog</span>
              </label>
            )}
          </Panel>

          <Panel title="Category">
            <select
              value={draft.category_id ?? ""}
              onChange={(e) => patch({ category_id: e.target.value || null })}
              className={cn(field, "scheme-dark")}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Panel>

          <Panel title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="label flex items-center gap-1.5 border border-hair px-2 py-1 text-muted-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => patch({ tags: draft.tags.filter((t) => t !== tag) })}
                    aria-label={`Remove ${tag}`}
                    className="text-faint hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  addTag(tagInput)
                  setTagInput("")
                }
              }}
              onBlur={() => {
                addTag(tagInput)
                setTagInput("")
              }}
              placeholder="Type and press enter"
              className={cn(field, "mt-3")}
            />
          </Panel>

          <Panel title="Cover image">
            {user && (
              <ImageField
                label=""
                value={draft.cover_url}
                onChange={(url) => patch({ cover_url: url })}
                userId={user.id}
              />
            )}
            <input
              value={draft.cover_alt}
              onChange={(e) => patch({ cover_alt: e.target.value })}
              placeholder="Alt text — what the image shows"
              className={cn(field, "mt-2")}
            />
          </Panel>

          <Panel title="SEO & sharing">
            <label className="grid gap-2">
              <span className="label text-faint">Title override</span>
              <input
                value={draft.seo_title}
                onChange={(e) => patch({ seo_title: e.target.value })}
                placeholder={draft.title || "Defaults to the post title"}
                className={field}
              />
            </label>
            <label className="mt-3 grid gap-2">
              <span className="label text-faint">Meta description</span>
              <textarea
                rows={3}
                value={draft.seo_description}
                onChange={(e) => patch({ seo_description: e.target.value })}
                placeholder="Defaults to the excerpt. Around 155 characters."
                className={cn(field, "resize-y")}
              />
              <span className="label text-faint">
                {(draft.seo_description || draft.excerpt).length} / 155
              </span>
            </label>
            <label className="mt-3 grid gap-2">
              <span className="label text-faint">Canonical URL</span>
              <input
                value={draft.canonical_url}
                onChange={(e) => patch({ canonical_url: e.target.value })}
                placeholder="If this was published elsewhere first"
                className={field}
              />
            </label>
            {user && (
              <div className="mt-4">
                <ImageField
                  label="Share image"
                  value={draft.og_image_url}
                  onChange={(url) => patch({ og_image_url: url })}
                  userId={user.id}
                  hint="Falls back to the cover. 1200×630 is the safe size."
                  aspect="aspect-1200/630"
                />
              </div>
            )}
          </Panel>

          {revisions.length > 0 && (
            <Panel title="History">
              <ul className="grid gap-2">
                {revisions.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-xs text-muted-foreground">{r.title}</span>
                    <span className="label shrink-0 text-faint">{timeAgo(r.created_at)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-faint">
                Snapshots taken before each change to the title or body.
              </p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-hair bg-card/40 p-4">
      <h2 className="label mb-3 text-gold">{title}</h2>
      {children}
    </section>
  )
}
