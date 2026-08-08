import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/lib/blog/auth"
import { listProfiles } from "@/lib/blog/queries"
import { setUserRole } from "@/lib/blog/mutations"
import { formatDate } from "@/lib/blog/format"
import { Avatar } from "@/components/blog/Avatar"
import { ROLE_LABEL, type Profile, type UserRole } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

/**
 * Admin is not on this list. Since migration 0009 it belongs to one email
 * address rather than being a role that can be handed out, and the database
 * raises if anyone tries — so offering a button for it would only ever produce
 * an error.
 */
const ASSIGNABLE: UserRole[] = ["reader", "contributor", "editor"]

const ROLE_NOTE: Record<UserRole, string> = {
  reader: "Read-only. Use this to revoke someone's writing access.",
  contributor: "Writes drafts, submits for review. Cannot publish. New signups get this.",
  editor: "Publishes and moderates the review queue.",
  admin: "The owner's account only — fixed to one email address, not grantable.",
}

/**
 * Role management, admin only. The database enforces the same restriction —
 * and one rule it enforces that this screen cannot express is that an editor
 * may grant contributor but never editor or admin.
 */
export function PeoplePage() {
  const { user, refreshProfile } = useAuth()

  const [people, setPeople] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPeople(await listProfiles())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load people")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const change = async (id: string, role: UserRole) => {
    setBusyId(id)
    setError(null)
    try {
      await setUserRole(id, role)
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)))
      if (id === user?.id) await refreshProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change that role")
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="label text-gold">Admin</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight uppercase">People</h1>
        <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">
          Everyone with an account. Roles decide what the database will let them do, not just what
          the studio shows them.
        </p>
      </header>

      <dl className="grid gap-2 border border-hair bg-card/40 p-4 sm:grid-cols-2">
        {([...ASSIGNABLE, "admin"] as UserRole[]).map((r) => (
          <div key={r} className="flex gap-3">
            <dt className="label w-24 shrink-0 text-gold">{ROLE_LABEL[r]}</dt>
            <dd className="text-xs text-muted-foreground">{ROLE_NOTE[r]}</dd>
          </div>
        ))}
      </dl>

      {error && (
        <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="label animate-pulse text-faint">Loading…</p>
      ) : (
        <ul className="divide-y divide-hair border border-hair">
          {people.map((person) => (
            <li key={person.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
              <Avatar name={person.full_name ?? "Unnamed"} url={person.avatar_url} size={32} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {person.full_name ?? "Unnamed"}
                  {person.id === user?.id && <span className="label ml-2 text-faint">you</span>}
                </p>
                <p className="label truncate text-faint">joined {formatDate(person.created_at)}</p>
              </div>

              {/* The owner has no role picker — admin is their email address,
                  not something this screen can give or take away. */}
              {person.role === "admin" ? (
                <span className="label border border-gold/50 bg-gold/10 px-2.5 py-1 text-gold">
                  Admin · owner
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {ASSIGNABLE.map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={busyId === person.id || person.id === user?.id}
                      onClick={() => void change(person.id, r)}
                      title={
                        person.id === user?.id
                          ? "You cannot change your own role here — use the SQL editor."
                          : ROLE_NOTE[r]
                      }
                      className={cn(
                        "label border px-2 py-1 transition-colors duration-300",
                        person.role === r
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-hair text-faint hover:border-border hover:text-foreground",
                        (busyId === person.id || person.id === user?.id) &&
                          "pointer-events-none opacity-50",
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
