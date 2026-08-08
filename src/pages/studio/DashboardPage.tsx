import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { useAuth } from "@/lib/blog/auth"
import { getStudioCounts, listPostsForStudio } from "@/lib/blog/queries"
import { timeAgo } from "@/lib/blog/format"
import { STATUS_META, type PostWithRelations } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

export function DashboardPage() {
  const { user, profile, canWrite, isEditor } = useAuth()

  const [counts, setCounts] = useState({ mine: 0, published: 0, inReview: 0 })
  const [recent, setRecent] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let alive = true

    Promise.all([
      getStudioCounts(user.id),
      canWrite
        ? listPostsForStudio({ authorId: isEditor ? undefined : user.id })
        : Promise.resolve([]),
    ])
      .then(([c, posts]) => {
        if (!alive) return
        setCounts(c)
        setRecent(posts.slice(0, 6))
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [user, canWrite, isEditor])

  const firstName = (profile?.full_name ?? "").split(" ")[0]

  return (
    <div className="grid gap-8">
      <header>
        <p className="label text-gold">Studio</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight uppercase">
          {firstName ? `Hello, ${firstName}` : "Overview"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {canWrite
            ? "Everything you have in flight, and what is waiting on someone else."
            : "Your account does not currently have writing access."}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Your posts" value={counts.mine} to={canWrite ? "/studio/posts" : undefined} />
        <Stat label="Published" value={counts.published} to="/blog" />
        <Stat
          label="In review"
          value={counts.inReview}
          to={isEditor ? "/studio/review" : undefined}
          highlight={isEditor && counts.inReview > 0}
        />
      </div>

      {canWrite && (
        <section>
          <div className="mb-4 flex items-baseline gap-4">
            <h2 className="text-sm font-semibold tracking-tight uppercase">Recently touched</h2>
            <span aria-hidden className="h-px flex-1 bg-hair" />
            <Link to="/studio/posts/new" className="label text-gold no-underline">
              New post
            </Link>
          </div>

          {loading ? (
            <p className="label animate-pulse text-faint">Loading…</p>
          ) : recent.length === 0 ? (
            <div className="border border-dashed border-hair p-10 text-center">
              <p className="text-sm text-muted-foreground">Nothing here yet.</p>
              <Link
                to="/studio/posts/new"
                className="label mt-4 inline-block border border-gold/40 px-4 py-2 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
              >
                Write the first one
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-hair border border-hair">
              {recent.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/studio/posts/${post.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 no-underline transition-colors duration-300 hover:bg-foreground/2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {post.title}
                    </span>
                    <span
                      className={cn("label border px-2 py-0.5", STATUS_META[post.status].tone)}
                    >
                      {STATUS_META[post.status].label}
                    </span>
                    <span className="label shrink-0 text-faint">{timeAgo(post.updated_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  to,
  highlight,
}: {
  label: string
  value: number
  to?: string
  highlight?: boolean
}) {
  const body = (
    <div
      className={cn(
        "border bg-card/40 p-5 transition-colors duration-300",
        highlight ? "border-gold/40" : "border-hair",
        to && "hover:border-border",
      )}
    >
      <p className="label text-faint">{label}</p>
      <p
        className={cn(
          "num mt-2 font-display text-3xl font-semibold",
          highlight ? "text-gold" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )

  return to ? (
    <Link to={to} className="no-underline">
      {body}
    </Link>
  ) : (
    body
  )
}
