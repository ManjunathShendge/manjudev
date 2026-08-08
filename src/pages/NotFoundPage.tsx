import { Link } from "react-router-dom"
import { BlogShell } from "@/components/blog/BlogShell"
import { useDocumentMeta } from "@/lib/blog/useDocumentMeta"

export function NotFoundPage() {
  useDocumentMeta({ title: "Not found", description: "There is nothing at this address." })

  return (
    <BlogShell>
      <div className="mx-auto w-[min(1180px,100%-3rem)] py-32 text-center">
        <p className="label text-gold">404</p>
        <h1 className="mt-4 text-[clamp(2rem,7vw,4.5rem)] leading-none font-semibold tracking-tight uppercase">
          Nothing here
        </h1>
        <p className="mx-auto mt-5 max-w-[44ch] text-sm text-muted-foreground">
          That address does not point at anything. The story is on the front page and the
          writing is in the index.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="label border border-gold/40 px-4 py-2 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
          >
            Portfolio
          </Link>
          <Link
            to="/blog"
            className="label border border-hair px-4 py-2 text-muted-foreground no-underline transition-colors duration-300 hover:border-border hover:text-foreground"
          >
            Writing
          </Link>
        </div>
      </div>
    </BlogShell>
  )
}
