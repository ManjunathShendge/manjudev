import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type Shot = { src: string; caption: string }

/**
 * Real screenshots of the live deployments, not mockups. The frame is small by
 * design — it keeps the stacked cards shorter than the viewport — so every shot
 * opens full size on click.
 */
export function ProjectGallery({ shots, name }: { shots: readonly Shot[]; name: string }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  // The image drifts inside its frame as the card moves up the viewport.
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"])

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <div ref={frameRef} className="flex flex-col gap-2.5">
      <Carousel setApi={setApi} opts={{ loop: true }} className="group/gal relative">
        <CarouselContent className="ml-0">
          {shots.map((shot, i) => (
            <CarouselItem key={shot.src} className="pl-0">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Open larger view: ${shot.caption}`}
                className="relative block aspect-16/10 w-full cursor-zoom-in overflow-hidden border border-hair bg-background/60"
              >
                <motion.img
                  src={shot.src}
                  alt={`${name} — ${shot.caption}`}
                  loading="lazy"
                  decoding="async"
                  width={1920}
                  height={1200}
                  style={{ y }}
                  className="absolute inset-0 size-full scale-108 object-cover object-top transition-transform duration-700 group-hover/gal:scale-112"
                />
                {/* keep the bright screenshots from fighting the dark page */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/55 via-transparent to-transparent transition-opacity duration-500 group-hover/gal:opacity-30"
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>

        {shots.length > 1 && (
          <>
            <CarouselPrevious className="left-2 size-7 rounded-none border-hair bg-background/80 text-foreground opacity-0 transition-opacity duration-300 group-hover/gal:opacity-100 focus-visible:opacity-100" />
            <CarouselNext className="right-2 size-7 rounded-none border-hair bg-background/80 text-foreground opacity-0 transition-opacity duration-300 group-hover/gal:opacity-100 focus-visible:opacity-100" />
          </>
        )}
      </Carousel>

      <div className="flex items-center justify-between gap-3">
        <p className="label truncate text-faint">{shots[current]?.caption}</p>
        {shots.length > 1 && (
          <div className="flex shrink-0 gap-1">
            {shots.map((shot, i) => (
              <button
                key={shot.src}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
                className={cn(
                  "h-px w-4 transition-all duration-400",
                  i === current ? "bg-gold" : "bg-border hover:bg-muted-foreground",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        {/* shadcn's DialogContent ships `sm:max-w-lg`; the sm: variant wins unless
            the override is also written at the sm: breakpoint. */}
        <DialogContent className="rounded-none border-border bg-card p-2 sm:max-w-[min(1400px,94vw)] sm:p-3">
          <DialogTitle className="label truncate px-1 pt-1 pb-2 text-faint">
            {name} — {open !== null ? shots[open]?.caption : ""}
          </DialogTitle>
          {open !== null && (
            <img
              src={shots[open].src}
              alt={`${name} — ${shots[open].caption}`}
              className="mx-auto h-auto max-h-[78vh] w-auto border border-hair object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
