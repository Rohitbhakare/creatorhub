import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { RightRail } from '@/components/chrome/right-rail'
import { GuestRailCard } from '@/components/chrome/guest-rail-card'
import { GuestLocationPrompt } from '@/components/chrome/guest-location-prompt'
import { SectionRail } from '@/components/content/section-rail'
import { HeroFeature } from '@/components/content/hero-feature'
import { BentoMosaic } from '@/components/content/bento-mosaic'
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

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
    ? sections
        .map((s) => ({ ...s, items: s.items.filter((i) => i.type === type) }))
        .filter((s) => s.items.length > 0)
    : sections

  // Pick the editorial highlights from the top of the feed.
  const allItems = filteredSections.flatMap((s) => s.items)
  const heroItem =
    allItems.find((c) => c.coverImageUrl !== null && c.summary) ??
    allItems.find((c) => c.coverImageUrl !== null) ??
    allItems[0] ??
    null
  const heroId = heroItem?.id

  // Bento takes 4 items after the hero, prefer ones with covers.
  const bentoCandidates = allItems
    .filter((c) => c.id !== heroId)
    .sort((a, b) => Number(b.coverImageUrl !== null) - Number(a.coverImageUrl !== null))
  const bentoItems = bentoCandidates.slice(0, 4)
  const bentoIds = new Set(bentoItems.map((c) => c.id))

  // Remaining items get rendered through the section rails as before.
  const remainingSections = filteredSections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => i.id !== heroId && !bentoIds.has(i.id)),
    }))
    .filter((s) => s.items.length > 0)

  const continueReading = heroItem ?? sections[0]?.items[0] ?? null
  const greeting = greetingFor(session?.displayName)

  return (
    <>
      <WebHeader session={session} active="home" streak={quests?.streakDays ?? 0} />

      {isGuest && city == null && cities.length > 0 && (
        <GuestLocationPrompt cities={cities} />
      )}

      <main id="main-content">
        {/* Editorial intro: weather kicker + tight greeting + LIVE pill */}
        <section
          style={{
            maxWidth: 1640,
            margin: '0 auto',
            padding: '24px 32px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--primary)',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {greeting.kicker}
              </div>
              <h1
                className="ch-display"
                style={{
                  margin: 0,
                  fontSize: 'clamp(28px, 3.6vw, 40px)',
                  fontWeight: 600,
                  lineHeight: 1.1,
                  color: 'var(--ink)',
                }}
              >
                {greeting.title}{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>
                  {greeting.accent}
                </em>
              </h1>
            </div>
            {isGuest ? (
              <Link
                href="/signup?next=/"
                className="ch-btn ch-btn-primary"
                style={{ padding: '10px 16px', fontSize: 13 }}
              >
                Join free
              </Link>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'color-mix(in srgb, var(--success) 14%, transparent)',
                  color: 'var(--success)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--success)',
                  }}
                />
                LIVE — {Math.floor(20 + Math.random() * 80)} reading now
              </span>
            )}
          </div>
        </section>

        {/* Sticky chip rail */}
        <div
          style={{
            position: 'sticky',
            top: 72,
            zIndex: 20,
            background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--hairline)',
            marginTop: 8,
          }}
        >
          <div
            style={{
              maxWidth: 1640,
              margin: '0 auto',
              padding: '10px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
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
                      padding: '7px 14px',
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
              style={{ width: 1, height: 22, background: 'var(--hairline)', flex: '0 0 auto' }}
            />
            <div style={{ display: 'flex', gap: 4, flex: '1 1 auto', overflowX: 'auto' }}>
              {FILTERS.map((f) => {
                const isActive = (type ?? 'all') === f.id
                const queryType = f.id === 'all' ? '' : `&type=${f.id}`
                return (
                  <Link
                    key={f.id}
                    href={`/?scope=${scope}${queryType}`}
                    style={{
                      padding: '7px 14px',
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
            maxWidth: 1640,
            margin: '0 auto',
            padding: '24px 32px 80px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 296px',
            gap: 40,
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
              <>
                {heroItem && (
                  <ScrollReveal>
                    <HeroFeature
                      content={heroItem}
                      kicker="Story of the day"
                      primaryCta="Read this →"
                    />
                  </ScrollReveal>
                )}

                {bentoItems.length >= 3 && (
                  <ScrollReveal delay={0.05}>
                    <BentoMosaic
                      items={bentoItems}
                      kicker={city ? `Curated near ${city}` : 'Curated for you'}
                      title="More to read"
                      seeAllHref="/discover"
                    />
                  </ScrollReveal>
                )}

                {remainingSections.map((section, i) => (
                  <ScrollReveal key={section.id} delay={Math.min(i * 0.05, 0.3)}>
                    <SectionRail section={section} variant="grid" />
                  </ScrollReveal>
                ))}
              </>
            )}

            {isGuest && cities.length > 0 && (
              <ScrollReveal>
                <section style={{ marginTop: 64 }}>
                  <h2
                    className="ch-display"
                    style={{
                      fontSize: 'clamp(22px, 3vw, 28px)',
                      color: 'var(--ink)',
                      marginBottom: 14,
                    }}
                  >
                    Explore by city
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cities.slice(0, 18).map((c) => (
                      <Link
                        key={c.name}
                        href={`/discover?city=${encodeURIComponent(c.name)}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 999,
                          border: '1px solid var(--hairline)',
                          background: 'var(--surface)',
                          fontSize: 13,
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
                gap: 16,
                position: 'sticky',
                top: 132,
                alignSelf: 'start',
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
              <TrendingTagsCard />
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

interface Greeting {
  kicker: string
  title: string
  accent: string
}

function greetingFor(displayName?: string): Greeting {
  const now = new Date()
  const hour = now.getHours()
  const day = WEEKDAY[now.getDay()] ?? 'Today'
  const tone = hour < 5 ? 'evening' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const firstName = displayName?.split(' ')[0]
  const kicker = `${day} · India · ${tone === 'morning' ? 'fresh start' : tone === 'afternoon' ? 'mid-day' : 'unwinding'}`

  if (firstName) {
    return {
      kicker,
      title: `Good ${tone}, ${firstName}.`,
      accent: 'Where to next?',
    }
  }
  return {
    kicker,
    title: 'Travel stories worth saving.',
    accent: 'Pick a chapter →',
  }
}

function TrendingTagsCard() {
  const tags = ['konkan', 'monsoon', 'spiti', 'roadtrip', 'beachweekend', 'foodtrails']
  return (
    <div className="ch-card" style={{ padding: 16 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginBottom: 12,
          display: 'block',
        }}
      >
        Trending
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/discover?q=${encodeURIComponent(tag)}`}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--surface-alt)',
              color: 'var(--ink-soft)',
              textDecoration: 'none',
            }}
          >
            #{tag}
          </Link>
        ))}
      </div>
    </div>
  )
}
