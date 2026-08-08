import { Suspense, lazy } from "react"
import { Route, Routes } from "react-router-dom"

import { SmoothScroll } from "@/components/SmoothScroll"
import { Starfield } from "@/components/Starfield"
import { CursorFollower } from "@/components/CursorFollower"
import { RouteScrollReset } from "@/components/RouteScrollReset"
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary"
import { AuthProvider } from "@/lib/blog/auth"

/*
  Split at the route boundary. The three parts of this site have almost no
  dependencies in common — the portfolio carries Three.js and GSAP, the studio
  carries TipTap — and in one bundle every visitor pays for all of it. Lazy
  routes cut the portfolio's payload by roughly a third and keep the editor out
  of it entirely.
*/
const PortfolioPage = lazy(() =>
  import("@/pages/PortfolioPage").then((m) => ({ default: m.PortfolioPage })),
)
const BlogIndexPage = lazy(() =>
  import("@/pages/blog/BlogIndexPage").then((m) => ({ default: m.BlogIndexPage })),
)
const BlogPostPage = lazy(() =>
  import("@/pages/blog/BlogPostPage").then((m) => ({ default: m.BlogPostPage })),
)
const StudioRoutes = lazy(() =>
  import("@/pages/studio/StudioRoutes").then((m) => ({ default: m.StudioRoutes })),
)
const AdminPage = lazy(() =>
  import("@/pages/admin/AdminPage").then((m) => ({ default: m.AdminPage })),
)
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
)

/**
 * Two products share one shell: the scrolling portfolio at `/` and the blog
 * platform under `/blog` and `/studio`. What lives here is only what every
 * route needs — the smooth-scroll driver, the ambient starfield, the cursor,
 * and the session.
 */
export default function App() {
  return (
    <AuthProvider>
      <SmoothScroll />
      <RouteScrollReset />
      <Starfield />
      <CursorFollower />

      {/*
        Lazy routes need both wrappers. Suspense covers the chunk arriving
        late; the boundary covers it never arriving at all — a tab left open
        across a deploy asks for a hash that no longer exists, and without a
        boundary that unmounts the whole app to a blank page.

        The body is already the page background, so an empty fallback reads as
        "still loading" rather than as a flash of something else.
      */}
      <RouteErrorBoundary>
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Routes>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/studio/*" element={<StudioRoutes />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </AuthProvider>
  )
}
