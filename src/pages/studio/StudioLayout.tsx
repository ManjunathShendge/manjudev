import type { ReactNode } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"

import { useAuth } from "@/lib/blog/auth"
import { ROLE_LABEL } from "@/lib/blog/types"
import { profile as siteProfile } from "@/data/story"
import { cn } from "@/lib/utils"

/**
 * Chrome for the CMS. Deliberately plainer than the public side — this is a
 * tool, and every pixel spent on atmosphere here is one that makes a long list
 * of drafts harder to scan.
 */
export function StudioLayout({ children }: { children: ReactNode }) {
  const { profile, role, canWrite, isEditor, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: "/studio", label: "Overview", end: true, show: true },
    { to: "/studio/posts", label: "Posts", end: false, show: canWrite },
    { to: "/studio/review", label: "Review queue", end: false, show: isEditor },
    { to: "/studio/people", label: "People", end: false, show: isAdmin },
    { to: "/studio/account", label: "Account", end: false, show: true },
  ].filter((l) => l.show)

  return (
    <div className="relative z-2 min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-hair bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-[min(1320px,100%-3rem)] items-center gap-5 py-3.5">
          <Link to="/" className="font-display text-sm font-semibold tracking-tight no-underline">
            {siteProfile.first}
            <span className="text-gold">.</span>
          </Link>
          <span className="label hidden text-faint sm:block">Studio</span>

          <div className="ml-auto flex items-center gap-4">
            <Link to="/blog" className="label text-faint no-underline hover:text-foreground">
              View blog
            </Link>
            {role && (
              <span className="label hidden border border-hair px-2 py-1 text-muted-foreground sm:block">
                {ROLE_LABEL[role]}
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                await signOut()
                navigate("/studio")
              }}
              className="label text-faint transition-colors duration-300 hover:text-gold"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-[min(1320px,100%-3rem)] gap-8 py-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="label mb-3 hidden text-faint lg:block">
            {profile?.full_name ?? "Signed in"}
          </p>
          {/* Horizontal tabs on small screens, a rail on wide ones. */}
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "label shrink-0 border px-3 py-2 whitespace-nowrap no-underline transition-colors duration-300 lg:border-x-0 lg:border-y-0 lg:border-l lg:px-4",
                    isActive
                      ? "border-gold/50 bg-gold/8 text-gold lg:border-l-gold"
                      : "border-hair text-faint hover:text-foreground lg:border-l-hair",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
