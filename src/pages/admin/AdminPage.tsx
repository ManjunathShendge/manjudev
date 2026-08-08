import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { Avatar } from "@/components/blog/Avatar"
import { SetupNotice } from "@/components/blog/SetupNotice"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/lib/blog/auth"
import { listPostsForStudio } from "@/lib/blog/queries"
import {
  ENQUIRY_STATUS_META,
  deleteEnquiry,
  listEnquiries,
  listPeopleOverview,
  updateEnquiry,
  type Enquiry,
  type EnquiryStatus,
  type PersonOverview,
} from "@/lib/blog/enquiries"
import { formatDate, timeAgo } from "@/lib/blog/format"
import { ROLE_LABEL, STATUS_META, type PostWithRelations } from "@/lib/blog/types"
import { useDocumentMeta } from "@/lib/blog/useDocumentMeta"
import { profile as siteProfile } from "@/data/story"
import { cn } from "@/lib/utils"

type Tab = "enquiries" | "people"

const STATUS_FILTERS: (EnquiryStatus | "all")[] = ["new", "read", "replied", "archived", "spam", "all"]

/**
 * The owner's view of the whole thing — who has enquired, who has an account,
 * and what each of them has written.
 *
 * Kept separate from /studio on purpose. The studio is a tool several people
 * share; this is a single-occupancy room, and mixing "read someone's email
 * address" into a screen contributors also use invites the kind of mistake
 * where a permission check moves and nobody notices.
 */
export function AdminPage() {
  const { ready, session, isAdmin, profile } = useAuth()
  const [tab, setTab] = useState<Tab>("enquiries")

  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [people, setPeople] = useState<PersonOverview[]>([])
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useDocumentMeta({ title: "Admin", description: "Enquiries, people and content." })

  const load = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)
    try {
      const [e, p, po] = await Promise.all([
        listEnquiries("all"),
        listPeopleOverview(),
        listPostsForStudio({}),
      ])
      setEnquiries(e)
      setPeople(p)
      setPosts(po)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the panel")
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void load()
  }, [load])

  // Group once, not per row — this list is read on every expand.
  const postsByAuthor = useMemo(() => {
    const map = new Map<string, PostWithRelations[]>()
    for (const post of posts) {
      const list = map.get(post.author_id) ?? []
      list.push(post)
      map.set(post.author_id, list)
    }
    return map
  }, [posts])

  if (!isSupabaseConfigured) {
    return (
      <Frame>
        <SetupNotice context="The admin panel" />
      </Frame>
    )
  }

  if (!ready) {
    return (
      <Frame>
        <p className="label animate-pulse text-faint">Checking your session…</p>
      </Frame>
    )
  }

  if (!session) {
    return (
      <Frame>
        <Gate
          title="Sign in first"
          body="This panel is for the site owner. Sign in and come back."
          to="/studio"
          cta="Go to sign in"
        />
      </Frame>
    )
  }

  if (!isAdmin) {
    return (
      <Frame>
        <Gate
          title="Not available to you"
          body={`This panel is admin-only. You are signed in as ${
            profile?.full_name ?? "a user"
          }. The studio is where your own work lives.`}
          to="/studio"
          cta="Go to the studio"
        />
      </Frame>
    )
  }

  const newCount = enquiries.filter((e) => e.status === "new").length
  const totalViews = people.reduce((n, p) => n + p.total_views, 0)
  const publishedCount = people.reduce((n, p) => n + p.posts_published, 0)

  return (
    <Frame>
      <header className="mb-8">
        <p className="label text-gold">Admin</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight uppercase md:text-3xl">
          Everything, in one place
        </h1>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New enquiries" value={newCount} highlight={newCount > 0} />
        <Stat label="Accounts" value={people.length} />
        <Stat label="Published posts" value={publishedCount} />
        <Stat label="Total views" value={totalViews} />
      </div>

      <div className="mb-6 flex gap-1 border-b border-hair">
        {(
          [
            ["enquiries", `Enquiries${newCount ? ` (${newCount})` : ""}`],
            ["people", `People (${people.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "label -mb-px border-b-2 px-4 py-3 transition-colors duration-300",
              tab === key
                ? "border-gold text-gold"
                : "border-transparent text-faint hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-6 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="label animate-pulse text-faint">Loading…</p>
      ) : tab === "enquiries" ? (
        <Enquiries rows={enquiries} onChanged={load} onError={setError} />
      ) : (
        <People rows={people} postsByAuthor={postsByAuthor} />
      )}
    </Frame>
  )
}

// ------------------------------------------------------------- enquiries ----

function Enquiries({
  rows,
  onChanged,
  onError,
}: {
  rows: Enquiry[]
  onChanged: () => void
  onError: (message: string) => void
}) {
  const [filter, setFilter] = useState<EnquiryStatus | "all">("new")
  const [openId, setOpenId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter)

  const setStatus = async (id: string, status: EnquiryStatus) => {
    setBusyId(id)
    try {
      await updateEnquiry(id, { status })
      onChanged()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not update that")
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    setBusyId(id)
    try {
      await deleteEnquiry(id)
      setConfirmDelete(null)
      onChanged()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not delete that")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((s) => {
          const count = s === "all" ? rows.length : rows.filter((r) => r.status === s).length
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "label border px-2.5 py-1.5 transition-colors duration-300",
                filter === s
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-hair text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {s === "all" ? "All" : ENQUIRY_STATUS_META[s].label} ({count})
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-hair p-14 text-center">
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "No enquiries yet. The form in chapter 08 writes straight here."
              : "Nothing with that status."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {visible.map((row) => {
            const open = openId === row.id
            return (
              <li key={row.id} className="border border-hair bg-card/40">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : row.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left transition-colors duration-300 hover:bg-foreground/2"
                >
                  <span
                    className={cn("label shrink-0 border px-2 py-0.5", ENQUIRY_STATUS_META[row.status].tone)}
                  >
                    {ENQUIRY_STATUS_META[row.status].label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {row.name}
                      {row.company && <span className="text-faint"> · {row.company}</span>}
                    </span>
                    <span className="label block truncate text-faint">{row.email}</span>
                  </span>
                  <span className="label shrink-0 text-faint">{timeAgo(row.created_at)}</span>
                  <span aria-hidden className="label shrink-0 text-faint">
                    {open ? "−" : "+"}
                  </span>
                </button>

                {open && (
                  <div className="grid gap-4 border-t border-hair p-5">
                    {row.services.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="label mr-1 text-faint">Wants</span>
                        {row.services.map((s) => (
                          <span key={s} className="label border border-hair px-2 py-0.5 text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {row.message}
                    </p>

                    <p className="label text-faint">Sent {formatDate(row.created_at)}</p>

                    <div className="flex flex-wrap items-center gap-2 border-t border-hair pt-4">
                      <a
                        href={`mailto:${row.email}?subject=${encodeURIComponent(
                          `Re: your enquiry — ${siteProfile.name}`,
                        )}`}
                        className="label border border-gold/45 px-3 py-1.5 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
                      >
                        Reply by email
                      </a>

                      {(["read", "replied", "archived", "spam"] as EnquiryStatus[])
                        .filter((s) => s !== row.status)
                        .map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void setStatus(row.id, s)}
                            className="label border border-hair px-3 py-1.5 text-muted-foreground transition-colors duration-300 hover:border-border hover:text-foreground disabled:opacity-50"
                          >
                            Mark {ENQUIRY_STATUS_META[s].label.toLowerCase()}
                          </button>
                        ))}

                      {confirmDelete === row.id ? (
                        <span className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void remove(row.id)}
                            className="label text-destructive disabled:opacity-50"
                          >
                            Delete for good
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="label text-faint"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(row.id)}
                          className="label ml-auto text-faint transition-colors duration-300 hover:text-destructive"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- people ----

function People({
  rows,
  postsByAuthor,
}: {
  rows: PersonOverview[]
  postsByAuthor: Map<string, PostWithRelations[]>
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-hair p-14 text-center">
        <p className="text-sm text-muted-foreground">No accounts yet.</p>
      </div>
    )
  }

  return (
    <ul className="grid gap-3">
      {rows.map((person) => {
        const open = openId === person.id
        const theirPosts = postsByAuthor.get(person.id) ?? []

        return (
          <li key={person.id} className="border border-hair bg-card/40">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : person.id)}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 p-4 text-left transition-colors duration-300 hover:bg-foreground/2"
            >
              <Avatar name={person.full_name ?? person.email} size={36} />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {person.full_name ?? "Unnamed"}
                  </span>
                  <span className="label border border-hair px-1.5 py-0.5 text-faint">
                    {ROLE_LABEL[person.role]}
                  </span>
                  {!person.email_confirmed && (
                    <span className="label border border-destructive/40 px-1.5 py-0.5 text-destructive">
                      Unconfirmed
                    </span>
                  )}
                </span>
                <span className="label block truncate text-faint">{person.email}</span>
              </span>

              <span className="grid shrink-0 grid-cols-3 gap-x-5 text-right">
                <Mini label="Live" value={person.posts_published} />
                <Mini label="Drafts" value={person.posts_drafting + person.posts_in_review} />
                <Mini label="Views" value={person.total_views} />
              </span>

              <span className="w-28 shrink-0 text-right">
                <span className="label block text-faint">
                  {person.last_sign_in_at ? timeAgo(person.last_sign_in_at) : "never in"}
                </span>
                <span className="label block text-faint/60">
                  joined {formatDate(person.joined_at)}
                </span>
              </span>
            </button>

            {open && (
              <div className="border-t border-hair p-5">
                {theirPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Has not written anything yet.</p>
                ) : (
                  <ul className="divide-y divide-hair border border-hair">
                    {theirPosts.map((post) => (
                      <li
                        key={post.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {post.title}
                        </span>
                        <span className={cn("label border px-2 py-0.5", STATUS_META[post.status].tone)}>
                          {STATUS_META[post.status].label}
                        </span>
                        <span className="label w-24 shrink-0 text-right text-faint">
                          {post.status === "published"
                            ? formatDate(post.published_at)
                            : timeAgo(post.updated_at)}
                        </span>
                        <span className="label w-20 shrink-0 text-right text-faint">
                          {post.view_count.toLocaleString()} views
                        </span>
                        {post.status === "published" && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="label shrink-0 text-faint no-underline hover:text-gold"
                          >
                            Open
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------- chrome ----

function Frame({ children }: { children: ReactNode }) {
  const { signOut, session } = useAuth()

  return (
    <div className="relative z-2 min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-hair bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-[min(1320px,100%-3rem)] items-center gap-5 py-3.5">
          <Link to="/" className="font-display text-sm font-semibold tracking-tight no-underline">
            {siteProfile.first}
            <span className="text-gold">.</span>
          </Link>
          <span className="label border border-gold/40 px-2 py-0.5 text-gold">Admin</span>

          <div className="ml-auto flex items-center gap-4">
            <Link to="/studio" className="label text-faint no-underline hover:text-foreground">
              Studio
            </Link>
            <Link to="/blog" className="label text-faint no-underline hover:text-foreground">
              Blog
            </Link>
            {session && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="label text-faint transition-colors duration-300 hover:text-gold"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-[min(1320px,100%-3rem)] py-8">{children}</div>
    </div>
  )
}

function Gate({ title, body, to, cta }: { title: string; body: string; to: string; cta: string }) {
  return (
    <div className="border border-hair bg-card/40 p-8">
      <p className="label text-gold">{title}</p>
      <p className="mt-3 max-w-[52ch] text-sm text-muted-foreground">{body}</p>
      <Link
        to={to}
        className="label mt-6 inline-block border border-gold/40 px-4 py-2 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
      >
        {cta}
      </Link>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("border bg-card/40 p-5", highlight ? "border-gold/40" : "border-hair")}>
      <p className="label text-faint">{label}</p>
      <p
        className={cn(
          "num mt-2 font-display text-3xl font-semibold",
          highlight ? "text-gold" : "text-foreground",
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <span className="block">
      <span className="num block font-display text-sm font-semibold text-foreground">
        {value.toLocaleString()}
      </span>
      <span className="label block text-faint/70">{label}</span>
    </span>
  )
}
