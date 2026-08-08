import { useRef, useState } from "react"
import { uploadMedia } from "@/lib/blog/mutations"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  userId: string
  hint?: string
  /** Cover images are wide; an OG image is wider still. */
  aspect?: string
}

/**
 * Upload or paste. Both, because the two ways people actually get an image in
 * here are "I have a file" and "it is already on the internet", and a picker
 * that only does the first is the one that gets worked around.
 */
export function ImageField({ label, value, onChange, userId, hint, aspect = "aspect-video" }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      onChange(await uploadMedia(file, userId))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="grid gap-2">
      <span className="label text-faint">{label}</span>

      {value ? (
        <div className="relative border border-hair">
          <img src={value} alt="" className={cn("w-full object-cover", aspect)} />
          <div className="flex items-center gap-3 border-t border-hair p-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="label text-faint transition-colors duration-300 hover:text-gold"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="label text-faint transition-colors duration-300 hover:text-destructive"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) void upload(file)
          }}
          className={cn(
            "grid place-items-center border border-dashed px-4 py-9 transition-colors duration-300",
            aspect,
            dragging ? "border-gold/60 bg-gold/5" : "border-hair hover:border-border",
          )}
        >
          <span className="label text-faint">
            {busy ? "Uploading…" : dragging ? "Drop it" : "Upload or drop an image"}
          </span>
        </button>
      )}

      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.trim() || null)}
        placeholder="…or paste an image URL"
        className="w-full rounded-none border border-hair bg-background/60 px-3 py-2 text-xs text-muted-foreground placeholder:text-faint focus:border-gold/50 focus:outline-none"
      />

      {hint && <p className="text-xs text-faint">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
        }}
      />
    </div>
  )
}
