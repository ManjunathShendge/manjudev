import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase"
import { profile } from "@/data/story"

export type EnquiryStatus = "new" | "read" | "replied" | "archived" | "spam"

export type Enquiry = {
  id: string
  name: string
  email: string
  company: string | null
  services: string[]
  message: string
  status: EnquiryStatus
  admin_note: string | null
  handled_at: string | null
  handled_by: string | null
  created_at: string
}

export type EnquiryInput = {
  name: string
  email: string
  company: string | null
  services: string[]
  message: string
}

export const ENQUIRY_STATUS_META: Record<EnquiryStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "text-gold border-gold/40" },
  read: { label: "Read", tone: "text-peri border-peri/40" },
  replied: { label: "Replied", tone: "text-mint border-mint/40" },
  archived: { label: "Archived", tone: "text-faint border-hair" },
  spam: { label: "Spam", tone: "text-destructive border-destructive/40" },
}

/**
 * The public write. This is the one call in the app an anonymous visitor makes
 * that changes anything, so it stays deliberately small — five columns, no
 * `select()` afterwards.
 *
 * That missing `select()` is not an oversight. The insert policy grants INSERT
 * and nothing else, and PostgREST needs SELECT rights to return the row it
 * just wrote; asking for it back would turn every successful submission into a
 * permission error.
 */
export async function sendEnquiry(input: EnquiryInput): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(`the form is not connected yet — email ${profile.email} instead`)
  }

  const db = requireSupabase()
  const { error } = await db.from("enquiries").insert({
    name: input.name,
    email: input.email,
    company: input.company,
    services: input.services,
    message: input.message,
  })

  if (error) throw new Error(friendly(error.message))
}

// ----------------------------------------------------------------- admin ----

export async function listEnquiries(status?: EnquiryStatus | "all"): Promise<Enquiry[]> {
  const db = requireSupabase()
  let query = db.from("enquiries").select("*").order("created_at", { ascending: false })
  if (status && status !== "all") query = query.eq("status", status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Enquiry[]
}

export async function updateEnquiry(
  id: string,
  patch: { status?: EnquiryStatus; admin_note?: string | null },
): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.from("enquiries").update(patch).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteEnquiry(id: string): Promise<void> {
  const db = requireSupabase()
  const { data, error } = await db.from("enquiries").delete().eq("id", id).select("id")
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error("Nothing was deleted — you may no longer have admin access. Reload and retry.")
  }
}

/** One row per person: identity, last login, and what they have written. */
export type PersonOverview = {
  id: string
  full_name: string | null
  email: string
  role: "reader" | "contributor" | "editor" | "admin"
  joined_at: string
  last_sign_in_at: string | null
  email_confirmed: boolean
  posts_total: number
  posts_published: number
  posts_drafting: number
  posts_in_review: number
  total_views: number
  last_published_at: string | null
}

/**
 * Backed by `admin_people_overview()` — a `security definer` function, because
 * emails and login times live in `auth.users` and no browser-facing role can
 * read that table. The function checks `is_admin()` itself, so a non-admin
 * calling it gets an empty list rather than an error, and never sees an
 * address.
 */
export async function listPeopleOverview(): Promise<PersonOverview[]> {
  const db = requireSupabase()
  const { data, error } = await db.rpc("admin_people_overview")
  if (error) throw new Error(error.message)

  // Postgres `count()` and `sum()` come back as bigint, which PostgREST sends
  // as a string to avoid losing precision. Nothing here will ever be that big.
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...(row as unknown as PersonOverview),
    posts_total: Number(row.posts_total ?? 0),
    posts_published: Number(row.posts_published ?? 0),
    posts_drafting: Number(row.posts_drafting ?? 0),
    posts_in_review: Number(row.posts_in_review ?? 0),
    total_views: Number(row.total_views ?? 0),
  }))
}

/**
 * The visitor reading this did nothing wrong and cannot fix any of it. What
 * they need is one sentence and a working address, not a constraint name — so
 * anything that is really "the site is misconfigured" collapses to the same
 * apology, and the specifics stay in the console for whoever can act on them.
 */
function friendly(message: string): string {
  if (message.includes("enquiries_message_len")) {
    return "that message is a little too long — 5000 characters max"
  }
  if (message.includes("enquiries_name_len")) return "that name is too long"
  if (message.includes("enquiries_email_len")) return "that email address does not look right"

  const misconfigured =
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("row-level security") ||
    message.includes("permission denied")

  if (misconfigured) {
    console.error("Enquiry rejected by the database:", message)
    return "the form is not set up correctly at my end"
  }

  return message
}
