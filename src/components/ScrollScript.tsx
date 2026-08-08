import { useRef } from "react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"

/**
 * The signature device of the page: a paragraph that is *read to you* by the
 * scroll. Each word lifts out of the ink as the scrub passes over it, so the
 * pace of the story is set by the reader's hand rather than by a timer.
 */
export function ScrollScript({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.35"],
  })

  const words = text.split(" ")

  if (reduced) {
    return (
      <p className="max-w-225 font-display text-2xl leading-[1.35] font-light sm:text-3xl md:text-[2.6rem]">
        {text}
      </p>
    )
  }

  return (
    <div ref={ref} className="relative">
      <p className="flex max-w-225 flex-wrap font-display text-2xl leading-[1.35] font-light sm:text-3xl md:text-[2.6rem]">
        {words.map((word, i) => {
          const start = i / words.length
          const end = start + 1 / words.length
          return (
            <Word key={`${word}-${i}`} range={[start, end]} progress={scrollYProgress}>
              {word}
            </Word>
          )
        })}
      </p>
    </div>
  )
}

function Word({
  children,
  range,
  progress,
}: {
  children: string
  range: [number, number]
  progress: MotionValue<number>
}) {
  const opacity = useTransform(progress, range, [0.14, 1])
  const color = useTransform(progress, range, ["#6c667e", "#ece8f5"])

  return (
    <span className="mr-[0.28em] inline-block">
      <motion.span style={{ opacity, color }}>{children}</motion.span>
    </span>
  )
}
