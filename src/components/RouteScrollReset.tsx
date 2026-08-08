import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { getLenis } from "@/components/SmoothScroll"

/**
 * Browsers keep the scroll offset across a client-side navigation, which lands
 * you halfway down a post you have not read yet. Reset on every path change —
 * but not on a hash change, where the anchor handler is the one doing the work.
 *
 * Lenis has to be told directly: it runs its own animation loop and would
 * otherwise ease straight back to where it thought it was. ScrollTrigger then
 * needs a refresh because the new route's element positions are all different.
 */
export function RouteScrollReset() {
  const { pathname } = useLocation()

  useEffect(() => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)

    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => window.cancelAnimationFrame(id)
  }, [pathname])

  return null
}
