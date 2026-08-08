import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Typed one character at a time. Keep these short — the whole thing is ~1.6s. */
const LINES = [
  "$ whoami",
  "manjunath shendge — software engineer",
  "$ load ./story --chapters 8",
]

const CHAR_MS = 16
const LINE_PAUSE = 90
const HOLD_MS = 300
/** Must match the fade duration in the class list below. */
const FADE_MS = 500

/** Total time the typing needs, derived once so the clock and the text agree. */
const TYPE_MS =
  LINES.reduce((n, l) => n + l.length, 0) * CHAR_MS + (LINES.length - 1) * LINE_PAUSE

/**
 * Initial-load curtain. A terminal is the honest metaphor for this page — the
 * whole site is about what happens underneath the interface — and it costs a
 * few characters of state rather than an animation library.
 *
 * It is skippable on any click or key, self-dismisses on `window.load`, and is
 * hard-capped so it can never hold content back for longer than it takes to
 * read. Under reduced-motion it never mounts at all.
 *
 * This is a Vite SPA with no router, so there are no route transitions to cover
 * — first paint only.
 */
export function Loader() {
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return false
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })
  const [typed, setTyped] = useState<string[]>([])
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(false)

  /*
    Driven by elapsed time, not a per-character timer. A chained setTimeout is
    starved whenever the main thread is busy — on first paint it competes with
    WebGL init and font decoding — which strands the text mid-word while the
    dismissal clock keeps running. Deriving the character count from the clock
    each frame means a slow device shows fewer frames, not less text.
  */
  useEffect(() => {
    if (!active) return
    const start = performance.now()
    let frame = 0

    const tick = () => {
      const elapsed = performance.now() - start
      let budget = Math.floor(elapsed / CHAR_MS)
      const next: string[] = []

      for (const line of LINES) {
        const take = Math.max(0, Math.min(line.length, budget))
        next.push(line.slice(0, take))
        budget -= line.length + LINE_PAUSE / CHAR_MS
        if (budget <= 0) break
      }

      setTyped(next)
      if (elapsed < TYPE_MS) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])

  // dismissal: whichever comes first — page load, the hard cap, or the user
  useEffect(() => {
    if (!active) return
    /*
      Two steps, and the unmount is on a timer rather than on an animation
      callback. An exit animation that never reports finishing leaves a curtain
      pinned over the whole page at four percent opacity — which is exactly
      what happened here, because the fade starts while Three.js is still
      compiling shaders and the frame loop is not reliably running. A timeout
      fires regardless of how busy the main thread is.
    */
    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      setLeaving(true)
      window.setTimeout(() => setActive(false), FADE_MS)
    }

    // One fixed ceiling rather than racing `window.load`: cutting the curtain
    // at first paint truncates the typing mid-word, which reads as a glitch
    // rather than as speed. ~1.7s total, and any input skips it immediately.
    const cap = window.setTimeout(finish, TYPE_MS + HOLD_MS)

    window.addEventListener("pointerdown", finish)
    window.addEventListener("keydown", finish)

    return () => {
      window.clearTimeout(cap)
      window.removeEventListener("pointerdown", finish)
      window.removeEventListener("keydown", finish)
    }
  }, [active])

  // Hold the scroll position while the curtain is up.
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])

  if (!active) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-200 flex flex-col justify-center bg-background px-6 transition-[opacity,filter] duration-500 ease-out md:px-16",
        leaving && "pointer-events-none opacity-0 blur-[6px]",
      )}
      role="status"
      aria-label="Loading"
    >
      {/* scan lines */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,#ece8f5_0px,#ece8f5_1px,transparent_1px,transparent_3px)] opacity-[0.07]"
      />

      <div className="relative mx-auto w-full max-w-160">
        {/* The mark sits above the prompt like a boot splash, aligned to the
            same left edge as the text. Decorative — the aria-label on the
            curtain already says "Loading" — so it carries an empty alt. */}
        <img
          src="/logo.png"
          alt=""
          width={44}
          height={44}
          className="mb-7 size-11 rounded-full ring-1 ring-gold/25"
        />

        <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground sm:text-sm">
          {LINES.map((_, i) => (
            <div key={i} className={i === 1 ? "text-gold" : undefined}>
              {typed[i] ?? ""}
              {typed[i] !== undefined && typed[i].length < LINES[i].length && (
                <span className="ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-gold" />
              )}
            </div>
          ))}
        </pre>

        {/* Progress hairline. Driven by the same clock as the typing, in CSS
            rather than in JS, so a stalled frame loop cannot strand it either. */}
        <div className="mt-6 h-px w-full bg-hair">
          <span
            aria-hidden
            className="block h-px origin-left bg-linear-to-r from-gold-hot to-gold-deep"
            style={{ animation: `loader-progress ${TYPE_MS + HOLD_MS}ms linear forwards` }}
          />
        </div>

        <p className="label mt-3 text-faint">Press any key to skip</p>
      </div>
    </div>
  )
}
