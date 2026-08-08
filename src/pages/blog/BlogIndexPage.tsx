import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion } from "motion/react"

import { BlogShell } from "@/components/blog/BlogShell"
import { SetupNotice } from "@/components/blog/SetupNotice"
import { CategoryChip, PostCard } from "@/components/blog/PostCard"
import { isSupabaseConfigured } from "@/lib/supabase"
import { getFeaturedPost, listCategories, listPublishedPosts, POSTS_PER_PAGE } from "@/lib/blog/queries"
import { formatDate } from "@/lib/blog/format"
import { useDocumentMeta } from "@/lib/blog/useDocumentMeta"
import type { Category, PostWithRelations } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

export function BlogIndexPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get("category")
  const tag = params.get("tag")
  const query = params.get("q") ?? ""
  const page = Number(params.get("page") ?? 1)

  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [featured, setFeatured] = useState<PostWithRelations | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  // The search box types faster than the database should be asked to answer.
  const [draftQuery, setDraftQuery] = useState(query)
  const firstRender = useRef(true)

  useDocumentMeta({
    title: "Writing",
    description:
      "Notes on building production web software — architecture, frontend craft, and the parts that only show up under real traffic.",
  })

  useEffect(() => {
    setDraftQuery(query)
  }, [query])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const id = window.setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (draftQuery.trim()) next.set("q", draftQuery.trim())
          else next.delete("q")
          next.delete("page")
          return next
        },
        { replace: true },
      )
    }, 350)
    return () => window.clearTimeout(id)
  }, [draftQuery, setParams])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    listCategories()
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let alive = true
    setLoading(true)
    setError(null)

    const unfiltered = !category && !tag && !query && page === 1

    Promise.all([
      listPublishedPosts({ page, categorySlug: category, tagSlug: tag, search: query }),
      unfiltered ? getFeaturedPost() : Promise.resolve(null),
    ])
      .then(([result, lead]) => {
        if (!alive) return
        setFeatured(lead)
        // The featured post already has the whole top of the page; showing it
        // again three rows down reads as a bug rather than as emphasis.
        setPosts(lead ? result.posts.filter((p) => p.id !== lead.id) : result.posts)
        setTotal(result.total)
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [category, tag, query, page])

  const pageCount = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))

  const setParam = (key: string, value: string | null) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== "page") next.delete("page")
      return next
    })

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === category) ?? null,
    [categories, category],
  )

  return (
    <BlogShell>
      <div className="mx-auto w-[min(1180px,100%-3rem)]">
        {/* ------------------------------------------------------- header -- */}
        <header className="border-b border-hair py-16 md:py-24">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="label text-gold"
          >
            Writing
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-[clamp(2rem,6vw,4.2rem)] leading-[0.95] font-semibold tracking-tight uppercase"
          >
            Notes from
            <br />
            <span className="bg-linear-to-b from-foreground/70 to-foreground/12 bg-clip-text text-transparent">
              the build
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-[58ch] text-sm leading-relaxed text-muted-foreground md:text-base"
          >
            Architecture decisions, frontend craft, and the things that only turn up once
            something is in front of real users. Written by me, and by anyone else who has
            something worth saying — the studio is open.
          </motion.p>
        </header>

        {!isSupabaseConfigured ? (
          <div className="py-14">
            <SetupNotice />
          </div>
        ) : (
          <>
            {/* ------------------------------------------------- controls -- */}
            <div className="flex flex-col gap-5 border-b border-hair py-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setParam("category", null)}
                  className={cn(
                    "label border px-2.5 py-1.5 transition-colors duration-300",
                    !category
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-hair text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setParam("category", c.slug === category ? null : c.slug)}
                    className={cn(
                      "label border px-2.5 py-1.5 transition-colors duration-300",
                      c.slug === category
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-hair text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <label className="relative shrink-0 lg:w-72">
                <span className="sr-only">Search posts</span>
                <input
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  type="search"
                  placeholder="Search writing…"
                  className="w-full rounded-none border border-hair bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-faint transition-colors duration-300 focus:border-gold/50 focus:outline-none"
                />
              </label>
            </div>

            {(tag || activeCategory) && (
              <div className="flex flex-wrap items-center gap-3 pt-6">
                <span className="label text-faint">Filtered by</span>
                {activeCategory && (
                  <CategoryChip name={activeCategory.name} color={activeCategory.color} />
                )}
                {tag && <span className="label border border-hair px-2 py-1 text-muted-foreground">#{tag}</span>}
                <button
                  type="button"
                  onClick={() =>
                    setParams((prev) => {
                      const next = new URLSearchParams(prev)
                      next.delete("category")
                      next.delete("tag")
                      next.delete("page")
                      return next
                    })
                  }
                  className="label text-gold underline-offset-4 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {/* -------------------------------------------------- content -- */}
            {error && (
              <p className="mt-10 border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
                {error}
              </p>
            )}

            {loading ? (
              <PostGridSkeleton />
            ) : (
              <>
                {featured && <FeaturedPost post={featured} />}

                {posts.length === 0 && !featured ? (
                  <EmptyState hasFilters={Boolean(category || tag || query)} />
                ) : (
                  <div className="grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, i) => (
                      <PostCard key={post.id} post={post} index={i} />
                    ))}
                  </div>
                )}

                {pageCount > 1 && (
                  <nav className="flex items-center justify-between border-t border-hair py-8">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setParam("page", String(page - 1))}
                      className="label border border-hair px-4 py-2 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold disabled:pointer-events-none disabled:opacity-35"
                    >
                      ← Newer
                    </button>
                    <span className="label text-faint">
                      Page {page} of {pageCount}
                    </span>
                    <button
                      type="button"
                      disabled={page >= pageCount}
                      onClick={() => setParam("page", String(page + 1))}
                      className="label border border-hair px-4 py-2 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold disabled:pointer-events-none disabled:opacity-35"
                    >
                      Older →
                    </button>
                  </nav>
                )}
              </>
            )}
          </>
        )}
      </div>
    </BlogShell>
  )
}

/** The lead story. Wider, quieter, and the only place a cover runs full bleed. */
function FeaturedPost({ post }: { post: PostWithRelations }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      className="group mt-12 border border-hair bg-card/40 transition-colors duration-500 hover:border-border"
    >
      <Link to={`/blog/${post.slug}`} className="grid no-underline lg:grid-cols-[1.15fr_1fr]">
        <div className="relative aspect-16/10 overflow-hidden border-b border-hair lg:aspect-auto lg:border-r lg:border-b-0">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.cover_alt ?? ""}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <span className="absolute inset-0 bg-linear-to-br from-secondary to-background" />
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-4 p-7 md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label border border-gold/40 bg-gold/10 px-2 py-1 text-gold">
              Featured
            </span>
            {post.category && <CategoryChip name={post.category.name} color={post.category.color} />}
          </div>

          <h2 className="text-2xl leading-tight font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-gold md:text-3xl">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="label text-faint">{post.author?.full_name ?? "Anonymous"}</span>
            <span aria-hidden className="h-px w-6 bg-hair" />
            <span className="label text-faint">{formatDate(post.published_at)}</span>
            <span aria-hidden className="h-px w-6 bg-hair" />
            <span className="label text-faint">{post.reading_minutes} min</span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="border border-dashed border-hair py-20 text-center">
      <p className="label text-gold">{hasFilters ? "No matches" : "Nothing published yet"}</p>
      <p className="mx-auto mt-3 max-w-[44ch] text-sm text-muted-foreground">
        {hasFilters
          ? "Nothing here fits those filters. Clear them and try a broader search."
          : "The first post is being written. Check back shortly — or write one yourself."}
      </p>
      {!hasFilters && (
        <Link
          to="/studio"
          className="label mt-6 inline-block border border-gold/40 px-4 py-2 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
        >
          Write for us
        </Link>
      )}
    </div>
  )
}

function PostGridSkeleton() {
  return (
    <div className="grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-hair bg-card/30">
          <div className="aspect-16/10 animate-pulse bg-secondary/40" />
          <div className="space-y-3 p-5">
            <div className="h-2.5 w-20 animate-pulse bg-secondary/60" />
            <div className="h-4 w-4/5 animate-pulse bg-secondary/50" />
            <div className="h-3 w-full animate-pulse bg-secondary/30" />
            <div className="h-3 w-2/3 animate-pulse bg-secondary/30" />
          </div>
        </div>
      ))}
    </div>
  )
}
