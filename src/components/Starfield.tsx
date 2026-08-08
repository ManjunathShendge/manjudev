import { useEffect, useRef } from "react"

type Dot = {
  x: number
  y: number
  z: number
  v: number
  gold: boolean
  ph: number
}

/**
 * Ambient depth behind the story — a drifting particle field over a slow violet
 * horizon, parallaxed by scroll. Pauses when the tab is hidden; not rendered
 * at all under reduced-motion.
 */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let dots: Dot[] = []
    let w = 0
    let h = 0
    let scrollY = 0
    let frame: number | null = null

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round(Math.min(150, (w * h) / 12000))
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.25 + Math.random() * 0.9,
        v: 0.03 + Math.random() * 0.12,
        gold: Math.random() < 0.14,
        ph: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)

      const gy = -h * 0.12 - scrollY * 0.045
      const glow = ctx.createRadialGradient(w * 0.5, gy, 0, w * 0.5, gy, h * 0.95)
      glow.addColorStop(0, "rgba(124,123,255,0.10)")
      glow.addColorStop(0.45, "rgba(232,183,92,0.035)")
      glow.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      for (const d of dots) {
        d.y -= d.v
        if (d.y < -6) {
          d.y = h + 6
          d.x = Math.random() * w
        }

        const span = h + 40
        let py = d.y - scrollY * d.z * 0.06
        py = (((py % span) + span) % span) - 20

        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.0011 + d.ph)
        const alpha = d.z * 0.4 * twinkle
        const r = d.z * (d.gold ? 1.25 : 0.95)

        ctx.beginPath()
        ctx.arc(d.x, py, r, 0, Math.PI * 2)
        ctx.fillStyle = d.gold
          ? `rgba(232,183,92,${(alpha * 1.15).toFixed(3)})`
          : `rgba(206,200,235,${(alpha * 0.62).toFixed(3)})`
        ctx.fill()
      }

      frame = requestAnimationFrame(draw)
    }

    const onScroll = () => {
      scrollY = window.scrollY || 0
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame)
        frame = null
      } else if (frame === null) {
        frame = requestAnimationFrame(draw)
      }
    }

    size()
    window.addEventListener("resize", size)
    window.addEventListener("scroll", onScroll, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    frame = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener("resize", size)
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("visibilitychange", onVisibility)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <canvas
        ref={ref}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 h-full w-full motion-reduce:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-1 bg-[radial-gradient(120%_78%_at_50%_0%,transparent_38%,rgba(4,3,8,0.72)_100%)]"
      />
    </>
  )
}
