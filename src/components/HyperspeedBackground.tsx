import { useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import Hyperspeed from "./Hyperspeed"

/**
 * The effect's stock preset is magenta/cyan neon, which fights the gold-on-ink
 * identity everywhere else on the page. Same geometry and motion, repainted in
 * the site palette: gold headlights going away, periwinkle coming toward you,
 * ink road, and the page background colour as fog so the far end dissolves into
 * the page instead of into black.
 *
 * Defined at module scope, not inline — the component recreates the whole WebGL
 * scene whenever this object identity changes.
 */
const OPTIONS = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: "turbulentDistortion",
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.03, 400 * 0.2],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x0c0a14,
    islandColor: 0x0e0c18,
    background: 0x08070c,
    shoulderLines: 0x1a1628,
    brokenLines: 0x1a1628,
    leftCars: [0xe8b75c, 0xb98a33, 0xffd489],
    rightCars: [0x7c7bff, 0x4a48c7, 0x2e2d7a],
    sticks: 0xe8b75c,
  },
}

/**
 * Fixed behind the whole page. `pointer-events-none` is deliberate: the effect
 * binds mousedown/touchstart on its own container to accelerate, and a
 * full-viewport interactive layer under a 14,000px document would swallow
 * stray clicks. The trade is that click-to-speed-up is off here.
 */
export function HyperspeedBackground() {
  const [enabled, setEnabled] = useState(false)

  // Full strength in the hero, where it is the statement; faded to a suggestion
  // behind the chapters, where light trails would otherwise run straight
  // through body copy. Same reason the page dims its own ambient layers.
  const { scrollY } = useScroll()
  const opacity = useTransform(
    scrollY,
    [0, typeof window === "undefined" ? 900 : window.innerHeight * 1.1],
    [0.62, 0.2],
  )

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // A second WebGL context on a phone is a battery and memory cost with very
    // little of the effect actually visible at that width.
    const small = window.matchMedia("(max-width: 767px)").matches
    setEnabled(!reduced && !small)
  }, [])

  if (!enabled) return null

  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className="pointer-events-none fixed inset-0 z-0 mix-blend-screen"
    >
      <Hyperspeed effectOptions={OPTIONS} />
    </motion.div>
  )
}
