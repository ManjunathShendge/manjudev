import { useEffect } from "react"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

let instance: Lenis | null = null

/**
 * The live Lenis instance, or null under reduced-motion where it never starts.
 * Route changes need it: with momentum scrolling running, `window.scrollTo` is
 * fighting an animation loop that still believes it is somewhere else.
 */
export function getLenis(): Lenis | null {
  return instance
}

/**
 * Momentum scrolling. The whole page is a scrubbed narrative, so the feel of
 * the scroll itself is part of the design — native wheel steps are too abrupt
 * for scroll-linked animation. Disabled entirely under reduced-motion.
 *
 * Lenis also drives GSAP here. The stack grid uses ScrollTrigger while the rest
 * of the page uses Motion; Motion reads scroll events directly and is fine, but
 * ScrollTrigger caches positions and must be told when Lenis moves, and Lenis
 * must be stepped from GSAP's ticker so the two never run on separate clocks.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      duration: 1.15,
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    })
    instance = lenis

    const onLenisScroll = () => ScrollTrigger.update()
    lenis.on("scroll", onLenisScroll)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // Rail links use hash targets; hand those to Lenis so they ease.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute("href")
      if (!id || id === "#") return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: -40, duration: 1.4 })
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      lenis.off("scroll", onLenisScroll)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      if (instance === lenis) instance = null
    }
  }, [])

  return null
}
