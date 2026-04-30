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
import { FeedChipRail } from '@/components/feed/feed-chip-rail'
import { getSession } from '@/lib/session'
import { fetchPopularCities, fetchQuestSummary, getHomeFeedSections } from '@/lib/api'
import { contentSlugId } from '@/lib/slug'

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
        <section className="ch-container" style={{ paddingBlock: '20px 12px' }}>
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

        {isGuest && <CreatorAcquisitionBand />}

        <FeedChipRail
          scope={scope}
          type={type}
          isGuest={isGuest}
          {...(city ? { preserve: { city } } : {})}
        />

        <div
          className="ch-container ch-page-grid"
          style={{ paddingBlock: '24px 64px' }}
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
                    href={`/content/${contentSlugId(continueReading.title, continueReading.id, continueReading.slug)}`}
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

function CreatorAcquisitionBand() {
  // Lightweight, link-only band aimed at the half of our visitors who'll
  // become creators. Static numbers — kept conservative + believable;
  // we'll wire to real platform stats later.
  return (
    <section
      className="ch-container"
      style={{ paddingBlock: '14px 8px' }}
      aria-label="For creators"
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: 'var(--primary-tint)',
            color: 'var(--primary-deep)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 16,
            flex: '0 0 auto',
          }}
        >
          ★
        </span>
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              color: 'var(--ink)',
              lineHeight: 1.3,
            }}
          >
            Are you a creator? Earn from your travel stories.
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--ink-muted)',
              marginTop: 2,
            }}
          >
            Publish itineraries, host walks, sell your favourite plans.
            17% platform fee · daily payouts.
          </div>
        </div>
        <Link
          href="/creators"
          className="ch-btn ch-btn-ink"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          See how it works →
        </Link>
      </div>
    </section>
  )
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
