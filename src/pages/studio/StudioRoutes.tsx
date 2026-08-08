import type { ReactNode } from "react"
import { Link, Navigate, Route, Routes } from "react-router-dom"

import { isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/lib/blog/auth"
import { StudioLayout } from "@/pages/studio/StudioLayout"
import { SignInPage } from "@/pages/studio/SignInPage"
import { DashboardPage } from "@/pages/studio/DashboardPage"
import { PostsPage } from "@/pages/studio/PostsPage"
import { PostEditorPage } from "@/pages/studio/PostEditorPage"
import { ReviewQueuePage } from "@/pages/studio/ReviewQueuePage"
import { PeoplePage } from "@/pages/studio/PeoplePage"
import { AccountPage } from "@/pages/studio/AccountPage"

/**
 * Everything under /studio. The gate is here rather than on each page so there
 * is exactly one place that decides whether you are in — but note that this is
 * about what to *render*: the database enforces the same rules again, and it is
 * the one that counts.
 */
export function StudioRoutes() {
  const { ready, session, canWrite, isEditor, isAdmin } = useAuth()

  // No credentials yet: the sign-in screen carries the setup instructions.
  if (!isSupabaseConfigured) return <SignInPage />

  if (!ready) {
    return (
      <div className="relative z-2 grid min-h-dvh place-items-center">
        <p className="label animate-pulse text-faint">Checking your session…</p>
      </div>
    )
  }

  if (!session) return <SignInPage />

  return (
    <StudioLayout>
      <Routes>
        <Route index element={<DashboardPage />} />

        <Route
          path="posts"
          element={
            <Require allowed={canWrite} reason="writer">
              <PostsPage />
            </Require>
          }
        />
        <Route
          path="posts/new"
          element={
            <Require allowed={canWrite} reason="writer">
              <PostEditorPage />
            </Require>
          }
        />
        <Route
          path="posts/:id"
          element={
            <Require allowed={canWrite} reason="writer">
              <PostEditorPage />
            </Require>
          }
        />

        <Route
          path="review"
          element={
            <Require allowed={isEditor} reason="editor">
              <ReviewQueuePage />
            </Require>
          }
        />
        <Route
          path="people"
          element={
            <Require allowed={isAdmin} reason="admin">
              <PeoplePage />
            </Require>
          }
        />

        <Route path="account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>
    </StudioLayout>
  )
}

const REASON: Record<string, string> = {
  // Signing up grants writing access (migration 0006), so this one should be
  // unreachable. It is still here because an admin can demote someone, and a
  // demoted account landing on a blank screen would be worse than a sentence.
  writer: "Your account does not currently have writing access.",
  editor: "This is an editor's screen — reviewing and publishing other people's work.",
  admin: "Only an admin can manage roles.",
}

function Require({
  allowed,
  reason,
  children,
}: {
  allowed: boolean
  reason: keyof typeof REASON
  children: ReactNode
}) {
  if (allowed) return <>{children}</>

  return (
    <div className="border border-hair bg-card/40 p-8">
      <p className="label text-gold">Not available to you</p>
      <p className="mt-3 max-w-[52ch] text-sm text-muted-foreground">{REASON[reason]}</p>
      <Link
        to="/studio"
        className="label mt-6 inline-block border border-hair px-4 py-2 text-muted-foreground no-underline transition-colors duration-300 hover:border-border hover:text-foreground"
      >
        Back to the studio
      </Link>
    </div>
  )
}
