import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { RightRail } from '@/components/chrome/right-rail'
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
  if (!session) redirect('/signin?next=/feed')

  const sp = await searchParams
  const scope: 'near-you' | 'following' | 'all' = sp.scope ?? 'near-you'
  const type = sp.type
  const city = sp.city
  const [sections, quests] = await Promise.all([
    getHomeFeedSections(city ? { scope, city } : { scope }),
    fetchQuestSummary(),
  ])

  const filteredSections = type
    ? sections.map((s) => ({ ...s, items: s.items.filter((i) => i.type === type) }))
    : sections

  const continueReading = sections[0]?.items[0] ?? null

  return (
    <>
      <WebHeader session={session} active="home" streak={quests?.streakDays ?? 0} />
      <main>
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

          <RightRail
            quests={quests}
            continueReading={continueReading}
            trendingTags={['konkan', 'monsoon', 'spiti', 'roadtrip', 'beachweekend']}
          />
        </div>
      </main>
      <WebFooter />
    </>
  )
}
