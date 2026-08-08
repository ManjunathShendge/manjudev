/**
 * Domain types for the blog. Hand-written to mirror `supabase/migrations`
 * rather than generated, so the two can drift — if you change a column, change
 * it here too. Once the schema settles, `supabase gen types typescript` can
 * replace this file wholesale.
 */

export type UserRole = "reader" | "contributor" | "editor" | "admin"

export type PostStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "scheduled"
  | "published"
  | "archived"

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  github_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  sort_order: number
  created_at: string
}

export type Tag = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_url: string | null
  cover_alt: string | null
  body_html: string
  body_text: string
  category_id: string | null
  author_id: string
  status: PostStatus
  featured: boolean
  reading_minutes: number
  published_at: string | null
  scheduled_for: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  canonical_url: string | null
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

/** What the list and detail queries actually return, joins included. */
export type PostWithRelations = Post & {
  author: Pick<
    Profile,
    "id" | "full_name" | "avatar_url" | "bio" | "website" | "github_url" | "linkedin_url" | "twitter_url"
  > | null
  category: Pick<Category, "id" | "name" | "slug" | "color"> | null
  post_tags: { tag: Pick<Tag, "id" | "name" | "slug"> | null }[]
}

export type PostRevision = {
  id: string
  post_id: string
  title: string | null
  excerpt: string | null
  body_html: string | null
  saved_by: string | null
  created_at: string
}

/** The shape the editor holds while you are typing. */
export type PostDraft = {
  id?: string
  title: string
  slug: string
  excerpt: string
  cover_url: string | null
  cover_alt: string
  body_html: string
  body_text: string
  category_id: string | null
  tags: string[]
  featured: boolean
  status: PostStatus
  scheduled_for: string | null
  seo_title: string
  seo_description: string
  og_image_url: string | null
  canonical_url: string
}

/** Human labels and the colour each status carries through the studio UI. */
export const STATUS_META: Record<PostStatus, { label: string; tone: string; hint: string }> = {
  draft: {
    label: "Draft",
    tone: "text-faint border-hair",
    hint: "Only you can see this.",
  },
  in_review: {
    label: "In review",
    tone: "text-peri border-peri/40",
    hint: "Waiting for an editor to read it.",
  },
  changes_requested: {
    label: "Changes requested",
    tone: "text-destructive border-destructive/40",
    hint: "An editor sent it back with a note.",
  },
  scheduled: {
    label: "Scheduled",
    tone: "text-gold border-gold/40",
    hint: "Goes live automatically at the time set.",
  },
  published: {
    label: "Published",
    tone: "text-mint border-mint/40",
    hint: "Live on the blog.",
  },
  archived: {
    label: "Archived",
    tone: "text-faint border-hair",
    hint: "Taken down, but kept.",
  },
}

export const ROLE_LABEL: Record<UserRole, string> = {
  reader: "Reader",
  contributor: "Contributor",
  editor: "Editor",
  admin: "Admin",
}
