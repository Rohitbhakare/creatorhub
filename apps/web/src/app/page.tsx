import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { RightRail } from '@/components/chrome/right-rail'
import { GuestBanner, GuestRailCard } from '@/components/chrome/guest-rail-card'
import { SectionRail } from '@/components/content/section-rail'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { getSession } from '@/lib/session'
import { fetchPopularCities, fetchQuestSummary, getHomeFeedSections } from '@/lib/api'

export const metadata: Metadata = {
  title: 'CreatorHub — Travel stories worth saving',
  description:
    'Discover authentic travel stories, itineraries, and live experiences from local creators across India.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'CreatorHub — Travel stories worth saving',
    description:
      'Discover authentic travel stories, itineraries, and live experiences from local creators across India.',
    type: 'website',
  },
}

interface Props {
  searchParams: Promise<{
    scope?: 'near-you' | 'following' | 'all'
    type?: string
    city?: string
  }>
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

export default async function HomePage({ searchParams }: Props) {
  const session = await getSession()
  const isGuest = !session

  const sp = await searchParams
  const scope: 'near-you' | 'following' | 'all' = sp.scope ?? 'near-you'
  const type = sp.type
  const city = sp.city

  const [sections, quests, cities] = await Promise.all([
    getHomeFeedSections(city ? { scope, city } : { scope }),
    isGuest ? Promise.resolve(null) : fetchQuestSummary(),
    isGuest ? fetchPopularCities() : Promise.resolve([]),
  ])

  const filteredSections = type
    ? sections.map((s) => ({ ...s, items: s.items.filter((i) => i.type === type) }))
    : sections

  const continueReading = sections[0]?.items[0] ?? null

  return (
    <>
      {isGuest && <GuestBanner next="/" />}
      <WebHeader session={session} active="home" streak={quests?.streakDays ?? 0} />

      {isGuest && <GuestHeroStrip />}

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
                const guestDisabled = isGuest && s.id === 'following'
                const isActive = scope === s.id && !guestDisabled
                const href = guestDisabled
                  ? '/signin?next=/'
                  : `/?scope=${s.id}${type !== undefined ? `&type=${type}` : ''}`
                return (
                  <Link
                    key={s.id}
                    href={href}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive
                        ? 'white'
                        : guestDisabled
                          ? 'var(--ink-faint)'
                          : 'var(--ink-soft)',
                      background: isActive ? 'var(--ink)' : 'transparent',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                    {guestDisabled && (
                      <span style={{ marginLeft: 4, fontSize: 11 }}>· sign in</span>
                    )}
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
                    href={`/?scope=${scope}${queryType}`}
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
                  Try a different filter, or browse Discover for the full library.
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

            {isGuest && cities.length > 0 && (
              <ScrollReveal>
                <section style={{ marginTop: 80 }}>
                  <h2
                    className="ch-display"
                    style={{
                      fontSize: 'clamp(24px, 3.5vw, 32px)',
                      color: 'var(--ink)',
                      marginBottom: 16,
                    }}
                  >
                    Explore by city
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cities.slice(0, 16).map((c) => (
                      <Link
                        key={c.name}
                        href={`/discover?city=${encodeURIComponent(c.name)}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 16px',
                          borderRadius: 999,
                          border: '1px solid var(--hairline)',
                          background: 'var(--surface)',
                          fontSize: 13.5,
                          color: 'var(--ink)',
                          textDecoration: 'none',
                        }}
                      >
                        <span aria-hidden style={{ color: 'var(--primary)' }}>
                          ●
                        </span>
                        {c.name}
                        {c.count > 0 && (
                          <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                            {String(c.count)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
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
              <GuestRailCard next="/" />
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

function GuestHeroStrip() {
  return (
    <section
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--hairline)',
        padding: '32px 32px 28px',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            display: 'block',
            marginBottom: 12,
          }}
        >
          CreatorHub · Spring 2026
        </span>
        <h1
          className="ch-display"
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.05,
            maxWidth: 880,
          }}
        >
          Travel stories <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>worth</em>{' '}
          saving — chapters, itineraries, and live experiences from creators across India.
        </h1>
      </div>
    </section>
  )
}
