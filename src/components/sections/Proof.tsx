import { useRef, type PointerEvent } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { ChapterHeading } from "@/components/ChapterHeading"
import { MoreProjects } from "@/components/MoreProjects"
import { ProjectGallery } from "@/components/ProjectGallery"
import { SignalPanel } from "@/components/graphics/SignalPanel"
import { Badge } from "@/components/ui/badge"
import { projects } from "@/data/story"

/** Height of a card's tab strip. Cards pin at exactly this interval so every
 *  strip stays readable once the next card rides over it. */
const STRIP = 3.5

/**
 * The projects stack like files on a desk: each card pins, the next rides over
 * it, and what stays visible is a labelled tab. The work accumulates in front
 * of the reader instead of scrolling away.
 */
export function Proof() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })

  return (
    <section id="proof" className="border-t border-hair py-24 md:py-36">
      <ChapterHeading
        n="03"
        title="Proof"
        kicker="Things that left my machine and went somewhere real. Three in depth, the rest below."
      />

      <div ref={ref} className="relative">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={i}
            total={projects.length}
            progress={scrollYProgress}
          />
        ))}
      </div>

      <MoreProjects />
    </section>
  )
}

function ProjectCard({
  project,
  index,
  total,
  progress,
}: {
  project: (typeof projects)[number]
  index: number
  total: number
  progress: ReturnType<typeof useScroll>["scrollYProgress"]
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const start = index / total
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - index - 1) * 0.02])

  const trackPointer = (e: PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`)
    el.style.setProperty("--my", `${e.clientY - rect.top}px`)
  }

  // Stacking is desktop-only. On a phone the cards are far taller than the
  // viewport, so pinning them would bury each gallery under the next card.
  return (
    <div className="mb-5 md:sticky" style={{ top: `calc(5rem + ${index * STRIP}rem)` }}>
      <motion.article
        ref={cardRef}
        onPointerMove={trackPointer}
        style={{ scale, transformOrigin: "top center" }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="group relative isolate overflow-hidden border border-hair bg-linear-to-b from-secondary to-card transition-colors duration-500 hover:border-border"
      >
        {/* pointer-tracked glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(232,183,92,0.11), transparent 62%)",
          }}
        />

        {/* tab strip — the part that stays visible once the next card stacks */}
        <div
          className="flex items-center gap-3 border-b border-hair bg-background/40 px-5 md:px-8"
          style={{ height: `${STRIP}rem` }}
        >
          <span className="label text-gold">{project.index}</span>
          <h3 className="truncate text-lg font-semibold tracking-tight uppercase md:text-xl">
            {project.name}
          </h3>
          <span aria-hidden className="h-px flex-1 bg-hair" />
          <span className="label hidden text-faint sm:block">{project.kind}</span>
          <span className="label text-muted-foreground">{project.status}</span>
        </div>

        {/* min-w-0 on both columns: grid items default to min-width:auto, and the
            carousel track's min-content would otherwise push the column wider
            than the card and clip the text on narrow screens. */}
        <div className="grid gap-8 p-5 md:grid-cols-[1.42fr_0.58fr] md:gap-12 md:p-8">
          <div className="min-w-0">
            <p className="max-w-[52ch] font-display text-base leading-relaxed font-light md:text-xl">
              {project.line}
            </p>

            <ul className="mt-7 grid max-w-[60ch] gap-2.5">
              {project.points.map((p) => (
                <li key={p} className="relative pl-5 text-sm text-muted-foreground md:text-base">
                  <span
                    aria-hidden
                    className="absolute top-[0.72em] left-0 block h-px w-1.75 bg-gold-deep"
                  />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-w-0 flex-col gap-5 self-start">
            {project.shots.length > 0 ? (
              <ProjectGallery shots={project.shots} name={project.name} />
            ) : (
              <SignalPanel />
            )}

            <div className="flex flex-col gap-4 border border-hair bg-background/50 p-5">
              <span className="label border-b border-hair pb-3 text-faint">Stack</span>
              <div className="flex flex-wrap gap-1.5">
                {project.stack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="outline"
                    className="label rounded-none border-hair bg-foreground/2 px-2.5 py-1 text-[0.62rem] font-normal tracking-widest text-muted-foreground transition-colors duration-400 group-hover:border-border group-hover:text-foreground"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>

              {project.href ? (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label mt-auto flex items-center justify-between gap-3 border-t border-hair pt-4 text-gold no-underline"
                >
                  {project.label}
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    aria-hidden
                    className="transition-transform duration-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path d="M3 10L10 3M10 3H4.5M10 3V8.5" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </a>
              ) : (
                <span className="label mt-auto border-t border-hair pt-4 text-faint">
                  {project.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  )
}
