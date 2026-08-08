import { useEffect, useState, type FormEvent } from "react"

import { useAuth } from "@/lib/blog/auth"
import { updateProfile } from "@/lib/blog/mutations"
import { ImageField } from "@/components/studio/ImageField"
import { ROLE_LABEL } from "@/lib/blog/types"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const field =
  "w-full rounded-none border border-hair bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-faint transition-colors duration-300 focus:border-gold/50 focus:outline-none"

/** Your byline, and the only place a password gets changed. */
export function AccountPage() {
  const { user, profile, role, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [website, setWebsite] = useState("")
  const [github, setGithub] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [twitter, setTwitter] = useState("")

  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [passwordNote, setPasswordNote] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? "")
    setBio(profile.bio ?? "")
    setAvatar(profile.avatar_url)
    setWebsite(profile.website ?? "")
    setGithub(profile.github_url ?? "")
    setLinkedin(profile.linkedin_url ?? "")
    setTwitter(profile.twitter_url ?? "")
  }, [profile])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await updateProfile(user.id, {
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatar,
        website: website.trim() || null,
        github_url: github.trim() || null,
        linkedin_url: linkedin.trim() || null,
        twitter_url: twitter.trim() || null,
      })
      await refreshProfile()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setPasswordNote(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setPasswordNote(err ? err.message : "Password updated.")
    if (!err) setPassword("")
  }

  return (
    <div className="grid max-w-3xl gap-8">
      <header>
        <p className="label text-gold">Account</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight uppercase">Your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is what appears under anything you publish.{" "}
          {role && <span className="text-faint">Role: {ROLE_LABEL[role]}.</span>}
        </p>
      </header>

      <form onSubmit={save} className="grid gap-5 border border-hair bg-card/40 p-6 md:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="label text-faint">Name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your byline"
              className={field}
            />
          </label>
          <label className="grid gap-2">
            <span className="label text-faint">Email</span>
            <input readOnly value={user?.email ?? ""} className={cn(field, "cursor-not-allowed text-faint")} />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="label text-faint">Bio</span>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A sentence or two, shown under your posts."
            className={cn(field, "resize-y")}
          />
        </label>

        {user && (
          <div className="max-w-56">
            <ImageField
              label="Avatar"
              value={avatar}
              onChange={setAvatar}
              userId={user.id}
              aspect="aspect-square"
            />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="label text-faint">Website</span>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={field} />
          </label>
          <label className="grid gap-2">
            <span className="label text-faint">GitHub</span>
            <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" className={field} />
          </label>
          <label className="grid gap-2">
            <span className="label text-faint">LinkedIn</span>
            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className={field} />
          </label>
          <label className="grid gap-2">
            <span className="label text-faint">X</span>
            <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" className={field} />
          </label>
        </div>

        {error && (
          <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {saved && <p className="label text-mint">Saved.</p>}

        <button
          type="submit"
          disabled={busy}
          className="label justify-self-start border border-gold/50 bg-gold/10 px-5 py-3 text-gold transition-colors duration-300 hover:bg-gold/20 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form onSubmit={changePassword} className="grid gap-4 border border-hair bg-card/40 p-6 md:p-8">
        <h2 className="text-sm font-semibold tracking-tight uppercase">Change password</h2>
        <label className="grid gap-2">
          <span className="label text-faint">New password</span>
          <input
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={field}
          />
        </label>
        {passwordNote && <p className="label text-mint">{passwordNote}</p>}
        <button
          type="submit"
          className="label justify-self-start border border-hair px-5 py-3 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold"
        >
          Update password
        </button>
      </form>
    </div>
  )
}
