/**
 * What every blog screen renders while `.env` is still empty. It is a real
 * screen rather than a blank page or a thrown error: the credentials genuinely
 * are not there yet, and the useful thing to show is the next step.
 */
export function SetupNotice({ context = "The blog" }: { context?: string }) {
  return (
    <div className="border border-hair bg-card/50 p-7 md:p-9">
      <p className="label text-gold">Not connected yet</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight uppercase md:text-2xl">
        {context} needs its Supabase keys
      </h2>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        Everything is built and waiting — schema, policies, editor, review queue. It stays
        inert until the project it should talk to is named.
      </p>

      <ol className="mt-6 grid gap-3 text-sm text-muted-foreground">
        {[
          "Create a project at supabase.com, then open Project Settings → API.",
          "Copy .env.example to .env and paste in the Project URL and the anon public key.",
          "Run the three files in supabase/migrations in order, in the SQL editor.",
          "Restart the dev server — Vite only reads .env at startup.",
        ].map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="label shrink-0 text-gold">{String(i + 1).padStart(2, "0")}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-xs text-faint">
        Full walkthrough in <span className="font-mono text-muted-foreground">docs/BLOG_SETUP.md</span>.
      </p>
    </div>
  )
}
