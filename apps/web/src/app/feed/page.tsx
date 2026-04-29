import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { RightRail } from '@/components/chrome/right-rail'
import { GuestBanner, GuestRailCard } from '@/components/chrome/guest-rail-card'
import { SectionRail } from '@/components/content/section-rail'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { getSession } from '@/lib/session'
import { getHomeFeedSections, fetchQuestSummary } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ scope?: 'near-you' | 'following' | 'all'; type?: string; city?: string }>
}

const SCOPES = [
  { id: 'near-you' as const, label: 'Near you' },
  { id: 'following' as const, label: 'Following' },
  { id: 'all' as const, label: 'All' },
]

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'post', label: 'Posts' },
  { id: 'itinerary', label: 'Itineraries' },
  { id: 'experience', label: 'Experiences' },
  { id: 'event', label: 'Events' },
]

export default async function FeedPage({ searchParams }: Props) {
  const session = await getSession()
  const isGuest = !session

  const sp = await searchParams
  const scope: 'near-you' | 'following' | 'all' = sp.scope ?? 'near-you'
  const type = sp.type
  const city = sp.city
  const [sections, quests] = await Promise.all([
    getHomeFeedSections(city ? { scope, city } : { scope }),
    isGuest ? Promise.resolve(null) : fetchQuestSummary(),
  ])

  const filteredSections = type
    ? sections.map((s) => ({ ...s, items: s.items.filter((i) => i.type === type) }))
    : sections

  const continueReading = sections[0]?.items[0] ?? null

  return (
    <>
      {isGuest && <GuestBanner next="/feed" />}
      <WebHeader session={session} active="home" streak={quests?.streakDays ?? 0} />
      <main id="main-content">
        <div
          style={{
            position: 'sticky',
            top: 72,
            zIndex: 20,
            background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              padding: '12px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
              {SCOPES.map((s) => {
                const isActive = scope === s.id
                return (
                  <Link
                    key={s.id}
                    href={`/feed?scope=${s.id}${type !== undefined ? `&type=${type}` : ''}`}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'white' : 'var(--ink-soft)',
                      background: isActive ? 'var(--ink)' : 'transparent',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </Link>
                )
              })}
            </div>
            <div
              style={{
                width: 1,
                height: 22,
                background: 'var(--hairline)',
                flex: '0 0 auto',
              }}
            />
            <div style={{ display: 'flex', gap: 6, flex: '1 1 auto', overflowX: 'auto' }}>
              {FILTERS.map((f) => {
                const isActive = (type ?? 'all') === f.id
                const queryType = f.id === 'all' ? '' : `&type=${f.id}`
                return (
                  <Link
                    key={f.id}
                    href={`/feed?scope=${scope}${queryType}`}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--primary-deep)' : 'var(--ink-soft)',
                      background: isActive ? 'var(--primary-tint)' : 'transparent',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '32px 32px 80px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 296px',
            gap: 56,
            alignItems: 'start',
          }}
        >
          <div>
            {filteredSections.length === 0 ? (
              <div
                className="ch-card"
                style={{ padding: 64, textAlign: 'center', color: 'var(--ink-muted)' }}
              >
                <h2
                  className="ch-display"
                  style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 12 }}
                >
                  Nothing here yet
                </h2>
                <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>
                  Follow a few creators or explore by city to fill your feed.
                </p>
                <Link href="/discover" className="ch-btn ch-btn-primary">
                  Browse discover
                </Link>
              </div>
            ) : (
              filteredSections.map((section, i) => (
                <ScrollReveal key={section.id} delay={i * 0.05}>
                  <SectionRail section={section} variant={i === 0 ? 'rail' : 'grid'} />
                </ScrollReveal>
              ))
            )}
          </div>

          {isGuest ? (
            <aside
              style={{
                width: 296,
                flex: '0 0 296px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <GuestRailCard next="/feed" />
              {continueReading && (
                <div className="ch-card" style={{ padding: 16 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: 10,
                      display: 'block',
                    }}
                  >
                    Try this first
                  </span>
                  <Link
                    href={`/content/${continueReading.id}`}
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 16,
                        lineHeight: 1.3,
                        color: 'var(--ink)',
                      }}
                    >
                      {continueReading.title}
                    </div>
                    {continueReading.creator && (
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                        by {continueReading.creator.displayName}
                      </div>
                    )}
                  </Link>
                </div>
              )}
            </aside>
          ) : (
            <RightRail
              quests={quests}
              continueReading={continueReading}
              trendingTags={['konkan', 'monsoon', 'spiti', 'roadtrip', 'beachweekend']}
            />
          )}
        </div>
      </main>
      <WebFooter />
    </>
  )
}
