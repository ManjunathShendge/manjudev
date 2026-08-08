import { Link } from "react-router-dom"
import { motion } from "motion/react"

import { ChapterHeading } from "@/components/ChapterHeading"
import { Reveal } from "@/components/Reveal"
import { writing } from "@/data/story"

const ease = [0.16, 1, 0.3, 1] as const

/**
 * Chapter 06 — why I write, and that the blog is open to other people.
 *
 * It used to list recent posts too. `LatestWriting` at the foot of the page
 * now does that properly, with cards, and two lists of the same titles on one
 * page reads as a bug rather than as emphasis. So this keeps the argument and
 * hands the evidence to the section at the bottom.
 */
export function Writing() {
  return (
    <section id="writing" className="border-t border-hair py-24 md:py-36">
      <ChapterHeading n="06" title="Writing" kicker={writing.kicker} />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="min-w-0">
          <ul className="grid gap-px border border-hair bg-hair">
            {writing.lines.map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.07, ease }}
                className="flex gap-4 bg-card p-5 md:p-6"
              >
                <span className="label shrink-0 text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm text-muted-foreground md:text-base">{line}</span>
              </motion.li>
            ))}
          </ul>

          <Reveal delay={0.1} className="mt-8">
            <Link
              to="/blog"
              className="label inline-block border border-gold/45 px-5 py-3 text-gold no-underline transition-colors duration-300 hover:bg-gold/10"
            >
              {writing.cta} →
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.15} as="div" className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-hair bg-card/50 p-6">
            <h3 className="label text-gold">Open to contributors</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {writing.contribute}
            </p>
            <Link
              to="/studio"
              className="label mt-5 inline-block border-b border-gold/40 pb-px text-gold no-underline"
            >
              {writing.contributeCta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
