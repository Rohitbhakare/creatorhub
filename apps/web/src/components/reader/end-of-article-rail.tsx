import Link from 'next/link'
import { ContentCard } from '@/components/content/content-card'
import type { ContentCard as ContentCardModel } from '@/lib/api/types'
import { apiFetchPublic } from '@/lib/api-client'
import { listOf, transformContentCard } from '@/lib/api/transforms'

interface Props {
  /** The current content's id — excluded from "More from creator" results. */
  currentContentId: string
  creatorId: string
  creatorDisplayName: string
  creatorVertical: string
  creatorUsername: string
  /** City slug for the "Discover more in {city}" rail. */
  city?: string | null
  /** Show the join-CreatorHub panel — true for guests only. */
  showJoinPanel: boolean
}

const REVALIDATE = 300

/**
 * Two rails + a tasteful join panel that close out a guest article.
 * Replaces the always-on GuestPromptBar with a more substantive,
 * contextual finish — gives the reader a clear "what next" instead of
 * a passive nag.
 */
export async function EndOfArticleRail({
  currentContentId,
  creatorId,
  creatorDisplayName,
  creatorVertical,
  creatorUsername,
  city,
  showJoinPanel,
}: Props) {
  const [moreFromCreator, moreInCity] = await Promise.all([
    fetchCreatorContent(creatorId, currentContentId),
    city ? fetchCityContent(city, currentContentId) : Promise.resolve([]),
  ])

  const hasCreatorRail = moreFromCreator.length > 0
  const hasCityRail = moreInCity.length > 0
  if (!hasCreatorRail && !hasCityRail && !showJoinPanel) return null

  return (
    <section
      style={{
        marginTop: 64,
        paddingTop: 32,
        borderTop: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        gap: 48,
      }}
    >
      {hasCreatorRail && (
        <div>
          <header
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 16,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <h2
              className="ch-display"
              style={{
                fontSize: 'clamp(20px, 2.6vw, 26px)',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              More from {creatorDisplayName}
            </h2>
            <Link
              href={`/${creatorVertical}/${creatorUsername}`}
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
          </header>
          <Grid items={moreFromCreator} />
        </div>
      )}

      {hasCityRail && (
        <div>
          <header
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 16,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <h2
              className="ch-display"
              style={{
                fontSize: 'clamp(20px, 2.6vw, 26px)',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Discover more in {city}
            </h2>
            <Link
              href={`/discover?city=${encodeURIComponent(city ?? '')}`}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1.5px solid var(--primary)',
                paddingBottom: 2,
              }}
            >
              Browse {city} →
            </Link>
          </header>
          <Grid items={moreInCity} />
        </div>
      )}

      {showJoinPanel && (
        <aside
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--hairline)',
            borderRadius: 18,
            padding: 'clamp(24px, 4vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
            }}
          >
            Join free
          </span>
          <h3
            className="ch-display"
            style={{
              fontSize: 'clamp(22px, 3vw, 30px)',
              color: 'var(--ink)',
              margin: 0,
              maxWidth: 520,
              lineHeight: 1.2,
            }}
          >
            Save stories, follow creators, book the trips that move you.
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 520,
            }}
          >
            Free · 30 seconds · no spam. Pick up where you left off, and
            unlock day-by-day plans + booking on every story.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <Link
              href="/signup"
              className="ch-btn ch-btn-primary"
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              Join CreatorHub
            </Link>
            <Link
              href="/signin"
              className="ch-btn ch-btn-ghost"
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              Sign in
            </Link>
          </div>
        </aside>
      )}
    </section>
  )
}

function Grid({ items }: { items: ContentCardModel[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 24,
      }}
    >
      {items.slice(0, 3).map((c) => (
        <ContentCard key={c.id} content={c} variant="compact" />
      ))}
    </div>
  )
}

async function fetchCreatorContent(
  creatorId: string,
  excludeId: string,
): Promise<ContentCardModel[]> {
  try {
    const data = await apiFetchPublic<unknown>(
      `/api/v1/content?user_id=${encodeURIComponent(creatorId)}&limit=8`,
      { next: { revalidate: REVALIDATE } },
    )
    if (!data) return []
    const raw = (data as { items?: unknown }).items ?? data
    const items = listOf(raw, transformContentCard)
    return items.filter((c) => c.id !== excludeId).slice(0, 3)
  } catch {
    return []
  }
}

async function fetchCityContent(
  city: string,
  excludeId: string,
): Promise<ContentCardModel[]> {
  try {
    const data = await apiFetchPublic<unknown>(
      `/api/v1/feed/hot-near-you?city=${encodeURIComponent(city)}`,
      { next: { revalidate: REVALIDATE } },
    )
    if (!data) return []
    const raw = Array.isArray(data) ? data : (data as { items?: unknown }).items ?? data
    const items = listOf(raw, transformContentCard)
    return items.filter((c) => c.id !== excludeId).slice(0, 3)
  } catch {
    return []
  }
}
