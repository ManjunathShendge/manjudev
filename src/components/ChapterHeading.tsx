import { Reveal, DrawLine } from "@/components/Reveal"

/**
 * Every chapter opens the same way: number, title, rule. The numbering is not
 * decoration — the page is a sequence and the reader is meant to feel their
 * position in it.
 */
export function ChapterHeading({
  n,
  title,
  kicker,
}: {
  n: string
  title: string
  kicker?: string
}) {
  return (
    <header className="mb-14 md:mb-20">
      <Reveal className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <span className="label text-gold">Chapter {n}</span>
        <h2 className="text-3xl font-semibold tracking-tight uppercase sm:text-4xl md:text-5xl">
          {title}
        </h2>
        <DrawLine className="min-w-16" />
      </Reveal>
      {kicker ? (
        <Reveal delay={0.08}>
          <p className="mt-5 max-w-[52ch] text-muted-foreground">{kicker}</p>
        </Reveal>
      ) : null}
    </header>
  )
}
