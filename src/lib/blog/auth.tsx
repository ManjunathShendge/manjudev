import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"

import { isSupabaseConfigured, siteOrigin, supabase } from "@/lib/supabase"
import type { Profile, UserRole } from "@/lib/blog/types"

type AuthValue = {
  /** False until the first session check settles — everything else is a lie before then. */
  ready: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  role: UserRole | null
  isAdmin: boolean
  isEditor: boolean
  canWrite: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/**
 * Session + profile, in one place.
 *
 * Two things are worth knowing about it. First, the role it exposes is a
 * convenience for deciding what to *show* — the database decides what is
 * allowed, and every rule here is enforced again by RLS. Second, with no
 * credentials configured it settles immediately into a signed-out state rather
 * than hanging, which is what keeps the portfolio unaffected by an empty .env.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!supabase) return

    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setReady(true)
    })

    // Deliberately synchronous: awaiting inside this callback can deadlock the
    // client's internal lock. The profile fetch is a separate effect below.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  const loadProfile = useCallback(async () => {
    if (!supabase || !userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("Could not load profile", error)
      setProfile(null)
      return
    }
    setProfile((data as Profile | null) ?? null)
  }, [userId])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const value = useMemo<AuthValue>(() => {
    const role = profile?.role ?? null

    return {
      ready,
      session,
      user: session?.user ?? null,
      profile,
      role,
      isAdmin: role === "admin",
      isEditor: role === "editor" || role === "admin",
      canWrite: role === "contributor" || role === "editor" || role === "admin",

      async signUp(email, password, fullName) {
        if (!supabase) throw new Error("Supabase is not connected.")
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            // Where Supabase sends them after they click the confirmation link.
            emailRedirectTo: `${siteOrigin()}/studio`,
          },
        })
        if (error) throw error
      },

      async signIn(email, password) {
        if (!supabase) throw new Error("Supabase is not connected.")
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },

      async signInWithMagicLink(email) {
        if (!supabase) throw new Error("Supabase is not connected.")
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${siteOrigin()}/studio` },
        })
        if (error) throw error
      },

      async requestPasswordReset(email) {
        if (!supabase) throw new Error("Supabase is not connected.")
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteOrigin()}/studio/account`,
        })
        if (error) throw error
      },

      async signOut() {
        if (!supabase) return
        await supabase.auth.signOut()
        setProfile(null)
      },

      refreshProfile: loadProfile,
    }
  }, [ready, session, profile, loadProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
