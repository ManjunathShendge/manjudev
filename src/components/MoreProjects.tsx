import { useState, type PointerEvent } from "react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { moreProjects } from "@/data/story"
import { cn } from "@/lib/utils"

const ease = [0.16, 1, 0.3, 1] as const

/**
 * The shorter builds. Same card vocabulary as the featured three — hairline
 * border, pointer-tracked gold glow, mono spec row — at a third of the size,
 * because a one-line project does not earn a full pinned card.
 */
export function MoreProjects() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="mt-20 md:mt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-8 flex items-baseline gap-4"
      >
        <h3 className="label text-gold">Also built</h3>
        <span aria-hidden className="h-px flex-1 bg-hair" />
        <span className="label text-faint tabular-nums">{moreProjects.length} projects</span>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {moreProjects.map((project, i) => (
          <motion.article
            key={project.id}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease }}
            onPointerMove={(e: PointerEvent<HTMLElement>) => {
              const el = e.currentTarget
              const r = el.getBoundingClientRect()
              el.style.setProperty("--mx", `${e.clientX - r.left}px`)
              el.style.setProperty("--my", `${e.clientY - r.top}px`)
            }}
            className="group relative isolate flex min-w-0 flex-col overflow-hidden border border-hair bg-linear-to-b from-secondary to-card transition-colors duration-500 hover:border-border"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(340px circle at var(--mx,50%) var(--my,50%), rgba(232,183,92,0.10), transparent 62%)",
              }}
            />

            {/* thumbnail, or a reserved slot when there is no screenshot yet */}
            {project.shot ? (
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Open larger view of ${project.name}`}
                className="relative block aspect-16/10 w-full cursor-zoom-in overflow-hidden border-b border-hair bg-background/60"
              >
                <img
                  src={project.shot}
                  alt={`${project.name} screenshot`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full scale-105 object-cover object-top transition-transform duration-700 group-hover:scale-110"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent transition-opacity duration-500 group-hover:opacity-40"
                />
              </button>
            ) : (
              <div className="relative flex aspect-16/10 w-full items-center justify-center overflow-hidden border-b border-hair bg-background/60">
                <div aria-hidden className="grid grid-cols-8 gap-1 opacity-30">
                  {Array.from({ length: 32 }, (_, c) => (
                    <span
                      key={c}
                      className={cn(
                        "block h-1.5 w-4 rounded-[1px]",
                        c % 5 === 0 ? "bg-gold/60" : "bg-foreground/12",
                      )}
                    />
                  ))}
                </div>
                <span className="label absolute bottom-3 left-4 text-faint">
                  Screenshot pending
                </span>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3 p-5">
              <h4 className="text-base font-semibold tracking-tight uppercase md:text-lg">
                {project.name}
              </h4>
              <p className="text-sm text-muted-foreground">{project.blurb}</p>

              <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {project.stack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="outline"
                    className="label rounded-none border-hair bg-foreground/2 px-2 py-0.5 text-[0.58rem] font-normal tracking-widest text-muted-foreground transition-colors duration-400 group-hover:border-border group-hover:text-foreground"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-hair pt-3">
                {project.href ? (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label truncate text-gold no-underline"
                  >
                    {project.label}
                  </a>
                ) : (
                  <span className="label truncate text-faint">{project.label}</span>
                )}

                {project.repo && (
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${project.name} repository on GitHub`}
                    className="shrink-0 text-muted-foreground transition-colors duration-300 hover:text-gold"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="rounded-none border-border bg-card p-2 sm:max-w-[min(1400px,94vw)] sm:p-3">
          <DialogTitle className="label truncate px-1 pt-1 pb-2 text-faint">
            {open !== null ? moreProjects[open].name : ""}
          </DialogTitle>
          {open !== null && moreProjects[open].shot && (
            <img
              src={moreProjects[open].shot as string}
              alt={`${moreProjects[open].name} screenshot`}
              className="mx-auto h-auto max-h-[78vh] w-auto border border-hair object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
