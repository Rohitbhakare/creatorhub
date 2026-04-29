import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchCreatorProfile } from '@/lib/api'
import { getSession } from '@/lib/session'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ContentCard } from '@/components/content/content-card'
import { FollowButton } from '@/components/social/follow-button'

interface Props {
  params: Promise<{ vertical: string; username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const creator = await fetchCreatorProfile(username)
  if (!creator) return { title: 'Creator not found' }

  const description = (creator.bio ?? '').slice(0, 160)

  return {
    title: `${creator.displayName} on CreatorHub`,
    description: description || `Discover travel from ${creator.displayName} on CreatorHub.`,
    openGraph: {
      title: `${creator.displayName} on CreatorHub`,
      description,
      images: creator.avatarUrl ? [creator.avatarUrl] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${creator.displayName} on CreatorHub`,
      description,
    },
    alternates: { canonical: `/${creator.vertical}/${creator.username}` },
  }
}

function buildJsonLd(c: NonNullable<Awaited<ReturnType<typeof fetchCreatorProfile>>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: c.displayName,
      alternateName: `@${c.username}`,
      description: c.bio ?? undefined,
      image: c.avatarUrl ?? undefined,
      url: `https://creatorhub.in/${c.vertical}/${c.username}`,
      sameAs: [
        c.links?.instagram ? `https://instagram.com/${c.links.instagram}` : null,
        c.links?.youtube ? c.links.youtube : null,
        c.links?.website ?? null,
      ].filter(Boolean),
    },
  }
}

export default async function CreatorMiniSitePage({ params }: Props) {
  const { username, vertical } = await params
  const [creator, session] = await Promise.all([fetchCreatorProfile(username), getSession()])

  if (!creator) notFound()

  // Suppress unused warning — vertical kept in route for SEO + canonical
  void vertical

  const jsonLd = JSON.stringify(buildJsonLd(creator))
  const initials = creator.displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <WebHeader session={session} active={null} />
      <script type="application/ld+json">{jsonLd}</script>

      <main>
        <section
          className="ch-photo ch-photo--konkan"
          style={{
            position: 'relative',
            height: 320,
            borderRadius: 0,
          }}
        >
          <div className="ch-photo-overlay" />
        </section>

        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '0 32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 24,
              marginTop: -64,
              marginBottom: 32,
              flexWrap: 'wrap',
            }}
          >
            <div
              aria-hidden
              style={{
                width: 128,
                height: 128,
                borderRadius: 999,
                background: 'linear-gradient(135deg, #d4b896, #a07c5a)',
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                fontSize: 44,
                border: '4px solid var(--surface)',
                boxShadow: 'var(--shadow-lg)',
                flex: '0 0 auto',
              }}
            >
              {initials}
            </div>
            <div style={{ flex: '1 1 auto', paddingBottom: 8 }}>
              <h1
                className="ch-display"
                style={{ fontSize: 40, color: 'var(--ink)', marginBottom: 4 }}
              >
                {creator.displayName}
              </h1>
              <div style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
                @{creator.username} · {creator.vertical}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <FollowButton
                creatorId={creator.id}
                isAuthenticated={Boolean(session)}
              />
              <a
                href={`creatorhub://creator/${username}`}
                className="ch-btn ch-btn-ghost"
              >
                Open in app
              </a>
            </div>
          </div>

          {creator.bio && (
            <p
              style={{
                fontSize: 17,
                color: 'var(--ink-soft)',
                lineHeight: 1.6,
                maxWidth: 720,
                marginBottom: 32,
                fontFamily: 'var(--font-serif)',
              }}
            >
              {creator.bio}
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 16,
              marginBottom: 56,
              maxWidth: 720,
            }}
          >
            <Stat label="Chapters" value={creator.contentCount.toString()} />
            <Stat
              label="Followers"
              value={Intl.NumberFormat('en-IN', { notation: 'compact' }).format(
                creator.followerCount,
              )}
            />
            {creator.averageRating != null && (
              <Stat label="Rating" value={`★ ${creator.averageRating.toFixed(1)}`} />
            )}
          </div>

          {(creator.content ?? []).length > 0 ? (
            <section style={{ marginBottom: 80 }}>
              <h2
                className="ch-display"
                style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 24 }}
              >
                Recent chapters
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 32,
                }}
              >
                {(creator.content ?? []).map((c) => (
                  <ContentCard key={c.id} content={c} />
                ))}
              </div>
            </section>
          ) : (
            <div
              className="ch-card"
              style={{
                padding: 48,
                textAlign: 'center',
                color: 'var(--ink-muted)',
                marginBottom: 80,
              }}
            >
              First chapter coming soon — follow to be notified.
            </div>
          )}
        </div>
      </main>

      <WebFooter />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ch-card" style={{ padding: 16 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div className="ch-display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  )
}
