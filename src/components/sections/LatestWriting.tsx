import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Reveal, DrawLine } from "@/components/Reveal"
import { PostCard } from "@/components/blog/PostCard"
import { isSupabaseConfigured } from "@/lib/supabase"
import { listPublishedPosts } from "@/lib/blog/queries"
import type { PostWithRelations } from "@/lib/blog/types"

const HOW_MANY = 6

/**
 * The last thing on the portfolio: six recent posts, then a door out to the
 * blog.
 *
 * It renders nothing at all when there is nothing published — an empty grid
 * under a heading that promises writing is worse than no section, and a
 * portfolio that ends on a hollow promise ends badly. Same when Supabase is
 * not configured, which is why the whole thing is behind one early return.
 *
 * Not a numbered chapter. The story ends at 08; this is what comes after the
 * story, in the same way a footer is.
 */
export function LatestWriting() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true

    listPublishedPosts({ perPage: HOW_MANY })
      .then((page) => alive && setPosts(page.posts))
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [])

  if (posts.length === 0) return null

  return (
    <section id="latest-writing" className="border-t border-hair py-24 md:py-32">
      <Reveal className="mb-12 flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <span className="label text-gold">From the blog</span>
        <h2 className="text-2xl font-semibold tracking-tight uppercase sm:text-3xl md:text-4xl">
          Latest writing
        </h2>
        <DrawLine className="min-w-16" />
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </div>

      <Reveal delay={0.1} className="mt-12 flex flex-wrap items-center justify-between gap-5">
        <p className="max-w-[42ch] text-sm text-muted-foreground">
          Longer pieces, everything by category, and the full archive live on the blog.
        </p>
        <Link
          to="/blog"
          className="label border border-gold/45 px-6 py-3.5 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
        >
          Read all writing →
        </Link>
      </Reveal>
    </section>
  )
}
