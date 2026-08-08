/** Initials when there is no picture, which is most of the time. */
export function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string
  url?: string | null
  size?: number
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return url ? (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className="shrink-0 border border-hair object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className="label grid shrink-0 place-items-center border border-hair bg-secondary/60 text-gold"
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </span>
  )
}
