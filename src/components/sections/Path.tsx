import { useRef } from "react"
import { motion, useInView, useScroll } from "motion/react"
import { ChapterHeading } from "@/components/ChapterHeading"
import { Badge } from "@/components/ui/badge"
import { timeline } from "@/data/story"
import { cn } from "@/lib/utils"

/**
 * The spine of the CV, told in order. The gold line is drawn by the scroll
 * itself and each marker ignites as its entry arrives — so the reader watches
 * the timeline being written rather than finding it already finished.
 */
export function Path() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.62", "end 0.72"],
  })

  return (
    <section id="path" className="border-t border-hair py-24 md:py-36">
      <ChapterHeading
        n="02"
        title="The Path"
        kicker="Two internships, one detour, and the job I have now. In that order, because the order is the point."
      />

      <div ref={ref} className="relative pl-9">
        <span aria-hidden className="absolute inset-y-2 left-0 w-px bg-hair" />
        <motion.span
          aria-hidden
          className="absolute inset-y-2 left-0 w-px origin-top bg-linear-to-b from-gold to-gold/5"
          style={{ scaleY: scrollYProgress }}
        />

        <ol className="space-y-14 md:space-y-20">
          {timeline.map((entry) => (
            <Entry key={entry.org} entry={entry} />
          ))}
        </ol>
      </div>
    </section>
  )
}

function Entry({ entry }: { entry: (typeof timeline)[number] }) {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" })
  const minor = entry.kind === "Internship" || entry.kind === "Detour"

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-2.5 -left-9 size-1.75 -translate-x-[3px] rounded-full border transition-all duration-500",
          inView
            ? "border-gold bg-gold shadow-[0_0_12px_rgba(232,183,92,0.6)]"
            : "border-border bg-background",
        )}
      />

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="label text-faint">{entry.when}</span>
        <Badge
          variant="outline"
          className="label rounded-none border-border px-2 py-0 text-[0.6rem] text-muted-foreground"
        >
          {entry.kind}
        </Badge>
      </div>

      <h3
        className={cn(
          "tracking-tight",
          minor
            ? "font-sans text-lg font-semibold text-muted-foreground"
            : "text-2xl font-semibold uppercase md:text-3xl",
        )}
      >
        {entry.role}
      </h3>
      <span className="label mt-1.5 block text-gold">{entry.org}</span>

      <p className="mt-4 max-w-[50ch] font-display text-base leading-relaxed font-light text-foreground/85 md:text-lg">
        {entry.beat}
      </p>

      <ul className="mt-4 grid max-w-[64ch] gap-2.5">
        {entry.points.map((p) => (
          <li key={p} className="relative pl-5 text-sm text-muted-foreground md:text-base">
            <span
              aria-hidden
              className="absolute top-[0.72em] left-0 block h-px w-1.75 bg-gold-deep"
            />
            {p}
          </li>
        ))}
      </ul>
    </motion.li>
  )
}
