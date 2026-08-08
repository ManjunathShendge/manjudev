import type { ReactNode } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

type RevealProps = {
  children: ReactNode
  /** Seconds of stagger before this element starts. */
  delay?: number
  /** Travel distance in px. Negative values come from above. */
  y?: number
  className?: string
  as?: "div" | "section" | "li" | "article" | "span"
}

/**
 * The baseline scroll reveal used everywhere that does not need scrubbing.
 * Fires once, so scrolling back up does not replay the story.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as]

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  )
}

/** A hairline that draws itself left-to-right when its section arrives. */
export function DrawLine({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        "block h-px flex-1 origin-left bg-linear-to-r from-gold/40 to-transparent",
        className,
      )}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    />
  )
}
