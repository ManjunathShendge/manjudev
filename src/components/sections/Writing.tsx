import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"

import { ChapterHeading } from "@/components/ChapterHeading"
import { Reveal } from "@/components/Reveal"
import { writing } from "@/data/story"
import { isSupabaseConfigured } from "@/lib/supabase"
import { listPublishedPosts } from "@/lib/blog/queries"
import { formatDate } from "@/lib/blog/format"
import type { PostWithRelations } from "@/lib/blog/types"

const ease = [0.16, 1, 0.3, 1] as const

/**
 * Chapter 06 — the hand-off from the story to the blog.
 *
 * Deliberately a list of titles rather than a grid of cards: this is a
 * paragraph in someone's narrative, and three big cards here would read as a
 * second website starting halfway down the first one. If nothing is published
 * yet it shows the intent instead, which is honest and still worth reading.
 */
export function Writing() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    listPublishedPosts({ perPage: 4 })
      .then((page) => setPosts(page.posts))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <section id="writing" className="border-t border-hair py-24 md:py-36">
      <ChapterHeading n="06" title="Writing" kicker={writing.kicker} />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="min-w-0">
          {loaded && posts.length > 0 ? (
            <ul className="border-t border-hair">
              {posts.map((post, i) => (
                <motion.li
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease }}
                  className="border-b border-hair"
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex flex-wrap items-baseline gap-x-5 gap-y-1.5 py-5 no-underline"
                  >
                    <span className="label shrink-0 text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 text-base font-medium text-foreground transition-colors duration-300 group-hover:text-gold md:text-lg">
                      {post.title}
                    </span>
                    <span className="label shrink-0 text-faint">
                      {formatDate(post.published_at)}
                    </span>
                    <span className="label shrink-0 text-faint">{post.reading_minutes} min</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          ) : (
            <ul className="grid gap-px border border-hair bg-hair">
              {writing.lines.map((line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.07, ease }}
                  className="flex gap-4 bg-card p-5 md:p-6"
                >
                  <span className="label shrink-0 text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm text-muted-foreground md:text-base">{line}</span>
                </motion.li>
              ))}
            </ul>
          )}

          <Reveal delay={0.1} className="mt-8">
            <Link
              to="/blog"
              className="label inline-block border border-gold/45 px-5 py-3 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
            >
              {writing.cta} →
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.15} as="div" className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-hair bg-card/50 p-6">
            <h3 className="label text-gold">Open to contributors</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {writing.contribute}
            </p>
            <Link
              to="/studio"
              className="label mt-5 inline-block border-b border-gold/40 pb-px text-gold no-underline"
            >
              {writing.contributeCta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
