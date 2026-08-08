import { useEffect, useState } from "react"
import { motion, useScroll, useSpring } from "motion/react"
import { chapters } from "@/data/story"
import { cn } from "@/lib/utils"

/**
 * The book spine. Fixed to the left edge on wide screens, it does two jobs at
 * once: shows how far through the story you are, and names the chapter you are
 * standing in. Chapter position is real information, so it gets real numbering.
 */
export function ChapterRail() {
  const [active, setActive] = useState<string | null>(null)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    const sections = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-52 flex-col justify-between py-9 pl-9 xl:flex">
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-hair to-transparent"
      />

      <span className="label [writing-mode:vertical-rl] text-faint tracking-[0.34em]">
        MPS · BLR
      </span>

      {/* scroll progress */}
      <div className="relative my-6 ml-2 w-px flex-1 bg-hair">
        <motion.span
          aria-hidden
          className="absolute top-0 -left-px block w-0.75 origin-top bg-linear-to-b from-gold-hot to-gold-deep shadow-[0_0_14px_rgba(232,183,92,0.55)]"
          style={{ height: "100%", scaleY: progress }}
        />
      </div>

      <nav className="ml-5 flex flex-col">
        {chapters.map((c) => {
          const on = active === c.id
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-current={on ? "true" : undefined}
              className={cn(
                "label relative flex items-baseline gap-1.5 py-1.5 pl-4 text-[0.6rem] tracking-[0.12em] whitespace-nowrap no-underline transition-colors duration-400",
                on ? "text-gold" : "text-faint hover:text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-1/2 left-0 block h-px w-1.5 origin-left -translate-y-1/2 bg-current transition-transform duration-400",
                  on ? "scale-x-[2.4]" : "scale-x-[0.4]",
                )}
              />
              <span className="tabular-nums opacity-60">{c.n}</span>
              <span>{c.title}</span>
            </a>
          )
        })}
      </nav>
    </aside>
  )
}
