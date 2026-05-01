'use client'

import dynamic from 'next/dynamic'

interface Props {
  value: string
  onChange: (markdown: string) => void
}

/**
 * Lightweight loader for the TipTap editor (E5.5 T3).
 *
 * The full editor (~200KB with starter-kit + link + image + table + YouTube)
 * is dynamically imported so it only loads on the publish page, not every
 * route's bundle.
 */
const TipTapEditorImpl = dynamic(
  () => import('./tiptap-editor-impl').then((m) => m.TipTapEditorImpl),
  {
    ssr: false,
    loading: () => (
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
    ),
  },
)

export function TipTapEditor({ value, onChange }: Props) {
  return <TipTapEditorImpl value={value} onChange={onChange} />
}
