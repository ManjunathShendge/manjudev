import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { formatDate } from "@/lib/blog/format"
import type { PostWithRelations } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

/** A category's own colour, falling back to the site gold. */
export function categoryColor(hex: string | null | undefined) {
  return hex || "#e8b75c"
}

export function CategoryChip({
  name,
  color,
  className,
}: {
  name: string
  color?: string | null
  className?: string
}) {
  const tint = categoryColor(color)
  return (
    <span
      className={cn("label border px-2 py-1", className)}
      style={{ color: tint, borderColor: `${tint}44`, backgroundColor: `${tint}12` }}
    >
      {name}
    </span>
  )
}

export function PostCard({
  post,
  index = 0,
}: {
  post: PostWithRelations
  index?: number
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: Math.min(index, 5) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col border border-hair bg-card/40 transition-colors duration-500 hover:border-border"
    >
      <Link to={`/blog/${post.slug}`} className="flex h-full flex-col no-underline">
        <div className="relative aspect-16/10 overflow-hidden border-b border-hair bg-secondary/40">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.cover_alt ?? ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <span className="label absolute inset-0 grid place-items-center text-faint">
              {post.category?.name ?? "Post"}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && <CategoryChip name={post.category.name} color={post.category.color} />}
            <span className="label text-faint">{post.reading_minutes} min read</span>
          </div>

          <h3 className="text-base leading-snug font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-gold">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <div className="mt-auto flex items-center gap-2 pt-3">
            <span className="label truncate text-faint">
              {post.author?.full_name ?? "Anonymous"}
            </span>
            <span aria-hidden className="h-px flex-1 bg-hair" />
            <span className="label shrink-0 text-faint">{formatDate(post.published_at)}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
