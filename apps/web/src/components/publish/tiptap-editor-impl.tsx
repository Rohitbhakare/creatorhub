'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube from '@tiptap/extension-youtube'
import { useEffect, useRef } from 'react'
import { htmlToMarkdown, markdownToHtml } from '@/lib/publish/tiptap-markdown'

interface Props {
  value: string // markdown
  onChange: (markdown: string) => void
}

/**
 * Heavy TipTap editor (E5.5 T3) — lazy-loaded by `<TipTapEditor>`.
 *
 * Extensions: starter-kit + link + image + table + YouTube embed.
 * (Collaboration cursor deferred — needs Yjs/WebRTC infra; filed as ENH.)
 *
 * Roundtrip:
 *   - on mount, `markdownToHtml(value)` seeds the editor
 *   - on every doc transaction, `htmlToMarkdown()` of the editor's HTML
 *     is sent up via `onChange` (debounced lightly via the wizard's autosave).
 */
export function TipTapEditorImpl({ value, onChange }: Props) {
  // Track the last value we serialised out so we don't loop on our own emits.
  const lastEmittedRef = useRef<string>(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ controls: true, nocookie: true, width: 560, height: 315 }),
    ],
    content: markdownToHtml(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'ch-tiptap-prose',
        'aria-label': 'Story body',
      },
    },
    onUpdate: ({ editor: e }) => {
      const md = htmlToMarkdown(e.getHTML())
      if (md !== lastEmittedRef.current) {
        lastEmittedRef.current = md
        onChange(md)
      }
    },
  })

  // Reseed if the parent passes new markdown (e.g. when a draft is loaded).
  useEffect(() => {
    if (!editor) return
    if (value === lastEmittedRef.current) return
    lastEmittedRef.current = value
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false })
  }, [value, editor])

  if (!editor) {
    return (
      <div
        style={{
          minHeight: 320,
          padding: 16,
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--ink-muted)',
        }}
      >
        Loading editor…
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        role="toolbar"
        aria-label="Editor toolbar"
        style={{
          display: 'flex',
          gap: 4,
          padding: 8,
          borderBottom: '1px solid var(--hairline)',
          background: 'var(--surface-alt)',
          flexWrap: 'wrap',
        }}
      >
        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().toggleBold().run()
          }}
          active={editor.isActive('bold')}
          ariaLabel="Bold"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().toggleItalic().run()
          }}
          active={editor.isActive('italic')}
          ariaLabel="Italic"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }}
          active={editor.isActive('heading', { level: 2 })}
          ariaLabel="Heading 2"
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }}
          active={editor.isActive('heading', { level: 3 })}
          ariaLabel="Heading 3"
        >
          H3
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().toggleBlockquote().run()
          }}
          active={editor.isActive('blockquote')}
          ariaLabel="Quote"
        >
          ❝
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().toggleBulletList().run()
          }}
          active={editor.isActive('bulletList')}
          ariaLabel="Bullet list"
        >
          •
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run()
          }}
          active={editor.isActive('orderedList')}
          ariaLabel="Numbered list"
        >
          1.
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            const url = window.prompt('Link URL', 'https://')
            if (!url) return
            editor.chain().focus().setLink({ href: url }).run()
          }}
          active={editor.isActive('link')}
          ariaLabel="Insert link"
        >
          ↗
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            const url = window.prompt('Image URL')
            if (!url) return
            editor.chain().focus().setImage({ src: url, alt: '' }).run()
          }}
          ariaLabel="Insert image"
        >
          📷
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }}
          ariaLabel="Insert table"
        >
          ⊞
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            const url = window.prompt('YouTube URL')
            if (!url) return
            editor.commands.setYoutubeVideo({ src: url })
          }}
          ariaLabel="Insert YouTube embed"
        >
          ▶
        </ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

interface ToolbarBtnProps {
  onClick: () => void
  active?: boolean
  ariaLabel: string
  children: React.ReactNode
}

function ToolbarBtn({ onClick, active, ariaLabel, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        border: 'none',
        background: active ? 'var(--primary-tint)' : 'transparent',
        color: active ? 'var(--primary-deep)' : 'var(--ink)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}
