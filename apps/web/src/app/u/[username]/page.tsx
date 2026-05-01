import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchCreatorProfile } from '@/lib/api'
import { getSession } from '@/lib/session'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ContentCard } from '@/components/content/content-card'
import { FollowButton } from '@/components/social/follow-button'
import { GuestGate } from '@/components/reader/guest-gate'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const creator = await fetchCreatorProfile(username)
  if (!creator) notFound()

  const description = (creator.bio ?? '').slice(0, 160)

  return {
    title: `${creator.displayName} on CreatorHub`,
    description: description || `Discover travel from ${creator.displayName} on CreatorHub.`,
    openGraph: {
      title: `${creator.displayName} on CreatorHub`,
      description,
      images: creator.coverUrl
        ? [creator.coverUrl]
        : creator.avatarUrl
          ? [creator.avatarUrl]
          : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${creator.displayName} on CreatorHub`,
      description,
    },
    alternates: { canonical: `/u/${creator.username}` },
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
      url: `https://creatorhub.in/u/${c.username}`,
      sameAs: [
        c.links?.instagram ? `https://instagram.com/${c.links.instagram}` : null,
        c.links?.youtube ? c.links.youtube : null,
        c.links?.website ?? null,
      ].filter(Boolean),
    },
  }
}

export default async function CreatorMiniSitePage({ params }: Props) {
  const { username } = await params
  const [creator, session] = await Promise.all([fetchCreatorProfile(username), getSession()])

  if (!creator) notFound()

  const jsonLd = JSON.stringify(buildJsonLd(creator))
  const initials = creator.displayName.slice(0, 2).toUpperCase()
  const hasContent = (creator.content ?? []).length > 0

  return (
    <>
      <WebHeader session={session} active={null} />
      <script type="application/ld+json">{jsonLd}</script>

      <main>
        <section
          className={creator.coverUrl ? '' : 'ch-photo ch-photo--konkan'}
          style={{
            position: 'relative',
            height: 220,
            overflow: 'hidden',
          }}
        >
          {creator.coverUrl ? (
            <Image
              src={creator.coverUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          ) : null}
        </section>

        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 32px',
          }}
        >
          {/* Avatar + identity + actions — single row, compact */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 20,
              marginTop: -48,
              marginBottom: 18,
              flexWrap: 'wrap',
            }}
          >
            <div
              aria-hidden
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                background: creator.avatarUrl
                  ? 'var(--bg-muted)'
                  : 'linear-gradient(135deg, #d4b896, #a07c5a)',
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                fontSize: 32,
                border: '4px solid var(--surface)',
                boxShadow: 'var(--shadow-lg)',
                flex: '0 0 auto',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {creator.avatarUrl ? (
                <Image
                  src={creator.avatarUrl}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                initials
              )}
            </div>
            <div style={{ flex: '1 1 220px', paddingBottom: 4 }}>
              <h1
                className="ch-display"
                style={{
                  fontSize: 'clamp(26px, 3vw, 34px)',
                  color: 'var(--ink)',
                  marginBottom: 2,
                  lineHeight: 1.1,
                }}
              >
                {creator.displayName}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                @{creator.username} · {creator.vertical}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }}>
              <FollowButton
                creatorId={creator.id}
                creatorName={creator.displayName}
                initialFollowerCount={creator.followerCount}
                isAuthenticated={Boolean(session)}
              />
              <a
                href={`creatorhub://creator/${username}`}
                className="ch-btn ch-btn-ghost"
                style={{ fontSize: 13 }}
              >
                Open in app
              </a>
            </div>
          </div>

          {/* Single-line meta row — trust + stats together. Replaces the big
              stats cards, since "0 chapters / 0 followers" looked like an
              error state on a fresh profile. */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 22,
            }}
          >
            <TrustChip label="KYC verified" emphasised />
            <TrustChip label="Refund guaranteed" />
            <span style={{ width: 1, height: 18, background: 'var(--hairline)' }} aria-hidden />
            <MetaPill label="Chapters" value={String(creator.contentCount)} />
            <MetaPill label="Followers" value={formatCount(creator.followerCount)} />
            {creator.averageRating != null && (
              <MetaPill label="Rating" value={`★ ${creator.averageRating.toFixed(1)}`} />
            )}
          </div>

          {creator.bio && (
            <p
              style={{
                fontSize: 16,
                color: 'var(--ink-soft)',
                lineHeight: 1.55,
                maxWidth: 720,
                marginBottom: 28,
                fontFamily: 'var(--font-serif)',
              }}
            >
              {creator.bio}
            </p>
          )}

          {hasContent ? (
            <CreatorContentSection
              content={creator.content ?? []}
              isAuthenticated={Boolean(session)}
              creatorName={creator.displayName}
            />
          ) : (
            <EmptyState
              creatorName={creator.displayName}
              vertical={creator.vertical}
              {...(creator.links ? { links: creator.links } : {})}
            />
          )}
        </div>
      </main>

      <WebFooter />
    </>
  )
}

const PUBLIC_PREVIEW_COUNT = 6

function CreatorContentSection({
  content,
  isAuthenticated,
  creatorName,
}: {
  content: NonNullable<NonNullable<Awaited<ReturnType<typeof fetchCreatorProfile>>>['content']>
  isAuthenticated: boolean
  creatorName: string
}) {
  const visible = isAuthenticated ? content : content.slice(0, PUBLIC_PREVIEW_COUNT)
  const remaining = content.length - visible.length

  return (
    <section style={{ marginBottom: 80 }}>
      <h2
        className="ch-display"
        style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 20 }}
      >
        Recent chapters
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 28,
        }}
      >
        {visible.map((c) => (
          <ContentCard key={c.id} content={c} />
        ))}
      </div>
      {!isAuthenticated && remaining > 0 && (
        <GuestGate
          mode="redact"
          isAuthenticated={false}
          contextLabel={`See all ${String(content.length)} stories from ${creatorName}`}
          reason="Sign in to browse the full library — past trips, posts, and upcoming experiences."
          ctaLabel="Sign in to see all"
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 28,
              marginTop: 20,
            }}
          >
            {content.slice(PUBLIC_PREVIEW_COUNT, PUBLIC_PREVIEW_COUNT + 6).map((c) => (
              <ContentCard key={c.id} content={c} />
            ))}
          </div>
        </GuestGate>
      )}
    </section>
  )
}

/**
 * Dense, useful empty state for new creators. Replaces the 48px-padded
 * "First chapter coming soon" card that left a vast white block on a
 * profile with zero published content. Surfaces what we DO have — bio,
 * social links — and a "Notify me" affordance.
 */
function EmptyState({
  creatorName,
  vertical,
  links,
}: {
  creatorName: string
  vertical: string
  links?: { instagram?: string; youtube?: string; website?: string }
}) {
  const hasLinks = Boolean(links?.instagram ?? links?.youtube ?? links?.website)

  return (
    <section style={{ marginBottom: 80 }}>
      <div
        className="ch-card"
        style={{
          padding: 28,
          display: 'grid',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Coming soon
          </p>
          <h2
            className="ch-display"
            style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}
          >
            {creatorName} hasn’t published their first chapter yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
            Hit follow above to be notified the moment they publish their first{' '}
            {vertical === 'travel' ? 'trip, post, or live experience' : 'story'}.
          </p>
        </div>
        {hasLinks && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {links?.instagram && (
              <SocialPill href={`https://instagram.com/${links.instagram}`} label="Instagram" />
            )}
            {links?.youtube && <SocialPill href={links.youtube} label="YouTube" />}
            {links?.website && <SocialPill href={links.website} label="Website" />}
          </div>
        )}
      </div>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link
          href="/discover"
          style={{ fontSize: 13, color: 'var(--ink-muted)', textDecoration: 'underline' }}
        >
          Discover other creators →
        </Link>
      </div>
    </section>
  )
}

function SocialPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid var(--hairline)',
        background: 'var(--surface)',
        fontSize: 12.5,
        fontWeight: 500,
        color: 'var(--ink)',
        textDecoration: 'none',
      }}
    >
      {label} ↗
    </a>
  )
}

function TrustChip({ label, emphasised }: { label: string; emphasised?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        background: emphasised === true ? 'var(--primary-tint)' : 'var(--surface)',
        color: emphasised === true ? 'var(--primary-deep)' : 'var(--ink-soft)',
        border: '1px solid var(--hairline)',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {emphasised === true && (
        <span aria-hidden style={{ fontSize: 11, lineHeight: 1 }}>✓</span>
      )}
      {label}
    </span>
  )
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid var(--hairline)',
        background: 'var(--bg)',
        fontSize: 12.5,
      }}
    >
      <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{value}</span>
      <span style={{ color: 'var(--ink-muted)', fontSize: 11.5 }}>{label.toLowerCase()}</span>
    </span>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${String(Math.round(n / 1000))}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}
