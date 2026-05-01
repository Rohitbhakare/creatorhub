import Link from 'next/link'

export interface ChapterRef {
  /** URL the card navigates to (e.g. `/content/<id>#day-2`). */
  href: string
  /** Chapter number / kicker, e.g. "Day 2", "Prologue", "Chapter 3". */
  kicker: string
  /** Chapter title — e.g. "Murud-Janjira: the fort that stayed". */
  title: string
}

interface Props {
  prev?: ChapterRef
  next?: ChapterRef
}

/**
 * Prev/Next chapter footer (E5.3 T9).
 *
 * Composition matches v3 wireframe `pack-w-detail.jsx` lines 320–338:
 * two-up cards — Prev (surface bg) + Next (ink bg with white text). Each
 * card carries its own kicker + title. When only one neighbour exists
 * (start or end of book), the missing card is omitted and the present one
 * stretches.
 *
 * Server component — pure markup; arrow-key navigation is handled by the
 * page-level `<ReaderChrome>` (or future client wrapper).
 */
export function PrevNextChapterFooter({ prev, next }: Props) {
  if (!prev && !next) return null
  const both = Boolean(prev && next)
  return (
    <nav
      aria-label="Chapter navigation"
      style={{
        marginTop: 60,
        paddingTop: 36,
        borderTop: '1px solid var(--hairline)',
        display: 'grid',
        gridTemplateColumns: both ? '1fr 1fr' : '1fr',
        gap: 14,
      }}
    >
      {prev ? (
        <Link
          href={prev.href}
          rel="prev"
          style={{
            padding: 20,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono, var(--font-sans))',
              fontSize: 10,
              color: 'var(--ink-muted)',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            ← {prev.kicker}
          </div>
          <div
            className="ch-display"
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {prev.title}
          </div>
        </Link>
      ) : null}
      {next ? (
        <Link
          href={next.href}
          rel="next"
          style={{
            padding: 20,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--ink)',
            color: 'white',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono, var(--font-sans))',
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.65)',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 6,
              textAlign: 'right',
            }}
          >
            {next.kicker} →
          </div>
          <div
            className="ch-display"
            style={{
              fontSize: 17,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              textAlign: 'right',
            }}
          >
            {next.title}
          </div>
        </Link>
      ) : null}
    </nav>
  )
}
