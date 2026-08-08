import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary, [data-cursor]'

/**
 * The arrow follow-up: the native cursor stays exactly where it is — hiding it
 * costs more in usability than it buys in polish — and a gold ring chases it
 * with spring physics, lagging on fast moves and settling when you stop.
 *
 * Over anything clickable the ring swells and fills, so the pointer itself
 * reports what is interactive. Mouse only: pointer-fine devices get it, touch
 * screens and reduced-motion do not.
 */
export function CursorFollower() {
  const [enabled, setEnabled] = useState(false)
  const [hot, setHot] = useState(false)
  const [down, setDown] = useState(false)
  const [visible, setVisible] = useState(false)

  // Raw pointer position, and the ring that lags behind it.
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.55 })
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.55 })
  const dotX = useSpring(x, { stiffness: 1100, damping: 45, mass: 0.25 })
  const dotY = useSpring(y, { stiffness: 1100, damping: 45, mass: 0.25 })

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setEnabled(fine && !reduced)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const target = e.target as Element | null
      setHot(Boolean(target?.closest?.(INTERACTIVE)))
    }
    const onLeave = () => setVisible(false)
    const onDown = () => setDown(true)
    const onUp = () => setDown(false)

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    document.addEventListener("pointerleave", onLeave)

    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      document.removeEventListener("pointerleave", onLeave)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-100 overflow-hidden">
      {/* trailing ring */}
      <motion.span
        style={{ x: ringX, y: ringY }}
        animate={{
          width: hot ? 46 : 28,
          height: hot ? 46 : 28,
          opacity: visible ? (hot ? 1 : 0.55) : 0,
          scale: down ? 0.82 : 1,
          borderColor: hot ? "rgba(232,183,92,0.9)" : "rgba(184,174,224,0.45)",
          backgroundColor: hot ? "rgba(232,183,92,0.10)" : "rgba(232,183,92,0)",
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border"
      />

      {/* the dot that rides the tip of the arrow */}
      <motion.span
        style={{ x: dotX, y: dotY }}
        animate={{
          opacity: visible && !hot ? 1 : 0,
          scale: down ? 1.6 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="absolute top-0 left-0 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_10px_rgba(232,183,92,0.9)]"
      />
    </div>
  )
}
