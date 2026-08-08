import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { listPostsForStudio } from "@/lib/blog/queries"
import { setPostStatus } from "@/lib/blog/mutations"
import { timeAgo } from "@/lib/blog/format"
import { Avatar } from "@/components/blog/Avatar"
import type { PostWithRelations } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

/**
 * Where a contributor's post lands when they submit it. Three outcomes, and
 * "changes requested" is the one that matters most — it is the only one that
 * carries a note back to the author, so it is the only one that requires one.
 */
export function ReviewQueuePage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPosts(await listPostsForStudio({ status: "in_review" }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the queue")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (id: string, status: "published" | "changes_requested" | "archived") => {
    setBusyId(id)
    setError(null)
    try {
      await setPostStatus(id, status, status === "changes_requested" ? note : null)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setNoteFor(null)
      setNote("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update that post")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="label text-gold">Moderation</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight uppercase">Review queue</h1>
        <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">
          Everything contributors have submitted. Read it on the preview link — it renders exactly
          as it will once live — then publish it or send it back.
        </p>
      </header>

      {error && (
        <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="label animate-pulse text-faint">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-hair p-14 text-center">
          <p className="label text-mint">Queue is clear</p>
          <p className="mt-3 text-sm text-muted-foreground">Nothing is waiting on you.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {posts.map((post) => (
            <li key={post.id} className="border border-hair bg-card/40">
              <div className="flex flex-wrap items-start gap-4 p-5">
                {post.cover_url && (
                  <img
                    src={post.cover_url}
                    alt=""
                    className="h-20 w-32 shrink-0 border border-hair object-cover"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Avatar
                      name={post.author?.full_name ?? "Anonymous"}
                      url={post.author?.avatar_url}
                      size={24}
                    />
                    <span className="label text-faint">{post.author?.full_name ?? "Anonymous"}</span>
                    <span aria-hidden className="h-px w-4 bg-hair" />
                    <span className="label text-faint">submitted {timeAgo(post.updated_at)}</span>
                    <span aria-hidden className="h-px w-4 bg-hair" />
                    <span className="label text-faint">{post.reading_minutes} min</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-hair p-3">
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="label border border-hair px-3 py-1.5 text-muted-foreground no-underline transition-colors duration-300 hover:border-gold/40 hover:text-gold"
                >
                  Read it
                </a>
                <Link
                  to={`/studio/posts/${post.id}`}
                  className="label border border-hair px-3 py-1.5 text-muted-foreground no-underline transition-colors duration-300 hover:border-border hover:text-foreground"
                >
                  Open in editor
                </Link>

                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteFor(noteFor === post.id ? null : post.id)
                      setNote("")
                    }}
                    className="label border border-hair px-3 py-1.5 text-muted-foreground transition-colors duration-300 hover:border-destructive/40 hover:text-destructive"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => void decide(post.id, "published")}
                    className="label border border-mint/50 bg-mint/10 px-3 py-1.5 text-mint transition-colors duration-300 hover:bg-mint/20 disabled:opacity-50"
                  >
                    {busyId === post.id ? "Working…" : "Publish"}
                  </button>
                </div>
              </div>

              {noteFor === post.id && (
                <div className="grid gap-3 border-t border-hair bg-background/40 p-4">
                  <label className="grid gap-2">
                    <span className="label text-faint">
                      What needs to change? <span className="text-faint/70">— the author sees this</span>
                    </span>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Be specific. This is the whole of the feedback they get."
                      className="w-full resize-y rounded-none border border-hair bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-faint focus:border-gold/50 focus:outline-none"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!note.trim() || busyId === post.id}
                      onClick={() => void decide(post.id, "changes_requested")}
                      className={cn(
                        "label border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-destructive transition-colors duration-300 hover:bg-destructive/20",
                        (!note.trim() || busyId === post.id) && "pointer-events-none opacity-50",
                      )}
                    >
                      Send it back
                    </button>
                    <button
                      type="button"
                      onClick={() => void decide(post.id, "archived")}
                      className="label border border-hair px-3 py-1.5 text-faint transition-colors duration-300 hover:text-foreground"
                    >
                      Archive instead
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
