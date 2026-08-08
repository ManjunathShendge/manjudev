import { useEffect, useRef, useState, type ReactNode } from "react"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"

import { uploadMedia } from "@/lib/blog/mutations"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (html: string) => void
  /** Uploads land under this user's folder — the storage policy checks it. */
  userId: string
}

/**
 * The writing surface. TipTap over a plain textarea because the people this is
 * for are not all going to write HTML, and over a markdown box because the
 * brief was a CMS: what you see while writing should be what publishes.
 *
 * The editor stores HTML. It is sanitised again on render — see
 * `prepareBody` — because an editor is a convenience, not a security boundary.
 */
export function RichTextEditor({ value, onChange, userId }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // What we last handed upward. Lets us tell "the post finished loading" apart
  // from "the user typed", so setContent never fights the caret.
  const emitted = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({
        placeholder: "Start writing. Use the toolbar, or markdown shortcuts — ## for a heading, - for a list.",
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      emitted.current = html
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: "prose-post min-h-104 max-w-none focus:outline-none",
      },
    },
  })

  useEffect(() => {
    if (!editor || value === emitted.current) return
    emitted.current = value
    editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  // v3 does not re-render on every transaction, so the toolbar has to ask for
  // the marks it cares about rather than reading them during render.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      strike: e?.isActive("strike") ?? false,
      code: e?.isActive("code") ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      bullet: e?.isActive("bulletList") ?? false,
      ordered: e?.isActive("orderedList") ?? false,
      quote: e?.isActive("blockquote") ?? false,
      codeBlock: e?.isActive("codeBlock") ?? false,
      link: e?.isActive("link") ?? false,
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
    }),
  })

  const pickImage = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadMedia(file, userId)
      editor?.chain().focus().setImage({ src: url, alt: "" }).run()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const toggleLink = () => {
    if (!editor) return
    if (state?.link) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt("Link to where?", "https://")
    if (!url) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  if (!editor) return <div className="min-h-104 animate-pulse border border-hair bg-card/30" />

  return (
    <div className="border border-hair bg-background/40">
      <div className="flex flex-wrap items-center gap-1 border-b border-hair bg-card/50 p-2">
        <Tool active={state?.bold} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold">
          B
        </Tool>
        <Tool active={state?.italic} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic">
          <span className="italic">I</span>
        </Tool>
        <Tool active={state?.strike} onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough">
          <span className="line-through">S</span>
        </Tool>
        <Tool active={state?.code} onClick={() => editor.chain().focus().toggleCode().run()} label="Inline code">
          {"</>"}
        </Tool>

        <Divider />

        <Tool active={state?.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Heading 2">
          H2
        </Tool>
        <Tool active={state?.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="Heading 3">
          H3
        </Tool>

        <Divider />

        <Tool active={state?.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list">
          •
        </Tool>
        <Tool active={state?.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list">
          1.
        </Tool>
        <Tool active={state?.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote">
          &ldquo;
        </Tool>
        <Tool active={state?.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()} label="Code block">
          {"{ }"}
        </Tool>
        <Tool onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Divider">
          —
        </Tool>

        <Divider />

        <Tool active={state?.link} onClick={toggleLink} label="Link">
          ⛓
        </Tool>
        <Tool onClick={() => fileRef.current?.click()} label="Insert image" disabled={uploading}>
          {uploading ? "…" : "IMG"}
        </Tool>

        <div className="ml-auto flex items-center gap-1">
          <Tool onClick={() => editor.chain().focus().undo().run()} disabled={!state?.canUndo} label="Undo">
            ↶
          </Tool>
          <Tool onClick={() => editor.chain().focus().redo().run()} disabled={!state?.canRedo} label="Redo">
            ↷
          </Tool>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void pickImage(file)
          }}
        />
      </div>

      {uploadError && (
        <p className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {uploadError}
        </p>
      )}

      <EditorContent editor={editor} className="px-5 py-6" />
    </div>
  )
}

function Tool({
  children,
  onClick,
  active,
  disabled,
  label,
}: {
  children: ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "label grid h-8 min-w-8 place-items-center border px-2 transition-colors duration-200",
        active
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-transparent text-muted-foreground hover:border-hair hover:text-foreground",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-hair" />
}
