import Link from 'next/link'
import type { SubCategoryRow } from '@/lib/api/discover'

interface Props {
  subCategories: SubCategoryRow[]
}

const EMOJI: Record<string, string> = {
  road_trips: '🚗',
  biking: '🏍️',
  trekking: '🥾',
  food_trails: '🍜',
  adventure: '🏔️',
  heritage: '🏛️',
  wildlife: '🦌',
  photo_walks: '📷',
  wellness: '🧘',
  family: '👪',
  luxury: '✨',
  offbeat: '🧭',
  longform: '📖',
  field_notes: '📝',
  reviews: '⭐',
}

const TINTS = [
  '#FFF3E0',
  '#FFEBEE',
  '#E8F5E9',
  '#FCE4EC',
  '#E3F2FD',
  '#FFF8E1',
  '#EFEBE9',
  '#EDE7F6',
  '#E0F2F1',
  '#FFF0F0',
  '#F3E5F5',
  '#E8EAF6',
]

function emojiFor(slug: string): string {
  return EMOJI[slug] ?? '✦'
}

function tintFor(idx: number): string {
  return TINTS[idx % TINTS.length] ?? '#F5F5F5'
}

/**
 * Responsive 12-tile grid of travel sub-categories. 3 cols on mobile,
 * 6 cols on desktop. Each tile routes to /discover/results?subCat=<id>
 * so the destination renders the full filtered list.
 */
export function CategoryBrowseGrid({ subCategories }: Props) {
  if (subCategories.length === 0) return null
  return (
    <section style={{ marginBottom: 40 }}>
      <header style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginBottom: 4,
            fontWeight: 700,
          }}
        >
          Browse
        </p>
        <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)' }}>
          By category
        </h2>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {subCategories.map((row, idx) => (
          <Link
            key={row.id}
            href={`/discover/results?sub_category_id=${encodeURIComponent(row.id)}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '20px 10px',
              borderRadius: 14,
              background: tintFor(idx),
              textDecoration: 'none',
              color: 'var(--ink)',
              border: '1px solid var(--hairline)',
              minHeight: 110,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
              {emojiFor(row.slug)}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {row.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
