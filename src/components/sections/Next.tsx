import { ChapterHeading } from "@/components/ChapterHeading"
import { LeadForm } from "@/components/LeadForm"
import { Reveal } from "@/components/Reveal"
import { profile } from "@/data/story"

const lines = [
  { k: "Email", v: profile.email, href: `mailto:${profile.email}` },
  { k: "Phone", v: profile.phone, href: `tel:${profile.phoneHref}` },
  { k: "GitHub", v: profile.githubLabel, href: profile.github },
  { k: "LinkedIn", v: profile.linkedinLabel, href: profile.linkedin },
]

/** Last chapter. The story ends on an open question rather than a sign-off. */
export function Next() {
  return (
    <section id="next" className="border-t border-hair pt-24 pb-12 md:pt-36">
      <ChapterHeading n="08" title="What's Next" />

      <Reveal>
        <h3 className="mb-14 text-[clamp(2.2rem,8vw,6rem)] leading-[0.95] font-semibold tracking-[-0.02em] uppercase md:mb-20">
          Let&apos;s build
          <br />
          something
          <br />
          <span className="text-gold">that ships.</span>
        </h3>
      </Reveal>

      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal delay={0.08} className="min-w-0">
          <h4 className="label mb-5 text-faint">Direct</h4>
          <div className="grid">
            {lines.map((l) => {
              const external = l.href.startsWith("http")
              return (
                <a
                  key={l.k}
                  href={l.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center justify-between gap-4 border-t border-hair py-4 no-underline transition-[padding] duration-500 last:border-b hover:px-2.5"
                >
                  <span className="label shrink-0 text-faint transition-colors duration-300 group-hover:text-gold">
                    {l.k}
                  </span>
                  <span className="num truncate text-sm text-foreground transition-colors duration-300 group-hover:text-gold">
                    {l.v}
                  </span>
                </a>
              )
            })}
          </div>
        </Reveal>

        <Reveal delay={0.14} className="min-w-0">
          <LeadForm />
        </Reveal>
      </div>

      <footer className="label mt-16 flex flex-wrap justify-between gap-3 text-faint">
        <span>{profile.location}</span>
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
      </footer>
    </section>
  )
}
