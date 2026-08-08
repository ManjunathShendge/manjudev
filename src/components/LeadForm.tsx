import { useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { serviceOptions, profile } from "@/data/story"
import { sendEnquiry } from "@/lib/blog/enquiries"
import { cn } from "@/lib/utils"

type Status = "idle" | "sending" | "sent" | "error"

const field =
  "w-full rounded-none border border-hair bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-faint transition-colors duration-300 focus:border-gold/50 focus:outline-none"

/**
 * Enquiries go into Supabase and show up under /admin.
 *
 * This used to POST to Netlify Forms, which worked but tied the form to one
 * host and never worked in development. The `enquiries` table is the only
 * thing in the schema an anonymous visitor may write to — insert only, no read
 * — with length limits in the migration capping what one request can carry.
 *
 * Unlike the old version this now works locally, which means a failure here is
 * a real failure rather than the expected dev-mode 404.
 */
export function LeadForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [picked, setPicked] = useState<string[]>([])
  const [error, setError] = useState("")

  const toggle = (service: string) =>
    setPicked((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    )

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("sending")
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)
    const value = (key: string) => String(data.get(key) ?? "").trim()

    // Honeypot. Bots fill in every field they find; people never see this one.
    // Reporting success rather than an error means a bot has no signal to
    // learn from, and a real person could never end up here anyway.
    if (value("bot-field")) {
      setStatus("sent")
      form.reset()
      setPicked([])
      return
    }

    try {
      await sendEnquiry({
        name: value("name"),
        email: value("email"),
        company: value("company") || null,
        services: picked,
        message: value("message"),
      })
      setStatus("sent")
      form.reset()
      setPicked([])
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <div className="border border-hair bg-card/60 p-6 md:p-8">
      <h3 className="text-xl font-semibold tracking-tight uppercase md:text-2xl">
        Start a project
      </h3>
      <p className="mt-2 mb-7 max-w-[52ch] text-sm text-muted-foreground">
        Tell me what you are building and I will come back with scope, a timeline and a price.
      </p>

      <form onSubmit={onSubmit} className="grid gap-4">
        {/* Honeypot: real people leave this empty, bots fill it in. */}
        <p className="hidden">
          <label>
            Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="label text-faint">Name *</span>
            <input required name="name" autoComplete="name" placeholder="Your name" className={field} />
          </label>
          <label className="grid gap-2">
            <span className="label text-faint">Email *</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.com"
              className={field}
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="label text-faint">Company</span>
          <input name="company" autoComplete="organization" placeholder="Optional" className={field} />
        </label>

        <fieldset className="grid gap-2.5">
          <legend className="label mb-1 text-faint">
            Service interested in{" "}
            <span className="text-faint/70">— pick as many as apply</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {serviceOptions.map((service) => {
              const on = picked.includes(service)
              return (
                <button
                  key={service}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(service)}
                  className={cn(
                    "label rounded-none border px-2.5 py-1.5 transition-colors duration-300",
                    on
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-hair bg-foreground/2 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {service}
                </button>
              )
            })}
          </div>
          {/* Mirrors the chips so the POST body carries them too. */}
          <input type="hidden" name="services" value={picked.join(", ")} />
        </fieldset>

        <label className="grid gap-2">
          <span className="label text-faint">Project details *</span>
          <textarea
            required
            name="message"
            rows={5}
            placeholder="What are you building, who is it for, and when do you need it?"
            className={cn(field, "resize-y")}
          />
        </label>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={status === "sending"}
            className="label rounded-none disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send enquiry"}
          </Button>

          <AnimatePresence mode="wait">
            {status === "sent" && (
              <motion.p
                key="sent"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="label text-mint"
                role="status"
              >
                Sent — I&apos;ll reply within a day.
              </motion.p>
            )}
            {status === "error" && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="label max-w-[40ch] text-destructive"
                role="alert"
              >
                Could not send ({error}). Email me at{" "}
                <a href={`mailto:${profile.email}`} className="underline">
                  {profile.email}
                </a>
                .
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  )
}
