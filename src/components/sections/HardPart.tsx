import { useRef, useState } from "react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"
import { ChapterHeading } from "@/components/ChapterHeading"
import { MigrationDiagram } from "@/components/graphics/MigrationDiagram"
import { Reveal } from "@/components/Reveal"
import { hardPart } from "@/data/story"
import { cn } from "@/lib/utils"

const TOTAL_ROWS = 350_000
const CELLS = 200

/**
 * The emotional peak of the story, and the only place the page takes over the
 * viewport. You do not watch the migration play — you drive it. The counter and
 * the grid are bound to scroll position, so the 350,000 rows arrive at exactly
 * the speed you move.
 */
export function HardPart() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })

  // en-US grouping, matching how the figure is written on the CV itself.
  const rows = useTransform(scrollYProgress, (v) =>
    Math.round(v * TOTAL_ROWS).toLocaleString("en-US"),
  )
  const pct = useTransform(scrollYProgress, (v) => `${Math.round(v * 100)}%`)
  const fill = useTransform(scrollYProgress, (v) => `inset(0 0 ${(1 - v) * 100}% 0)`)

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(hardPart.steps.length - 1, Math.floor(v * hardPart.steps.length))
    setStep(next)
  })

  return (
    <section id="hard" className="border-t border-hair py-24 md:pt-36">
      <ChapterHeading n="04" title="The Hard Part" kicker={hardPart.intro} />

      <Reveal>
        <h3 className="mb-16 max-w-[20ch] font-display text-[clamp(1.7rem,5vw,3.2rem)] leading-[1.1] font-light md:mb-24">
          {hardPart.title}
        </h3>
      </Reveal>

      {/* the scrub */}
      <div ref={ref} className={cn("relative", reduced ? "" : "h-[300vh] md:h-[420vh]")}>
        <div
          className={cn(
            "flex flex-col justify-center gap-10 md:grid md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-16",
            reduced ? "" : "sticky top-20 py-8 md:top-0 md:min-h-svh md:py-16",
          )}
        >
          {/* counter */}
          <div>
            <span className="label text-faint">Rows migrated · WordPress → Supabase</span>
            <div className="mt-3 flex items-baseline gap-3 font-display text-[clamp(2.8rem,9vw,6rem)] leading-none font-semibold tracking-tight text-gold tabular-nums">
              {reduced ? <span>3,50,000</span> : <motion.span>{rows}</motion.span>}
            </div>
            <div className="mt-5 flex items-center gap-4">
              <span className="relative h-px flex-1 bg-hair">
                <motion.span
                  className="absolute inset-y-0 left-0 block w-full origin-left bg-gold"
                  style={{ scaleX: reduced ? 1 : scrollYProgress }}
                />
              </span>
              <span className="label w-10 text-right text-faint tabular-nums">
                {reduced ? "100%" : <motion.span>{pct}</motion.span>}
              </span>
            </div>

            {/* row grid */}
            <div className="relative mt-10">
              <Cells className="bg-foreground/8" />
              <motion.div
                className="absolute inset-0"
                style={{ clipPath: reduced ? "inset(0)" : fill }}
              >
                <Cells className="bg-gold shadow-[0_0_6px_rgba(232,183,92,0.45)]" />
              </motion.div>
            </div>

            {/*
              Phones cannot pin all four steps — the block would be taller than
              the viewport and the last one would never be reachable. So the
              small screen shows only the step you are currently on, and swaps
              it as the scrub advances.
            */}
            {!reduced && (
              <div className="mt-8 border-t border-hair pt-5 md:hidden">
                <div className="mb-2 flex items-baseline gap-3">
                  <span className="label text-gold">{hardPart.steps[step].k}</span>
                  <span className="label text-faint tabular-nums">
                    {String(step + 1).padStart(2, "0")} / {String(hardPart.steps.length).padStart(2, "0")}
                  </span>
                </div>
                <h4 className="font-sans text-base font-semibold">{hardPart.steps[step].t}</h4>
                <p className="mt-1.5 text-sm text-muted-foreground">{hardPart.steps[step].d}</p>
              </div>
            )}
          </div>

          {/* steps — full list from md up, and always under reduced motion */}
          <ol className={cn("gap-0", reduced ? "grid" : "hidden md:grid")}>
            {hardPart.steps.map((s, i) => {
              const active = !reduced && i === step
              const done = !reduced && i < step
              return (
                <li
                  key={s.k}
                  className={cn(
                    "grid grid-cols-[auto_1fr] gap-x-5 border-t border-hair py-5 transition-all duration-500 last:border-b",
                    reduced || active ? "opacity-100" : done ? "opacity-55" : "opacity-30",
                  )}
                >
                  <span
                    className={cn(
                      "label pt-1 transition-colors duration-500",
                      active || reduced ? "text-gold" : "text-faint",
                    )}
                  >
                    {s.k}
                  </span>
                  <div>
                    <h4 className="font-sans text-base font-semibold md:text-lg">{s.t}</h4>
                    <p className="mt-1.5 max-w-[46ch] text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <Reveal className="mt-20 md:mt-28">
        <span className="label mb-6 block text-faint">What actually moved</span>
        <MigrationDiagram />
      </Reveal>

      <Reveal className="mt-16 md:mt-20">
        <p className="max-w-[58ch] border-l-2 border-gold/50 pl-6 font-display text-lg leading-relaxed font-light md:text-xl">
          {hardPart.outcome}
        </p>
      </Reveal>
    </section>
  )
}

/** 200 cells, one per ~1,750 rows. */
function Cells({ className }: { className: string }) {
  return (
    <div className="grid grid-cols-20 gap-1">
      {Array.from({ length: CELLS }, (_, i) => (
        <span key={i} aria-hidden className={cn("block h-1.5 rounded-[1px]", className)} />
      ))}
    </div>
  )
}
