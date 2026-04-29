import { Fragment } from 'react'

interface MarkdownBodyProps {
  body: string
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
 */
export function MarkdownBody({ body }: MarkdownBodyProps) {
  const blocks = body.split(/\n{2,}/)

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
          return (
            <blockquote
              key={i}
              style={{
                fontStyle: 'italic',
                borderLeft: '2px solid var(--primary)',
                paddingLeft: 20,
                margin: '24px 0',
                color: 'var(--ink-soft)',
                fontSize: 22,
                lineHeight: 1.5,
              }}
            >
              {renderInline(trimmed.slice(2))}
            </blockquote>
          )
        }
        return (
          <p key={i} style={{ margin: '16px 0', lineHeight: 1.7, fontSize: 18 }}>
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
