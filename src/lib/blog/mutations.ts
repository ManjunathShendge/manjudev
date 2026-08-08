import { requireSupabase } from "@/lib/supabase"
import { htmlToText, readingMinutes, slugify } from "@/lib/blog/format"
import type {
  Post,
  PostDraft,
  PostStatus,
  Profile,
  UserRole,
} from "@/lib/blog/types"

const MEDIA_BUCKET = "blog-media"

/**
 * Slugs are unique in the database, so a collision is a failed save rather
 * than a silent overwrite. Resolve it here instead — "state-of-react" becomes
 * "state-of-react-2" — because the person typing a title should not have to
 * know what someone else called their post.
 */
export async function ensureUniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const db = requireSupabase()
  const base = slugify(desired) || "post"

  let candidate = base
  for (let n = 2; n < 60; n++) {
    let query = db.from("posts").select("id").eq("slug", candidate).limit(1)
    if (excludeId) query = query.neq("id", excludeId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return candidate

    candidate = `${base}-${n}`
  }
  return `${base}-${Date.now()}`
}

/** Coin any tag that does not exist yet, then hand back ids for all of them. */
async function resolveTagIds(names: string[]): Promise<string[]> {
  const db = requireSupabase()
  const cleaned = Array.from(
    new Map(
      names
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => [slugify(n), n]),
    ).entries(),
  ).filter(([slug]) => slug.length > 0)

  if (cleaned.length === 0) return []

  // `ignoreDuplicates` makes this ON CONFLICT DO NOTHING, which only needs
  // INSERT rights — a contributor has those on tags but not UPDATE.
  const { error: insertError } = await db
    .from("tags")
    .upsert(
      cleaned.map(([slug, name]) => ({ name, slug })),
      { onConflict: "slug", ignoreDuplicates: true },
    )
  if (insertError) throw new Error(insertError.message)

  const { data, error } = await db
    .from("tags")
    .select("id, slug")
    .in("slug", cleaned.map(([slug]) => slug))

  if (error) throw new Error(error.message)
  return (data ?? []).map((t) => (t as { id: string }).id)
}

async function syncPostTags(postId: string, tagNames: string[]): Promise<void> {
  const db = requireSupabase()
  const tagIds = await resolveTagIds(tagNames)

  // Replace rather than diff: the set is small, and a diff has more ways to be
  // subtly wrong than this has to be slow.
  const { error: clearError } = await db.from("post_tags").delete().eq("post_id", postId)
  if (clearError) throw new Error(clearError.message)

  if (tagIds.length === 0) return

  const { error } = await db
    .from("post_tags")
    .insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })))
  if (error) throw new Error(error.message)
}

/**
 * Create or update a post, tags included. Reading time and the plain-text twin
 * are derived here rather than asked for — they are facts about the body, not
 * decisions the author should have to make.
 */
export async function savePost(draft: PostDraft, authorId: string): Promise<Post> {
  const db = requireSupabase()

  const bodyText = htmlToText(draft.body_html)
  const slug = await ensureUniqueSlug(draft.slug || draft.title, draft.id)

  const row = {
    slug,
    title: draft.title.trim() || "Untitled",
    excerpt: draft.excerpt.trim() || null,
    cover_url: draft.cover_url,
    cover_alt: draft.cover_alt.trim() || null,
    body_html: draft.body_html,
    body_text: bodyText,
    category_id: draft.category_id,
    status: draft.status,
    featured: draft.featured,
    reading_minutes: readingMinutes(bodyText),
    scheduled_for: draft.status === "scheduled" ? draft.scheduled_for : null,
    seo_title: draft.seo_title.trim() || null,
    seo_description: draft.seo_description.trim() || null,
    og_image_url: draft.og_image_url,
    canonical_url: draft.canonical_url.trim() || null,
  }

  const { data, error } = draft.id
    ? await db.from("posts").update(row).eq("id", draft.id).select().single()
    : await db
        .from("posts")
        .insert({ ...row, author_id: authorId })
        .select()
        .single()

  if (error) throw new Error(friendlyError(error.message))

  const saved = data as Post
  await syncPostTags(saved.id, draft.tags)
  return saved
}

export async function deletePost(id: string): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.from("posts").delete().eq("id", id)
  if (error) throw new Error(friendlyError(error.message))
}

/**
 * The moderation action. Editors move a post anywhere; the note is what the
 * author reads when it comes back to them, so it travels with the status.
 */
export async function setPostStatus(
  id: string,
  status: PostStatus,
  reviewNote?: string | null,
): Promise<void> {
  const db = requireSupabase()
  const patch: Record<string, unknown> = { status }
  if (reviewNote !== undefined) patch.review_note = reviewNote
  if (status === "published") patch.scheduled_for = null

  const { error } = await db.from("posts").update(patch).eq("id", id)
  if (error) throw new Error(friendlyError(error.message))
}

// -------------------------------------------------------------- people ----

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, "full_name" | "bio" | "avatar_url" | "website" | "github_url" | "linkedin_url" | "twitter_url">>,
): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.from("profiles").update(patch).eq("id", id)
  if (error) throw new Error(friendlyError(error.message))
}

export async function setUserRole(id: string, role: UserRole): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.from("profiles").update({ role }).eq("id", id)
  if (error) throw new Error(friendlyError(error.message))
}

// ---------------------------------------------------------------- media ----

/**
 * Uploads land under `<user id>/…`, which is the shape the storage policy
 * checks. The filename keeps the original stem so the media list stays
 * readable, with a timestamp in front to make it unique.
 */
export async function uploadMedia(file: File, userId: string): Promise<string> {
  const db = requireSupabase()

  const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "image"
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase()
  const path = `${userId}/${Date.now()}-${safeName}.${ext}`

  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  })
  if (error) throw new Error(friendlyError(error.message))

  const { data } = db.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function listMyMedia(userId: string) {
  const db = requireSupabase()
  const { data, error } = await db.storage.from(MEDIA_BUCKET).list(userId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  })
  if (error) throw new Error(error.message)

  return (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name,
      path: `${userId}/${f.name}`,
      url: db.storage.from(MEDIA_BUCKET).getPublicUrl(`${userId}/${f.name}`).data.publicUrl,
    }))
}

export async function deleteMedia(path: string): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.storage.from(MEDIA_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

/**
 * Postgres speaks in constraint names. Translate the handful the studio can
 * actually provoke, so a rejected save reads as an instruction rather than as
 * a stack trace.
 */
function friendlyError(message: string): string {
  if (message.includes("posts_slug_key")) {
    return "That URL slug is already taken. Change the slug and save again."
  }
  if (message.includes("row-level security") || message.includes("violates row-level")) {
    return "You do not have permission to do that. Contributors can save and submit drafts; publishing is an editor action."
  }
  if (message.includes("insufficient privilege to change role")) {
    return "Only an admin can change someone's role."
  }
  return message
}
