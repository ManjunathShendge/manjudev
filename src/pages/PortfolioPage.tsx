import { Loader } from "@/components/Loader"
import { HyperspeedBackground } from "@/components/HyperspeedBackground"
import { ChapterRail } from "@/components/ChapterRail"
import { TopBar } from "@/components/TopBar"
import { Hero } from "@/components/sections/Hero"
import { Origin } from "@/components/sections/Origin"
import { Path } from "@/components/sections/Path"
import { Proof } from "@/components/sections/Proof"
import { HardPart } from "@/components/sections/HardPart"
import { Toolkit } from "@/components/sections/Toolkit"
import { Writing } from "@/components/sections/Writing"
import { Services } from "@/components/sections/Services"
import { Next } from "@/components/sections/Next"

/**
 * The story. This was the whole of App.tsx before the blog arrived; it is now
 * one route among several, and keeps the pieces that belong to it alone — the
 * loader, the WebGL road, the chapter rail.
 */
export function PortfolioPage() {
  return (
    <>
      <Loader />

      {/*
        Hyperspeed is the moving background layer; the starfield above it (in
        App) carries the vignette that keeps text legible over the road. On
        phones and under reduced-motion Hyperspeed drops out entirely.
      */}
      <HyperspeedBackground />

      <ChapterRail />
      <TopBar />

      <main className="relative z-2 xl:pl-52">
        <div className="mx-auto w-[min(1180px,100%-3rem)]">
          <Hero />
          <Origin />
          <Path />
          <Proof />
          <HardPart />
          <Toolkit />
          <Writing />
          <Services />
          <Next />
        </div>
      </main>
    </>
  )
}
