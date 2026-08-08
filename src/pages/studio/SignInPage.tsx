import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"

import { SetupNotice } from "@/components/blog/SetupNotice"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/lib/blog/auth"
import { useDocumentMeta } from "@/lib/blog/useDocumentMeta"
import { profile as siteProfile } from "@/data/story"
import { cn } from "@/lib/utils"

type Mode = "signin" | "signup" | "magic" | "reset"

const field =
  "w-full rounded-none border border-hair bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-faint transition-colors duration-300 focus:border-gold/50 focus:outline-none"

const COPY: Record<Mode, { title: string; blurb: string; action: string }> = {
  signin: {
    title: "Sign in",
    blurb: "Pick up where you left off.",
    action: "Sign in",
  },
  signup: {
    title: "Create an account",
    blurb:
      "Confirm your email and the editor is yours — no waiting to be let in. Publishing is the one thing that stays with an editor.",
    action: "Create account",
  },
  magic: {
    title: "Email me a link",
    blurb: "No password. We send a one-time link that signs you in.",
    action: "Send the link",
  },
  reset: {
    title: "Reset your password",
    blurb: "We will email you a link to set a new one.",
    action: "Send reset link",
  },
}

/**
 * One screen, four jobs. Splitting sign-in from sign-up across two pages moves
 * the decision before the form, which is exactly where people who are not sure
 * whether they already have an account get stuck.
 */
export function SignInPage() {
  const { signIn, signUp, signInWithMagicLink, requestPasswordReset } = useAuth()

  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  useDocumentMeta({ title: "Studio", description: "Sign in to write for the blog." })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSent(null)

    try {
      if (mode === "signin") {
        await signIn(email, password)
      } else if (mode === "signup") {
        await signUp(email, password, name)
        setSent(
          "Account created. Check your inbox and click the confirmation link — you cannot sign in until the address is verified.",
        )
      } else if (mode === "magic") {
        await signInWithMagicLink(email)
        setSent("Link sent. Open it on this device and you will land back here signed in.")
      } else {
        await requestPasswordReset(email)
        setSent("If that address has an account, a reset link is on its way.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  const copy = COPY[mode]

  return (
    <div className="relative z-2 flex min-h-dvh flex-col">
      <header className="border-b border-hair">
        <div className="mx-auto flex w-[min(1180px,100%-3rem)] items-center justify-between py-4">
          <Link to="/" className="font-display text-sm font-semibold tracking-tight no-underline">
            {siteProfile.first}
            <span className="text-gold">.</span>
          </Link>
          <Link to="/blog" className="label text-faint no-underline hover:text-foreground">
            ← Back to the blog
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-[min(1180px,100%-3rem)] flex-1 items-center gap-14 py-16 lg:grid-cols-2">
        {/* -------------------------------------------------------- pitch -- */}
        <div>
          <p className="label text-gold">The studio</p>
          <h1 className="mt-4 text-[clamp(1.9rem,5vw,3.4rem)] leading-[1.02] font-semibold tracking-tight uppercase">
            Write here
          </h1>
          <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
            This is the CMS behind the writing on this site, and it is open. Sign up, confirm
            your email, and the editor is yours — drafts, images, your own byline. The one thing
            that is not automatic is going live: every post is read before it is published.
          </p>

          <ol className="mt-8 grid gap-4">
            {[
              ["Create an account", "Email and password, or a one-time link."],
              ["Verify your email", "Standard confirmation link. Nothing works until you click it."],
              ["Start writing", "The full editor, straight away. No application to clear."],
              ["Submit when ready", "It goes into the review queue, and gets read before it goes live."],
            ].map(([title, detail], i) => (
              <li key={title} className="flex gap-4">
                <span className="label shrink-0 text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{title}</span>
                  <span className="block text-sm text-muted-foreground">{detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* --------------------------------------------------------- form -- */}
        {!isSupabaseConfigured ? (
          <SetupNotice context="The studio" />
        ) : (
          <div className="border border-hair bg-card/50">
            {/*
              Sign in and sign up are the two things people come here to do, so
              they are a visible choice at the top rather than two entries in a
              row of quiet links. Magic link and password reset stay quiet —
              they are detours, not destinations.
            */}
            <div className="grid grid-cols-2">
              {(
                [
                  ["signin", "Sign in"],
                  ["signup", "Create account"],
                ] as [Mode, string][]
              ).map(([m, label]) => {
                // The two detour modes belong to sign-in; keep that tab lit.
                const on = mode === m || (m === "signin" && (mode === "magic" || mode === "reset"))
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m)
                      setError(null)
                      setSent(null)
                    }}
                    className={cn(
                      "label border-b-2 px-3 py-4 transition-colors duration-300",
                      on
                        ? "border-gold bg-gold/6 text-gold"
                        : "border-hair text-faint hover:bg-foreground/2 hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="p-6 md:p-8">
            <h2 className="text-lg font-semibold tracking-tight uppercase">{copy.title}</h2>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-muted-foreground">{copy.blurb}</p>

            <form onSubmit={submit} className="grid gap-4">
              {mode === "signup" && (
                <label className="grid gap-2">
                  <span className="label text-faint">Your name *</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="How your byline should read"
                    className={field}
                  />
                </label>
              )}

              <label className="grid gap-2">
                <span className="label text-faint">Email *</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={field}
                />
              </label>

              {(mode === "signin" || mode === "signup") && (
                <label className="grid gap-2">
                  <span className="label text-faint">Password *</span>
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                    className={field}
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={busy}
                className="label mt-2 border border-gold/50 bg-gold/10 px-5 py-3 text-gold transition-colors duration-300 hover:bg-gold/20 disabled:opacity-50"
              >
                {busy ? "Working…" : copy.action}
              </button>
            </form>

            <AnimatePresence mode="wait">
              {sent && (
                <motion.p
                  key="sent"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="status"
                  className="mt-4 border border-mint/30 bg-mint/5 p-3 text-sm text-mint"
                >
                  {sent}
                </motion.p>
              )}
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="mt-4 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-hair pt-5">
              {(
                mode === "magic" || mode === "reset"
                  ? ([["signin", "← Back to sign in"]] as [Mode, string][])
                  : ([
                      ["magic", "Email me a link instead"],
                      ["reset", "Forgot password"],
                    ] as [Mode, string][])
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m)
                    setError(null)
                    setSent(null)
                  }}
                  className="label text-faint transition-colors duration-300 hover:text-gold"
                >
                  {label}
                </button>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
