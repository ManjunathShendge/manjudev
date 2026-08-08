import { ChapterHeading } from "@/components/ChapterHeading"
import { Reveal } from "@/components/Reveal"
import { StaggeredGrid } from "@/components/StaggeredGrid"
import { Badge } from "@/components/ui/badge"
import { stackTiles, stackBento, stackAlsoUsing } from "@/data/stack"
import { toolkit, education, certifications, languages } from "@/data/story"

/**
 * No proficiency bars. "React 85%" is a number nobody can defend in an
 * interview — grouped honestly, with a line on where each group actually sits.
 */
export function Toolkit() {
  return (
    <section id="toolkit" className="border-t border-hair py-24 md:py-36">
      <ChapterHeading
        n="05"
        title="Toolkit"
        kicker="What I reach for, grouped by how close it is to the part I care about most."
      />

      {/* The tools, with the three things they built sitting in the middle. */}
      <StaggeredGrid centerText="Stack" tiles={stackTiles} bentoItems={stackBento} />

      {/* The grouping still carries information the logo grid cannot: where each
          part of the stack actually sits for him. */}
      <div className="grid border border-hair md:grid-cols-2">
        {toolkit.map((group, gi) => (
          <Reveal
            key={group.group}
            delay={gi * 0.06}
            className="border-b border-hair p-6 last:border-b-0 md:p-8 md:nth-[2n]:border-l md:nth-last-[-n+2]:border-b-0"
          >
            <h3 className="label font-mono text-gold">{group.group}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{group.note}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10">
        <h3 className="label mb-4 text-faint">Also using</h3>
        <div className="flex flex-wrap gap-1.5">
          {stackAlsoUsing.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="label rounded-none border-hair bg-foreground/2 px-2.5 py-1 text-[0.66rem] font-normal tracking-[0.06em] text-muted-foreground transition-colors duration-300 hover:border-gold/35 hover:bg-gold/6 hover:text-foreground"
            >
              {item}
            </Badge>
          ))}
        </div>
      </Reveal>

      {/* foundation */}
      <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
        <Reveal>
          <h3 className="label mb-6 text-faint">Education</h3>
          {education.map((e) => (
            <div key={e.title} className="border-t border-hair py-4 first:border-t-0 first:pt-0">
              <span className="label float-right ml-4 text-faint">{e.when}</span>
              <h4 className="font-sans text-base font-semibold md:text-lg">{e.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{e.where}</p>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1}>
          <h3 className="label mb-6 text-faint">Certifications</h3>
          <ul className="grid gap-2">
            {certifications.map((c) => (
              <li key={c} className="relative pl-5 text-sm text-muted-foreground md:text-base">
                <span
                  aria-hidden
                  className="absolute top-[0.72em] left-0 block h-px w-1.75 bg-gold-deep"
                />
                {c}
              </li>
            ))}
          </ul>

          <h3 className="label mt-10 mb-4 text-faint">Languages</h3>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <Badge
                key={l}
                variant="outline"
                className="label rounded-none border-hair px-2.5 py-1 text-[0.66rem] font-normal tracking-[0.06em] text-muted-foreground"
              >
                {l}
              </Badge>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
