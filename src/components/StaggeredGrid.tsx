import React, { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import imagesLoaded from "imagesloaded"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

export interface TileItem {
  label: string
  group: string
  icon: React.ReactNode
}

export interface BentoItem {
  id: number | string
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  image?: string
}

export interface StaggeredGridProps {
  tiles: TileItem[]
  bentoItems: BentoItem[]
  centerText?: string
  className?: string
}

/**
 * 7 columns × 3 rows = 21 slots. Slot 9 is the third cell of the middle row, so
 * the bento spans columns 2–4 and sits dead centre. (The original Codrops
 * layout used 16, which is centre-of-row-3 in a five-row grid — in three rows
 * that lands in the bottom row instead.)
 */
const COLS = 7
const SLOTS = 21
const BENTO_START = 9

/**
 * Scroll-staggered grid, adapted from the Codrops "Halcyon" pattern.
 *
 * Columns rise from below at different rates depending on their distance from
 * the centre, and the middle three slots hold a bento of the projects that the
 * surrounding tools actually built.
 *
 * Two things to know if you edit this:
 *  - GSAP drives this section while Motion drives the rest of the page. They
 *    coexist because ScrollTrigger is fed by Lenis in SmoothScroll.tsx; without
 *    that, every trigger here fires against stale scroll positions.
 *  - All animation lives inside a gsap.context so React StrictMode's double
 *    effect invocation cannot leave duplicate ScrollTriggers behind.
 */
export function StaggeredGrid({
  tiles,
  bentoItems,
  centerText = "Stack",
  className,
}: StaggeredGridProps) {
  const [ready, setReady] = useState(false)
  const [activeBento, setActiveBento] = useState(0)
  const [wide, setWide] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  // Seven columns is ~50px per tile on a phone — unreadable, and it leaves the
  // bento a third of that. Narrow screens get four columns and the bento lifted
  // out of the grid into a full-width strip above it.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const apply = () => setWide(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const cols = wide ? COLS : 4

  // Wait for the bento screenshots so the grid does not animate against
  // still-collapsing layout.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const imgs = root.querySelectorAll(".bento-img")
    if (imgs.length === 0) {
      setReady(true)
      return
    }
    imagesLoaded(imgs, { background: true }, () => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const ctx = gsap.context(() => {
      if (textRef.current) {
        gsap.from(textRef.current.querySelectorAll(".char"), {
          scrollTrigger: {
            trigger: textRef.current,
            start: "top bottom",
            end: "center center-=25%",
            scrub: 1,
          },
          ease: "sine.out",
          yPercent: 260,
          autoAlpha: 0,
          stagger: { each: 0.05, from: "center" },
        })
      }

      const grid = gridRef.current
      if (!grid) return

      const items = Array.from(grid.querySelectorAll<HTMLElement>(".grid__item"))
      const middleColumn = Math.floor(cols / 2)

      const columns: HTMLElement[][] = Array.from({ length: cols }, () => [])
      items.forEach((item) => {
        const col = Number(item.dataset.col ?? 0)
        if (columns[col]) columns[col].push(item)
      })

      columns.forEach((columnItems, columnIndex) => {
        if (columnItems.length === 0) return
        const delay = Math.abs(columnIndex - middleColumn) * 0.2

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: grid,
            start: "top bottom",
            end: "center center",
            scrub: 1.5,
          },
        })

        tl.from(columnItems, {
          yPercent: 420,
          autoAlpha: 0,
          delay,
          ease: "sine.out",
        })

        // The inner face lags its tile slightly, which reads as depth.
        const faces = columnItems
          .map((item) => item.querySelector(".grid__item-img"))
          .filter((el): el is HTMLElement => el instanceof HTMLElement)

        if (faces.length > 0) {
          tl.from(
            faces,
            { transformOrigin: "50% 0%", scaleY: 1.35, ease: "sine.out" },
            0,
          )
        }
      })

      const bento = grid.querySelector(".bento-container")
      if (bento) {
        gsap.to(bento, {
          scrollTrigger: {
            trigger: grid,
            start: "top top+=15%",
            end: "bottom center",
            scrub: 1,
            invalidateOnRefresh: true,
          },
          scale: 1.18,
          ease: "power2.out",
          force3D: true,
        })
      }
    }, rootRef)

    return () => ctx.revert()
  }, [ready, cols])

  const chars = centerText.split("").map((char, i) => (
    <span key={i} className="char inline-block will-change-transform">
      {char === " " ? " " : char}
    </span>
  ))

  // Wide: 21 slots with the bento holding the middle three of the centre row.
  // Narrow: tiles only — the bento is rendered above the grid instead.
  const slots: (TileItem | "BENTO")[] = []
  if (wide) {
    let t = 0
    for (let i = 0; i < SLOTS; i++) {
      if (i >= BENTO_START && i <= BENTO_START + 2) slots.push("BENTO")
      else slots.push(tiles[t++ % tiles.length])
    }
  } else {
    slots.push(...tiles)
  }

  const bento = (
    <div
      data-col={wide ? BENTO_START % COLS : undefined}
      className={cn(
        "bento-container relative flex items-stretch gap-1.5 will-change-transform",
        wide ? "grid__item z-20 col-span-3 row-span-1 h-full w-full" : "h-56 w-full",
      )}
    >
      {bentoItems.map((item, index) => {
        const isActive = activeBento === index
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            aria-label={`${item.title} — ${item.subtitle}`}
            onMouseEnter={() => setActiveBento(index)}
            onFocus={() => setActiveBento(index)}
            onClick={() => setActiveBento(index)}
            style={{ width: isActive ? "60%" : "20%" }}
            className={cn(
              "relative h-full cursor-pointer overflow-hidden rounded-sm transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]",
              isActive ? "bg-card shadow-2xl" : "bg-background",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 z-50 rounded-sm border transition-colors duration-700",
                isActive ? "border-gold/45" : "border-hair",
              )}
            />

            {/* expanded */}
            <span
              className={cn(
                "absolute inset-0 block transition-opacity duration-500",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {item.image && (
                <>
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden
                    className="bento-img absolute inset-0 size-full object-cover object-top opacity-85"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 block h-2/3 bg-linear-to-t from-background via-background/70 to-transparent"
                  />
                </>
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="truncate text-left text-xs font-semibold tracking-tight text-foreground md:text-sm">
                  {item.title}
                </span>
                <span className="shrink-0 text-gold">{item.icon}</span>
              </span>
            </span>

            {/* collapsed */}
            <span
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-500",
                isActive ? "pointer-events-none scale-90 opacity-0" : "opacity-100",
              )}
            >
              <span className="text-gold/70">{item.icon}</span>
              <span className="label max-h-full truncate rotate-180 text-faint [writing-mode:vertical-rl]">
                {item.title}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div className="grid w-full place-items-center">
        <div
          ref={textRef}
          className="flex font-display text-[clamp(2.6rem,13vw,9rem)] leading-[0.8] font-semibold tracking-[-0.03em] text-foreground uppercase"
        >
          {chars}
        </div>
      </div>

      {!wide && <div className="mt-8">{bento}</div>}

      <div
        ref={gridRef}
        className={cn(
          "my-[6vh] grid w-full gap-2 md:my-[9vh] md:gap-3",
          wide
            ? "aspect-[1.9] grid-cols-7 grid-rows-3"
            : "auto-rows-19 grid-cols-4",
        )}
      >
        {slots.map((slot, i) => {
          if (slot === "BENTO") {
            return i === BENTO_START ? (
              <React.Fragment key="bento">{bento}</React.Fragment>
            ) : null
          }

          return (
            <figure
              key={`${slot.label}-${i}`}
              data-col={i % cols}
              className="grid__item group relative z-10 m-0 perspective-midrange will-change-[transform,opacity]"
            >
              <div className="grid__item-img relative flex size-full items-center justify-center overflow-hidden rounded-sm border border-hair bg-card backface-hidden transition-colors duration-500 will-change-transform group-hover:border-gold/35">
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-b from-transparent to-gold/8 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <span className="relative flex flex-col items-center justify-center gap-2 px-1 text-center">
                  <span className="text-xl text-muted-foreground transition-colors duration-300 group-hover:text-gold md:text-2xl">
                    {slot.icon}
                  </span>
                  <span className="label truncate text-[0.55rem] text-faint transition-colors duration-300 group-hover:text-foreground md:text-[0.62rem]">
                    {slot.label}
                  </span>
                </span>
              </div>
            </figure>
          )
        })}
      </div>
    </div>
  )
}

export default StaggeredGrid
