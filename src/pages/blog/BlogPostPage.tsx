import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { motion, useScroll, useSpring } from "motion/react"

import { BlogShell } from "@/components/blog/BlogShell"
import { SetupNotice } from "@/components/blog/SetupNotice"
import { CategoryChip, PostCard } from "@/components/blog/PostCard"
import { Avatar } from "@/components/blog/Avatar"
import { isSupabaseConfigured } from "@/lib/supabase"
import { getPostBySlug, listRelatedPosts, recordView } from "@/lib/blog/queries"
import { formatDate, prepareBody, type Heading } from "@/lib/blog/format"
import { useDocumentMeta } from "@/lib/blog/useDocumentMeta"
import { STATUS_META, type PostWithRelations } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

export function BlogPostPage() {
  const { slug = "" } = useParams()
  const [post, setPost] = useState<PostWithRelations | null>(null)
  const [related, setRelated] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const articleRef = useRef<HTMLDivElement>(null)

  // Progress is measured against the article, not the document: the footer and
  // the related posts are not part of what you are reading.
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    if (!isSupabaseConfigured || !slug) return

    let alive = true
    setLoading(true)
    setError(null)
    setPost(null)

    getPostBySlug(slug)
      .then(async (found) => {
        if (!alive) return
        setPost(found)
        if (!found) return

        if (found.status === "published") void recordView(slug).catch(() => {})
        const others = await listRelatedPosts(found)
        if (alive) setRelated(others)
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [slug])

  // Sanitising is not cheap and the body does not change while you read it.
  const { html, headings } = useMemo(
    () => (post ? prepareBody(post.body_html) : { html: "", headings: [] as Heading[] }),
    [post],
  )

  useDocumentMeta({
    title: post?.seo_title || post?.title,
    description: post?.seo_description || post?.excerpt,
    image: post?.og_image_url || post?.cover_url,
    canonical: post?.canonical_url,
    type: "article",
  })

  if (!isSupabaseConfigured) {
    return (
      <BlogShell>
        <div className="mx-auto w-[min(1180px,100%-3rem)] py-20">
          <SetupNotice context="This post" />
        </div>
      </BlogShell>
    )
  }

  if (loading) {
    return (
      <BlogShell>
        <div className="mx-auto w-[min(760px,100%-3rem)] py-24">
          <div className="h-3 w-28 animate-pulse bg-secondary/60" />
          <div className="mt-6 h-10 w-full animate-pulse bg-secondary/50" />
          <div className="mt-3 h-10 w-3/4 animate-pulse bg-secondary/40" />
          <div className="mt-10 aspect-video animate-pulse bg-secondary/30" />
        </div>
      </BlogShell>
    )
  }

  if (error || !post) {
    return (
      <BlogShell>
        <div className="mx-auto w-[min(1180px,100%-3rem)] py-28 text-center">
          <p className="label text-gold">{error ? "Something went wrong" : "404"}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight uppercase">
            {error ? "Could not load this post" : "No post at this address"}
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-sm text-muted-foreground">
            {error ??
              "It may have been unpublished, or the link may be wrong. Everything published is on the writing index."}
          </p>
          <Link
            to="/blog"
            className="label mt-8 inline-block border border-gold/40 px-4 py-2 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
          >
            All writing
          </Link>
        </div>
      </BlogShell>
    )
  }

  const isPreview = post.status !== "published"

  return (
    <BlogShell>
      {/* Reading progress, pinned under the header. */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-14.25 z-50 h-px origin-left bg-linear-to-r from-gold-hot to-gold-deep"
      />

      <div className="mx-auto w-[min(1180px,100%-3rem)]">
        {isPreview && (
          <div className="mt-6 flex flex-wrap items-center gap-3 border border-gold/30 bg-gold/5 px-4 py-3">
            <span className="label text-gold">Preview</span>
            <p className="text-sm text-muted-foreground">
              {STATUS_META[post.status].label} — {STATUS_META[post.status].hint} Nobody else can
              see this page.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------- header -- */}
        <header className="border-b border-hair py-14 md:py-20">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && (
              <Link to={`/blog?category=${post.category.slug}`} className="no-underline">
                <CategoryChip name={post.category.name} color={post.category.color} />
              </Link>
            )}
            <span className="label text-faint">{formatDate(post.published_at)}</span>
            <span aria-hidden className="h-px w-5 bg-hair" />
            <span className="label text-faint">{post.reading_minutes} min read</span>
            {post.view_count > 0 && (
              <>
                <span aria-hidden className="h-px w-5 bg-hair" />
                <span className="label text-faint">{post.view_count.toLocaleString()} views</span>
              </>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-[20ch] text-[clamp(1.9rem,5vw,3.6rem)] leading-[1.02] font-semibold tracking-tight"
          >
            {post.title}
          </motion.h1>

          {post.excerpt && (
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 flex items-center gap-3">
            <Avatar name={post.author?.full_name ?? "Anonymous"} url={post.author?.avatar_url} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {post.author?.full_name ?? "Anonymous"}
              </p>
              <p className="label text-faint">Author</p>
            </div>
          </div>
        </header>

        {post.cover_url && (
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 border border-hair"
          >
            <img
              src={post.cover_url}
              alt={post.cover_alt ?? ""}
              className="w-full object-cover"
            />
          </motion.figure>
        )}

        {/* --------------------------------------------------------- body -- */}
        <div className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
          <div ref={articleRef} className="min-w-0">
            <div className="prose-post" dangerouslySetInnerHTML={{ __html: html }} />

            {post.post_tags.length > 0 && (
              <div className="mt-14 flex flex-wrap items-center gap-2 border-t border-hair pt-8">
                <span className="label text-faint">Tagged</span>
                {post.post_tags.map(({ tag }) =>
                  tag ? (
                    <Link
                      key={tag.id}
                      to={`/blog?tag=${tag.slug}`}
                      className="label border border-hair px-2 py-1 text-muted-foreground no-underline transition-colors duration-300 hover:border-gold/40 hover:text-gold"
                    >
                      #{tag.name}
                    </Link>
                  ) : null,
                )}
              </div>
            )}

            <ShareRow title={post.title} />
            {post.author && <AuthorCard author={post.author} />}
          </div>

          {/* Contents. Sticky, desktop only — on a phone it would cost a screen
              of scrolling to save one. */}
          {headings.length > 1 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="label mb-4 text-faint">Contents</p>
                <TableOfContents headings={headings} />
              </div>
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <section className="border-t border-hair py-14">
            <div className="flex items-baseline gap-4">
              <h2 className="text-lg font-semibold tracking-tight uppercase">Keep reading</h2>
              <span aria-hidden className="h-px flex-1 bg-hair" />
              <Link to="/blog" className="label text-gold no-underline">
                All posts
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <PostCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </BlogShell>
  )
}

/** Highlights the section you are actually standing in, not the last one clicked. */
function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] },
    )

    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [headings])

  return (
    <nav className="flex flex-col gap-1 border-l border-hair">
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={cn(
            "-ml-px border-l py-1.5 text-xs leading-snug no-underline transition-colors duration-300",
            h.level === 3 ? "pl-7" : "pl-4",
            active === h.id
              ? "border-gold text-gold"
              : "border-transparent text-faint hover:text-muted-foreground",
          )}
        >
          {h.text}
        </a>
      ))}
    </nav>
  )
}

function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window === "undefined" ? "" : window.location.href

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const share = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ]

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-hair pt-8">
      <span className="label text-faint">Share</span>
      {share.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          className="label border border-hair px-2.5 py-1.5 text-muted-foreground no-underline transition-colors duration-300 hover:border-gold/40 hover:text-gold"
        >
          {s.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="label border border-hair px-2.5 py-1.5 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  )
}

function AuthorCard({ author }: { author: NonNullable<PostWithRelations["author"]> }) {
  const links = [
    { label: "Website", href: author.website },
    { label: "GitHub", href: author.github_url },
    { label: "LinkedIn", href: author.linkedin_url },
    { label: "X", href: author.twitter_url },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href))

  return (
    <div className="mt-12 flex flex-col gap-4 border border-hair bg-card/40 p-6 sm:flex-row sm:items-start">
      <Avatar name={author.full_name ?? "Anonymous"} url={author.avatar_url} size={56} />
      <div className="min-w-0">
        <p className="label text-faint">Written by</p>
        <p className="mt-1 text-base font-semibold tracking-tight">
          {author.full_name ?? "Anonymous"}
        </p>
        {author.bio && (
          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
            {author.bio}
          </p>
        )}
        {links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="label text-gold no-underline underline-offset-4 hover:underline"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

