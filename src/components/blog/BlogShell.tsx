import type { ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import { profile } from "@/data/story"
import { useAuth } from "@/lib/blog/auth"
import { cn } from "@/lib/utils"

const nav = [
  { to: "/", label: "Portfolio", end: true },
  { to: "/blog", label: "Writing", end: false },
]

/**
 * Chrome for everything that is not the portfolio. The portfolio has no
 * persistent nav on purpose — it is a single scroll — so the blog brings its
 * own rather than pushing a header onto the story.
 */
export function BlogShell({ children }: { children: ReactNode }) {
  const { session, canWrite, ready } = useAuth()

  return (
    <div className="relative z-2 flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-hair bg-background/72 backdrop-blur-md">
        <div className="mx-auto flex w-[min(1180px,100%-3rem)] items-center gap-4 py-4 sm:gap-6">
          <Link
            to="/"
            className="font-display text-sm font-semibold tracking-tight whitespace-nowrap no-underline"
          >
            {profile.first}
            <span className="text-gold">.</span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "label whitespace-nowrap no-underline transition-colors duration-300",
                    // The wordmark already goes home, so on a phone the
                    // Portfolio link is a duplicate that costs the CTA its room.
                    item.to === "/" && "hidden sm:inline",
                    isActive ? "text-gold" : "text-faint hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            {ready && (
              <Link
                to="/studio"
                className="label border border-hair px-2.5 py-1.5 whitespace-nowrap text-muted-foreground no-underline transition-colors duration-300 hover:border-gold/40 hover:text-gold sm:px-3"
              >
                {session ? (
                  canWrite ? (
                    "Studio"
                  ) : (
                    "Account"
                  )
                ) : (
                  <>
                    Write<span className="hidden sm:inline"> for us</span>
                  </>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t border-hair">
        <div className="mx-auto flex w-[min(1180px,100%-3rem)] flex-wrap items-center justify-between gap-4 py-8">
          <p className="label text-faint">
            © {new Date().getFullYear()} {profile.name}
          </p>
          <nav className="flex flex-wrap items-center gap-5">
            <Link to="/blog" className="label text-faint no-underline hover:text-foreground">
              All posts
            </Link>
            <Link to="/studio" className="label text-faint no-underline hover:text-foreground">
              Write for us
            </Link>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="label text-faint no-underline hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="label text-gold no-underline"
            >
              Get in touch
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
