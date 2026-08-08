import { ChapterHeading } from "@/components/ChapterHeading"
import { ScrollScript } from "@/components/ScrollScript"
import { Reveal } from "@/components/Reveal"
import { origin } from "@/data/story"

export function Origin() {
  return (
    <section id="origin" className="border-t border-hair py-24 md:py-36">
      <ChapterHeading n="01" title="Origin" />

      <ScrollScript text={origin.script} />

      <div className="mt-20 grid gap-10 md:mt-28 md:grid-cols-2 md:gap-16">
        {origin.paras.map((p, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <p className="max-w-[46ch] text-muted-foreground">{p}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
