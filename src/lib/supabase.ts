import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim()

/**
 * The whole blog is behind this flag. Until the two env vars are filled in the
 * client is `null` — every screen that needs data checks this first and renders
 * a setup notice instead of throwing, so the portfolio still builds and deploys
 * with an empty `.env`.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Needed for the magic-link / email-confirmation redirect back to us.
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null

/**
 * For call sites that only ever run behind a configured check. Throws loudly
 * rather than returning null, so a missed guard shows up as an error message in
 * the UI rather than as a silent no-op.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart the dev server.",
    )
  }
  return supabase
}

/** Public origin, used to build email redirect targets. */
export function siteOrigin(): string {
  return typeof window === "undefined" ? "" : window.location.origin
}
