import Link from 'next/link'
import { contentSlugId } from '@/lib/slug'
import type { ContentCard } from '@/lib/api/types'

export interface ContinueReadingItem {
  content: ContentCard
  /** 0..1 fraction of the story read. */
  progress: number
  /** Human-readable position label, e.g. "Ch. 2 of 4 · Velas at first light". */
  position?: string | null
}

interface ContinueReadingRailProps {
  items: ContinueReadingItem[]
}

/**
 * v3 "pick up where you left off" rail — 3-card horizontal layout for
 * itineraries the user has partially read. Authed-only; renders null
 * when items is empty (e.g. for guests, new users, or until the
 * `user_content_progress` API surface ships).
 *
 * Per WEB-FEED-FR-025 (11-section feed), this sits between the magazine
 * bands and the section rails on `/`. Coral usage: progress-bar fill
 * (allow-list spot 6: user state).
 *
 * TODO(api): a `GET /api/v1/users/me/continue-reading` endpoint would
 * source this rail from `user_content_progress`. Until that ships, the
 * caller passes [] and this component is silent.
 */
export function ContinueReadingRail({ items }: ContinueReadingRailProps) {
  if (items.length === 0) return null
  return (
    <section
      aria-label="Continue reading"
      style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--primary)',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Pick up where you left off
          </div>
          <h2
            className="ch-display"
            style={{
              margin: 0,
              fontSize: 'clamp(20px, 2.4vw, 26px)',
              color: 'var(--ink)',
              letterSpacing: '-0.015em',
            }}
          >
            {items.length === 1 ? 'One story' : `${String(items.length)} stories`}{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>
              {items.length === 1 ? 'half-read' : 'half-read'}
            </em>
          </h2>
        </div>
      </header>
      <div className="ch-continue-rail">
        {items.map((item) => {
          const pct = Math.round(Math.max(0, Math.min(1, item.progress)) * 100)
          const photoClass = pickPhoto(item.content.title)
          return (
            <Link
              key={item.content.id}
              href={`/content/${contentSlugId(item.content.title, item.content.id, item.content.slug)}`}
              className="ch-continue-card"
            >
              <div
                className={`ch-photo ${photoClass}`}
                style={{
                  width: 92,
                  height: 92,
                  flex: '0 0 92px',
                  borderRadius: 'var(--radius-md)',
                  backgroundImage: item.content.coverImageUrl
                    ? `url(${item.content.coverImageUrl})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                aria-hidden
              />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minWidth: 0,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      lineHeight: 1.25,
                      marginBottom: 4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.content.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginBottom: 8 }}>
                    {item.content.creator?.displayName}
                    {item.position ? ` · ${item.position}` : ''}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 999,
                      background: 'var(--surface-alt)',
                      overflow: 'hidden',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${String(pct)}%`,
                        background: 'var(--primary)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--ink-muted)',
                      fontWeight: 600,
                    }}
                  >
                    <span>{String(pct)}% read</span>
                    <span>continue →</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function pickPhoto(title: string): string {
  const lower = title.toLowerCase()
  const candidates = ['konkan', 'spiti', 'monsoon', 'goa', 'ladakh', 'hampi', 'matheran', 'bandra']
  for (const c of candidates) if (lower.includes(c)) return `ch-photo--${c}`
  return 'ch-photo--konkan'
}
