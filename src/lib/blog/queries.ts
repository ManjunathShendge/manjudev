import { requireSupabase } from "@/lib/supabase"
import type {
  Category,
  PostRevision,
  PostStatus,
  PostWithRelations,
  Profile,
  Tag,
} from "@/lib/blog/types"

/**
 * `posts` has two foreign keys into `profiles` (author_id and reviewed_by), so
 * the embed has to name the constraint or PostgREST cannot tell which one is
 * meant. That is what the `!posts_author_id_fkey` is doing.
 */
const POST_SELECT = `
  *,
  author:profiles!posts_author_id_fkey (
    id, full_name, avatar_url, bio, website, github_url, linkedin_url, twitter_url
  ),
  category:categories ( id, name, slug, color ),
  post_tags ( tag:tags ( id, name, slug ) )
`

export const POSTS_PER_PAGE = 9

export type PostFilters = {
  page?: number
  perPage?: number
  categorySlug?: string | null
  tagSlug?: string | null
  search?: string
}

export type PostPage = {
  posts: PostWithRelations[]
  total: number
  page: number
  perPage: number
}

/** The public listing. Only ever returns published work — RLS sees to that. */
export async function listPublishedPosts(filters: PostFilters = {}): Promise<PostPage> {
  const db = requireSupabase()
  const page = Math.max(1, filters.page ?? 1)
  const perPage = filters.perPage ?? POSTS_PER_PAGE

  let query = db
    .from("posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })

  // Slugs are resolved to ids rather than filtered through the embed: an
  // embedded filter needs an inner join, which quietly changes the shape of
  // every other row in the response.
  if (filters.categorySlug) {
    const { data: category } = await db
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle()

    if (!category) return { posts: [], total: 0, page, perPage }
    query = query.eq("category_id", (category as { id: string }).id)
  }

  if (filters.tagSlug) {
    const { data: tag } = await db
      .from("tags")
      .select("id")
      .eq("slug", filters.tagSlug)
      .maybeSingle()

    if (!tag) return { posts: [], total: 0, page, perPage }

    const { data: links } = await db
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", (tag as { id: string }).id)

    const ids = (links ?? []).map((l) => (l as { post_id: string }).post_id)
    if (ids.length === 0) return { posts: [], total: 0, page, perPage }
    query = query.in("id", ids)
  }

  const term = filters.search?.trim()
  if (term) {
    // `websearch` accepts quoted phrases and -exclusions, which is what people
    // type into a search box whether or not you support it.
    query = query.textSearch("search", term, { type: "websearch", config: "english" })
  }

  const from = (page - 1) * perPage
  const { data, error, count } = await query.range(from, from + perPage - 1)
  if (error) throw new Error(error.message)

  return {
    posts: (data ?? []) as unknown as PostWithRelations[],
    total: count ?? 0,
    page,
    perPage,
  }
}

/** The one post that gets the big treatment at the top of the listing. */
export async function getFeaturedPost(): Promise<PostWithRelations | null> {
  const db = requireSupabase()
  const { data, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as PostWithRelations | null) ?? null
}

export async function getPostBySlug(slug: string): Promise<PostWithRelations | null> {
  const db = requireSupabase()
  const { data, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as PostWithRelations | null) ?? null
}

/** Same category first, newest first, never the post you are already reading. */
export async function listRelatedPosts(
  post: PostWithRelations,
  limit = 3,
): Promise<PostWithRelations[]> {
  const db = requireSupabase()
  let query = db
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (post.category_id) query = query.eq("category_id", post.category_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const found = (data ?? []) as unknown as PostWithRelations[]
  if (found.length >= limit || !post.category_id) return found

  // Not enough in that category — top up with the most recent of anything else.
  const { data: rest } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(limit + 1)

  const seen = new Set(found.map((p) => p.id))
  for (const candidate of (rest ?? []) as unknown as PostWithRelations[]) {
    if (found.length >= limit) break
    if (!seen.has(candidate.id)) found.push(candidate)
  }
  return found
}

export async function listCategories(): Promise<Category[]> {
  const db = requireSupabase()
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function listTags(): Promise<Tag[]> {
  const db = requireSupabase()
  const { data, error } = await db.from("tags").select("*").order("name")
  if (error) throw new Error(error.message)
  return (data ?? []) as Tag[]
}

/**
 * Fire-and-forget: a failed view count is not worth showing anyone an error
 * over, and the RPC can only ever add one to one column.
 */
export async function recordView(slug: string): Promise<void> {
  const db = requireSupabase()
  await db.rpc("increment_post_views", { post_slug: slug })
}

// ---------------------------------------------------------------- studio ----

/** Everything the signed-in user is allowed to see, any status. */
export async function listPostsForStudio(options: {
  authorId?: string
  status?: PostStatus | "all"
  search?: string
}): Promise<PostWithRelations[]> {
  const db = requireSupabase()
  let query = db.from("posts").select(POST_SELECT).order("updated_at", { ascending: false })

  if (options.authorId) query = query.eq("author_id", options.authorId)
  if (options.status && options.status !== "all") query = query.eq("status", options.status)
  if (options.search?.trim()) query = query.ilike("title", `%${options.search.trim()}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PostWithRelations[]
}

export async function getPostById(id: string): Promise<PostWithRelations | null> {
  const db = requireSupabase()
  const { data, error } = await db.from("posts").select(POST_SELECT).eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as PostWithRelations | null) ?? null
}

export async function listRevisions(postId: string): Promise<PostRevision[]> {
  const db = requireSupabase()
  const { data, error } = await db
    .from("post_revisions")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return (data ?? []) as PostRevision[]
}

/** People management, admin only — RLS returns nothing useful to anyone else. */
export async function listProfiles(): Promise<Profile[]> {
  const db = requireSupabase()
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Profile[]
}

/** Counts for the studio dashboard, one round trip each but all tiny. */
export async function getStudioCounts(userId: string) {
  const db = requireSupabase()

  const mine = db
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)

  const published = db
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")

  const inReview = db
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "in_review")

  const [mineRes, publishedRes, reviewRes] = await Promise.all([mine, published, inReview])

  return {
    mine: mineRes.count ?? 0,
    published: publishedRes.count ?? 0,
    inReview: reviewRes.count ?? 0,
  }
}
