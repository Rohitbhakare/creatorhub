import Link from 'next/link'
import type { Metadata } from 'next'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ContentCard } from '@/components/content/content-card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { getSession } from '@/lib/session'
import { getHomeFeedSections, fetchPopularCities } from '@/lib/api'

export const metadata: Metadata = {
  title: 'CreatorHub — Travel Stories Worth Saving',
  description:
    'Discover travel stories, itineraries, and live experiences from local creators across India. Save what inspires, book what calls.',
  openGraph: {
    title: 'CreatorHub — Travel Stories Worth Saving',
    description:
      'Discover travel stories, itineraries, and live experiences from local creators across India.',
    type: 'website',
  },
  alternates: { canonical: '/' },
}

const HERO_CHAPTER = {
  photo: 'ch-photo--konkan',
  title: 'Konkan in 4 quiet days',
  creator: 'Aarav · @aaravnomad',
  chapter: 'Chapter · Coastal',
}

const MOODS = [
  { label: 'Coastal calm', subtitle: 'Beaches, slow towns' },
  { label: 'Mountain quiet', subtitle: 'Trails, high altitudes' },
  { label: 'City wander', subtitle: 'Food, art, late-night' },
  { label: 'Monsoon green', subtitle: 'Rain, waterfalls, mist' },
]

export default async function HomePage() {
  const [session, sections, cities] = await Promise.all([
    getSession(),
    getHomeFeedSections({ scope: 'all' }),
    fetchPopularCities(),
  ])

  const preview = sections.slice(0, 3)

  return (
    <>
      <WebHeader session={session} active={null} />

      <main id="main-content">
        <section style={{ padding: '40px 32px 0', maxWidth: 1240, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: 56,
              alignItems: 'center',
              minHeight: 540,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  display: 'block',
                  marginBottom: 18,
                }}
              >
                {HERO_CHAPTER.chapter} · 2026 Spring
              </span>
              <h1
                className="ch-display"
                style={{
                  fontSize: 'clamp(40px, 6vw, 72px)',
                  color: 'var(--ink)',
                  marginBottom: 20,
                }}
              >
                Travel stories{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>worth</em> saving.
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: 'var(--ink-soft)',
                  lineHeight: 1.55,
                  maxWidth: 480,
                  marginBottom: 28,
                }}
              >
                Discover real travel from people who&rsquo;ve been there — chapters, itineraries, and
                live experiences across India. Save what inspires. Book what calls.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  href={session ? '/feed' : '/signup'}
                  className="ch-btn ch-btn-primary"
                  style={{ padding: '14px 22px', fontSize: 14.5 }}
                >
                  {session ? 'Open feed' : 'Get started · free'}
                </Link>
                <Link
                  href="/discover"
                  className="ch-btn ch-btn-ghost"
                  style={{ padding: '14px 22px', fontSize: 14.5 }}
                >
                  Browse stories
                </Link>
              </div>
              <div
                style={{
                  marginTop: 36,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 12,
                  color: 'var(--ink-muted)',
                  flexWrap: 'wrap',
                }}
              >
                <span>★ 4.9 from 2,400+ travelers</span>
                <span aria-hidden>·</span>
                <span>UPI · Refund guarantee · GST included</span>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div
                className={`ch-photo ${HERO_CHAPTER.photo}`}
                style={{
                  aspectRatio: '4/5',
                  height: 'auto',
                  width: '100%',
                  borderRadius: 24,
                }}
              >
                <div className="ch-photo-overlay" />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    right: 24,
                    color: 'white',
                  }}
                >
                  <span className="ch-pill ch-pill-glass">{HERO_CHAPTER.chapter}</span>
                  <h2
                    className="ch-display"
                    style={{
                      fontSize: 32,
                      color: 'white',
                      marginTop: 12,
                      lineHeight: 1.15,
                    }}
                  >
                    {HERO_CHAPTER.title}
                  </h2>
                  <span style={{ fontSize: 13, opacity: 0.9 }}>{HERO_CHAPTER.creator}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ScrollReveal as="section">
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              padding: '80px 32px 0',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
                display: 'block',
                marginBottom: 16,
              }}
            >
              Find your mood
            </span>
            <h2
              className="ch-display"
              style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--ink)', marginBottom: 32 }}
            >
              What kind of travel calls you?
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {MOODS.map((mood) => (
                <Link
                  key={mood.label}
                  href={`/discover?q=${encodeURIComponent(mood.label)}`}
                  className="ch-card"
                  style={{
                    padding: 24,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    className="ch-display"
                    style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}
                  >
                    {mood.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{mood.subtitle}</div>
                </Link>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
          {preview.map((section) => (
            <ScrollReveal key={section.id} as="section">
              <div style={{ marginTop: 80 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                    gap: 16,
                  }}
                >
                  <div>
                    {section.subtitle && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-muted)',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        {section.subtitle}
                      </span>
                    )}
                    <h2
                      className="ch-display"
                      style={{
                        fontSize: 'clamp(26px, 3.5vw, 36px)',
                        color: 'var(--ink)',
                        margin: 0,
                        lineHeight: 1.1,
                      }}
                    >
                      {section.title}
                    </h2>
                  </div>
                  <Link
                    href={`/discover?section=${encodeURIComponent(section.id)}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      textDecoration: 'none',
                    }}
                  >
                    See all →
                  </Link>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 32,
                  }}
                >
                  {section.items.slice(0, 4).map((item) => (
                    <ContentCard key={item.id} content={item} />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {cities.length > 0 && (
          <ScrollReveal as="section">
            <div style={{ maxWidth: 1240, margin: '0 auto', padding: '80px 32px 0' }}>
              <h2
                className="ch-display"
                style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', color: 'var(--ink)', marginBottom: 24 }}
              >
                Explore by city
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {cities.slice(0, 18).map((c) => (
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
                    <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        <section
          style={{
            marginTop: 100,
            padding: '80px 32px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--hairline)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2
              className="ch-display"
              style={{ fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--ink)', marginBottom: 16 }}
            >
              Stories worth saving.
              <br />
              <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>Trips worth booking.</em>
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'var(--ink-muted)',
                lineHeight: 1.55,
                marginBottom: 28,
              }}
            >
              Free to browse, free to save, free to follow. Pay only when you book a paid experience.
            </p>
            <Link
              href={session ? '/feed' : '/signup'}
              className="ch-btn ch-btn-primary"
              style={{ padding: '14px 28px', fontSize: 15 }}
            >
              {session ? 'Open feed' : 'Join free'}
            </Link>
          </div>
        </section>
      </main>

      <WebFooter big />
    </>
  )
}
