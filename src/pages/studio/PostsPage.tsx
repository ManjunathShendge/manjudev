import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { useAuth } from "@/lib/blog/auth"
import { listPostsForStudio } from "@/lib/blog/queries"
import { deletePost } from "@/lib/blog/mutations"
import { timeAgo } from "@/lib/blog/format"
import { STATUS_META, type PostStatus, type PostWithRelations } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

const FILTERS: { key: PostStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "in_review", label: "In review" },
  { key: "changes_requested", label: "Changes requested" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
]

export function PostsPage() {
  const { user, isEditor } = useAuth()

  const [status, setStatus] = useState<PostStatus | "all">("all")
  const [mineOnly, setMineOnly] = useState(!isEditor)
  const [search, setSearch] = useState("")
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const rows = await listPostsForStudio({
        authorId: mineOnly ? user.id : undefined,
        status,
        search,
      })
      setPosts(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load posts")
    } finally {
      setLoading(false)
    }
  }, [user, mineOnly, status, search])

  useEffect(() => {
    const id = window.setTimeout(() => void load(), search ? 300 : 0)
    return () => window.clearTimeout(id)
  }, [load, search])

  const remove = async (id: string) => {
    try {
      await deletePost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete that")
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-gold">Content</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight uppercase">Posts</h1>
        </div>
        <Link
          to="/studio/posts/new"
          className="label border border-gold/50 bg-gold/10 px-4 py-2.5 text-gold no-underline transition-colors duration-300 hover:bg-gold/20"
        >
          New post
        </Link>
      </header>

      <div className="flex flex-col gap-4 border-y border-hair py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={cn(
                "label shrink-0 border px-2.5 py-1.5 whitespace-nowrap transition-colors duration-300",
                status === f.key
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-hair text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isEditor && (
            <button
              type="button"
              onClick={() => setMineOnly((v) => !v)}
              className={cn(
                "label border px-2.5 py-1.5 transition-colors duration-300",
                mineOnly
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-hair text-muted-foreground hover:text-foreground",
              )}
            >
              {mineOnly ? "Mine only" : "Everyone"}
            </button>
          )}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Filter by title…"
            className="w-full rounded-none border border-hair bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-faint focus:border-gold/50 focus:outline-none lg:w-56"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="label animate-pulse text-faint">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-hair p-14 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing matches that. {status !== "all" && "Try the All tab."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-hair border border-hair">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
              <Link
                to={`/studio/posts/${post.id}`}
                className="min-w-0 flex-1 no-underline"
              >
                <span className="block truncate text-sm text-foreground hover:text-gold">
                  {post.title}
                </span>
                <span className="label mt-1 block truncate text-faint">
                  /{post.slug}
                  {!mineOnly && post.author?.full_name ? ` · ${post.author.full_name}` : ""}
                </span>
              </Link>

              <span className={cn("label border px-2 py-0.5", STATUS_META[post.status].tone)}>
                {STATUS_META[post.status].label}
              </span>
              <span className="label w-24 shrink-0 text-right text-faint">
                {timeAgo(post.updated_at)}
              </span>

              {post.status === "published" && (
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="label text-faint no-underline hover:text-gold"
                >
                  View
                </a>
              )}

              {pendingDelete === post.id ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void remove(post.id)}
                    className="label text-destructive"
                  >
                    Delete for good
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="label text-faint"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingDelete(post.id)}
                  className="label text-faint transition-colors duration-300 hover:text-destructive"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
