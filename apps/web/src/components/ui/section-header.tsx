import Link from 'next/link'

interface SectionHeaderProps {
  /** Mono kicker text — e.g. 'CURATED FOR YOU'. */
  kicker?: string
  /** Display heading. */
  title: string
  /** "See all →" link (optional). */
  seeAllHref?: string
  /** Heading level. Defaults to h2. */
  as?: 'h1' | 'h2' | 'h3'
  /** Make kicker coral instead of muted. */
  emphKicker?: boolean
  /** Override the title font-size. */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * The "kicker + title + see-all" pattern repeats across home, discover,
 * mini-site and reader. One component avoids drift in spacing and tone.
 */
export function SectionHeader({
  kicker,
  title,
  seeAllHref,
  as = 'h2',
  emphKicker,
  size = 'md',
}: SectionHeaderProps) {
  const Heading = as
  const fontSize =
    size === 'sm'
      ? 'clamp(20px, 2.6vw, 26px)'
      : size === 'lg'
        ? 'clamp(28px, 3.6vw, 36px)'
        : 'clamp(22px, 3vw, 30px)'

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 18,
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        {kicker && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: emphKicker === true ? 'var(--primary)' : 'var(--ink-muted)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {kicker}
          </span>
        )}
        <Heading
          className="ch-display"
          style={{
            fontSize,
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </Heading>
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          prefetch
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)',
            textDecoration: 'none',
            borderBottom: '1.5px solid var(--primary)',
            paddingBottom: 2,
          }}
        >
          See all →
        </Link>
      )}
    </header>
  )
}
