import { Fragment } from 'react'
import type { ReaderMode } from '@/lib/reader-mode'

interface MarkdownBodyProps {
  body: string
  /** Reader mode — controls drop-cap + pull-quote decorations (E5.3 T3/T4). */
  mode?: ReaderMode
}

/**
 * Tiny safe markdown subset:
 * - blank lines split paragraphs
 * - lines starting with `# ` `## ` `### ` are headings
 * - lines starting with `> ` are pull-quotes
 * - inline `**bold**` and `*italic*` are honored
 *
 * No HTML is interpolated — everything is React elements with text content,
 * so user-supplied bodies cannot inject markup. (DOMPurify would be overkill
 * for this surface; we'd rather not give markdown the chance to embed HTML
 * at all.)
 *
 * **E5.3 T3/T4 decorations** — gated by `mode`:
 * - Magazine: first paragraph gets a `.ch-dropcap-host` wrapper (CSS
 *   `::first-letter` does the 76px coral capital). Blockquotes render
 *   with the v3 pull-quote treatment (3px coral left-border + tint bg +
 *   italic display font).
 * - Compact: no drop-cap; blockquote is plain italic with no decoration.
 */
export function MarkdownBody({ body, mode = 'magazine' }: MarkdownBodyProps) {
  const blocks = body.split(/\n{2,}/)
  const isMagazine = mode === 'magazine'
  let firstParagraphIndex = -1
  if (isMagazine) {
    for (let i = 0; i < blocks.length; i++) {
      const t = (blocks[i] ?? '').trimStart()
      if (
        t &&
        !t.startsWith('#') &&
        !t.startsWith('>') &&
        !t.startsWith('-') &&
        !t.startsWith(':::')
      ) {
        firstParagraphIndex = i
        break
      }
    }
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      {blocks.map((block, i) => {
        const trimmed = block.trimStart()
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={i}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                margin: '28px 0 10px',
                color: 'var(--ink)',
              }}
            >
              {renderInline(trimmed.slice(4))}
            </h3>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={i}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                margin: '36px 0 14px',
                color: 'var(--ink)',
              }}
            >
              {renderInline(trimmed.slice(3))}
            </h2>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={i}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 34,
                margin: '40px 0 16px',
                color: 'var(--ink)',
              }}
            >
              {renderInline(trimmed.slice(2))}
            </h1>
          )
        }
        if (trimmed.startsWith('> ')) {
          return isMagazine ? (
            <aside
              key={i}
              className="ch-pull-quote"
              role="note"
            >
              {renderInline(trimmed.slice(2))}
            </aside>
          ) : (
            <blockquote
              key={i}
              style={{
                fontStyle: 'italic',
                margin: '20px 0',
                color: 'var(--ink-soft)',
                fontSize: 18,
                lineHeight: 1.6,
                paddingLeft: 0,
                borderLeft: 'none',
              }}
            >
              {renderInline(trimmed.slice(2))}
            </blockquote>
          )
        }
        const isDropCapHost = i === firstParagraphIndex
        return (
          <p
            key={i}
            className={isDropCapHost ? 'ch-dropcap-host' : undefined}
            style={{ margin: '16px 0', lineHeight: 1.7, fontSize: 18 }}
          >
            {renderInline(block)}
          </p>
        )
      })}
    </div>
  )
}

/** Tokenize **bold** / *italic* into JSX. No HTML interpolation. */
function renderInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens.map((tok, i) => {
    if (!tok) return null
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>
    }
    if (tok.startsWith('*') && tok.endsWith('*')) {
      return <em key={i}>{tok.slice(1, -1)}</em>
    }
    return <Fragment key={i}>{tok}</Fragment>
  })
}
