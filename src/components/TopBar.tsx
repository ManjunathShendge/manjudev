import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, useMotionValueEvent, useScroll } from "motion/react"
import { profile } from "@/data/story"

/** Slides in once the hero is behind you — the only nav small screens get. */
export function TopBar() {
  const [shown, setShown] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (y) => {
    setShown(y > window.innerHeight * 0.86)
  })

  return (
    <motion.header
      initial={false}
      animate={{ y: shown ? 0 : "-101%" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-45 flex items-center justify-between gap-4 border-b border-hair bg-background/72 px-5 py-3 backdrop-blur-md md:px-9"
    >
      {/* The mark plus the full name plus two links does not fit a 390px bar.
          On a phone the mark alone is the wordmark — that is what a mark is
          for — and the name returns from `sm` up.

          /logo.png rather than /logo.svg: the SVG is the same raster wrapped
          in a vector element, 136KB against 6KB, for a 26px disc. */}
      <a
        href="#top"
        className="flex items-center gap-2.5 font-display text-sm font-semibold tracking-tight whitespace-nowrap no-underline"
      >
        <img
          src="/logo.png"
          alt=""
          width={26}
          height={26}
          className="size-6.5 shrink-0 rounded-full"
        />
        <span className="hidden sm:inline">{profile.name}</span>
      </a>
      <span className="label hidden text-faint md:block">{profile.role}</span>

      <nav className="ml-auto flex items-center gap-4 sm:gap-5">
        <Link
          to="/blog"
          className="label whitespace-nowrap text-faint no-underline transition-colors duration-300 hover:text-foreground"
        >
          Writing
        </Link>
        <a
          href={`mailto:${profile.email}`}
          className="label border-b border-gold/35 pb-px whitespace-nowrap text-gold no-underline"
        >
          Get in touch
        </a>
      </nav>
    </motion.header>
  )
}
