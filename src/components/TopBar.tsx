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
      <a href="#top" className="font-display text-sm font-semibold tracking-tight no-underline">
        {profile.name}
      </a>
      <span className="label hidden text-faint md:block">{profile.role}</span>

      <nav className="ml-auto flex items-center gap-5">
        <Link
          to="/blog"
          className="label text-faint no-underline transition-colors duration-300 hover:text-foreground"
        >
          Writing
        </Link>
        <a
          href={`mailto:${profile.email}`}
          className="label border-b border-gold/35 pb-px text-gold no-underline"
        >
          Get in touch
        </a>
      </nav>
    </motion.header>
  )
}
