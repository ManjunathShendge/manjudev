import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { Button } from "@/components/ui/button"
import { profile } from "@/data/story"

const ease = [0.16, 1, 0.3, 1] as const

/** The two name lines mask up from below, then the page hands you to chapter 01. */
export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -90])
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95])

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-svh flex-col justify-center pt-28 pb-20"
    >
      <motion.div style={{ y, opacity, scale }} className="origin-bottom-left">
        {/* status line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="label mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-faint"
        >
          <span className="flex items-center gap-2 text-mint">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-mint" />
            </span>
            {profile.status}
          </span>
          <span aria-hidden className="hidden h-px w-3.5 bg-border sm:block" />
          <span>{profile.location}</span>
          <span aria-hidden className="hidden h-px w-3.5 bg-border sm:block" />
          <span>Est. 2022</span>
        </motion.div>

        {/*
          Unbounded is a very wide face — the cap is tuned so the longer line
          fits the 1180px shell without clipping. The second line fades into the
          ink rather than being outlined: -webkit-text-stroke exposes this
          font's overlapping contours as visible seams inside the letters.
        */}
        <h1 className="mb-8 text-[clamp(2.4rem,8.4vw,7.5rem)] leading-[0.9] font-semibold tracking-[-0.03em] uppercase">
          <span className="block overflow-hidden pb-[0.04em]">
            <motion.span
              className="block"
              initial={{ y: "102%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.15, ease, delay: 0.12 }}
            >
              {profile.first}
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.04em]">
            <motion.span
              className="block bg-linear-to-b from-foreground/70 to-foreground/12 bg-clip-text text-transparent"
              initial={{ y: "102%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.15, ease, delay: 0.24 }}
            >
              {profile.last}
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.5 }}
          className="max-w-[53ch] text-lg text-muted-foreground md:text-xl"
        >
          Full-stack engineer shipping{" "}
          <span className="font-medium text-foreground">production web platforms</span> —
          React and Next.js on the surface, APIs, schemas and data pipelines underneath.
          This page is the long version.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.66 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <Button asChild size="lg" className="label rounded-none">
            <a href="#origin">Start the story</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="label rounded-none border-border bg-transparent"
          >
            <a href="#next">Skip to contact</a>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="label absolute bottom-9 left-0 flex items-center gap-3 text-faint"
      >
        <span className="relative block h-px w-13 overflow-hidden bg-border">
          <motion.span
            className="absolute inset-y-0 left-0 block w-2/5 bg-gold"
            animate={{ x: ["-110%", "260%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: [0.22, 0.68, 0.24, 1] }}
          />
        </span>
        Scroll
      </motion.div>
    </section>
  )
}
