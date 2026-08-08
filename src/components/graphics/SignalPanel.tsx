import { motion } from "motion/react"

const COLS = 14
const ROWS = 8
const CELLS = COLS * ROWS

/**
 * Stand-in graphic for the attendance system, which is internal and has no
 * public deployment to screenshot. Deliberately abstract — a register filling
 * in, cell by cell — rather than a mocked-up interface, because inventing a
 * screenshot of a real system would be a lie about the work.
 */
export function SignalPanel() {
  // Deterministic pseudo-pattern: no Math.random, so it renders the same twice.
  const marked = (i: number) => (i * 7 + Math.floor(i / COLS) * 3) % 11 < 4

  return (
    <div className="relative flex aspect-16/10 w-full flex-col justify-center overflow-hidden border border-hair bg-background/60 p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(232,183,92,0.07),transparent_60%)]"
      />

      <div
        aria-hidden
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: CELLS }, (_, i) => {
          const on = marked(i)
          return (
            <motion.span
              key={i}
              className={`block h-1.5 rounded-[1px] ${on ? "bg-gold" : "bg-foreground/8"}`}
              initial={{ opacity: 0, scaleY: 0.2 }}
              whileInView={{ opacity: on ? 1 : 0.7, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: (i % COLS) * 0.012 + Math.floor(i / COLS) * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          )
        })}
      </div>

      <p className="label mt-5 truncate text-faint">Attendance marks · abstract graphic</p>
    </div>
  )
}
