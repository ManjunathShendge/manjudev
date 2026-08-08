import { motion } from "motion/react"
import { ChapterHeading } from "@/components/ChapterHeading"
import { Reveal } from "@/components/Reveal"
import { services } from "@/data/story"

const ease = [0.16, 1, 0.3, 1] as const

/**
 * The freelance offer. Build services lead, growth services follow — they are
 * genuinely secondary, and a grid that treats SEO the same size as "SaaS
 * Products" would misrepresent where the work actually is.
 */
export function Services() {
  return (
    <section id="services" className="border-t border-hair py-24 md:py-36">
      <ChapterHeading n="07" title="Services" kicker={services.intro} />

      <Reveal className="mb-10 flex items-center gap-2.5">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-70" />
          <span className="relative inline-flex size-1.5 rounded-full bg-mint" />
        </span>
        <span className="label text-mint">{services.status}</span>
      </Reveal>

      {/* what I build */}
      <h3 className="label mb-5 text-faint">What I build</h3>
      <div className="grid gap-px border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-3">
        {services.build.map((service, i) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.07, ease }}
            className="group relative bg-card p-5 transition-colors duration-500 hover:bg-secondary md:p-6"
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 block h-px origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100"
            />
            <h4 className="text-base font-semibold tracking-tight transition-colors duration-300 group-hover:text-gold md:text-lg">
              {service.name}
            </h4>
            <p className="mt-1.5 text-sm text-muted-foreground">{service.note}</p>
          </motion.div>
        ))}
      </div>

      {/* growth services */}
      <h3 className="label mt-14 mb-5 text-faint">And around the build</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {services.growth.map((service, i) => (
          <motion.div
            key={service.abbr}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease }}
            className="group flex items-start gap-4 border border-hair bg-card/60 p-5 transition-colors duration-500 hover:border-gold/35"
          >
            <span className="font-display text-xl font-semibold text-gold md:text-2xl">
              {service.abbr}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold tracking-tight">{service.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{service.note}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
