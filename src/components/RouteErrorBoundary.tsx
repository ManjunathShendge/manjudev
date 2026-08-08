import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { failed: boolean; chunk: boolean }

const RELOAD_FLAG = "route-chunk-reloaded"

/**
 * A missing chunk is not a code bug — it is a stale tab.
 *
 * Routes are lazy, so each one is a separate hashed file. Deploy a new build
 * while someone has the site open and their next navigation asks for a hash
 * that no longer exists on the CDN. `React.lazy` throws, and without a
 * boundary React unmounts the entire tree: the visitor gets a blank page for
 * what is really a cache-versioning problem.
 *
 * So: catch it, reload once — which fetches the new index.html and the new
 * hashes — and use a session flag so a genuinely broken build cannot put the
 * page in a reload loop. Anything that is not a chunk failure gets a plain
 * error screen instead, because reloading will not fix it.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, chunk: false }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error)
    const chunk =
      /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically imported module/i.test(
        message,
      )
    return { failed: true, chunk }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Route failed to render", error, info.componentStack)

    if (this.state.chunk && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1")
      window.location.reload()
    }
  }

  componentDidMount() {
    // Got here without incident, so whatever went wrong last time is over.
    sessionStorage.removeItem(RELOAD_FLAG)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="relative z-2 grid min-h-dvh place-items-center px-6">
        <div className="max-w-[46ch] text-center">
          <p className="label text-gold">
            {this.state.chunk ? "This page moved" : "Something broke"}
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight uppercase">
            {this.state.chunk ? "Reload to pick up the new version" : "Could not load this page"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {this.state.chunk
              ? "The site was updated while this tab was open, so part of it is no longer where this page expects it."
              : "The details are in the browser console. Reloading is the first thing worth trying."}
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(RELOAD_FLAG)
              window.location.reload()
            }}
            className="label mt-8 border border-gold/45 px-5 py-3 text-gold transition-colors duration-300 hover:bg-gold/10"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
