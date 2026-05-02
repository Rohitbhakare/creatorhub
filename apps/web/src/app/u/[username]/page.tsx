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
        {/* Hero: full-bleed cover with a subtle fade to content. The cover
            doubles as the brand photo when no `coverUrl` is set — uses a
            gradient class so a brand-new creator's profile still looks
            curated, not bare. */}
        <section
          className={creator.coverUrl ? '' : 'ch-photo ch-photo--konkan'}
          style={{
            position: 'relative',
            height: 'clamp(220px, 32vw, 360px)',
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
          {/* Fade-to-bg gradient — replaces the abrupt cover→avatar cut. */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 50%, color-mix(in srgb, var(--bg) 90%, transparent) 100%)',
            }}
          />
        </section>

        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 32px',
          }}
        >
          {/* Avatar — own row, dramatically positioned half-over-cover.
              Removed the previous "avatar + name on the same flex row"
              pattern which let the avatar visually overlap the name when
              the cover image was bright (caught 2026-05-02 QA). */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 20,
              marginTop: 'clamp(-72px, -8vw, -48px)',
              flexWrap: 'wrap',
            }}
          >
            <div
              aria-hidden
              style={{
                width: 'clamp(112px, 14vw, 144px)',
                height: 'clamp(112px, 14vw, 144px)',
                borderRadius: 999,
                background: creator.avatarUrl
                  ? 'var(--bg-muted)'
                  : 'linear-gradient(135deg, #d4b896, #a07c5a)',
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                fontSize: 'clamp(38px, 4vw, 48px)',
                border: '5px solid var(--surface)',
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
                  sizes="(max-width: 720px) 112px, 144px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                initials
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 8 }}>
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

          {/* Identity row — name and handle sit below the avatar so the
              cover image can never overlap the H1 again. */}
          <div style={{ marginTop: 18 }}>
            <h1
              className="ch-display"
              style={{
                fontSize: 'clamp(32px, 4.4vw, 48px)',
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                fontWeight: 600,
              }}
            >
              {creator.displayName}
            </h1>
            <div
              style={{
                fontSize: 14,
                color: 'var(--ink-muted)',
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontWeight: 500, color: 'var(--ink-soft)' }}>
                @{creator.username}
              </span>
              <span aria-hidden>·</span>
              <span style={{ textTransform: 'capitalize' }}>{creator.vertical}</span>
            </div>
          </div>

          {/* Trust + stats row. We hide zero-value stats so a brand-new
              profile doesn't read as "0 chapters / 0 followers" (looked
              like an error on the v3 mini-site). */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginTop: 18,
              marginBottom: 24,
            }}
          >
            <TrustChip label="KYC verified" emphasised />
            <TrustChip label="Refund guaranteed" />
            {(creator.contentCount > 0 ||
              creator.followerCount > 0 ||
              creator.averageRating != null) && (
              <span
                style={{ width: 1, height: 18, background: 'var(--hairline)' }}
                aria-hidden
              />
            )}
            {creator.contentCount > 0 && (
              <MetaPill label="Chapters" value={String(creator.contentCount)} />
            )}
            {creator.followerCount > 0 && (
              <MetaPill label="Followers" value={formatCount(creator.followerCount)} />
            )}
            {creator.averageRating != null && (
              <MetaPill label="Rating" value={`★ ${creator.averageRating.toFixed(1)}`} />
            )}
          </div>

          {creator.bio && (
            <p
              style={{
                fontSize: 17,
                color: 'var(--ink-soft)',
                lineHeight: 1.55,
                maxWidth: 720,
                marginBottom: 36,
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

  // Tease what *kind* of content this creator will publish — gives the
  // visitor reason to hit follow even with zero published chapters.
  const upcomingTeases =
    vertical === 'travel'
      ? [
          { kicker: 'Long-form', title: 'Trips', sub: 'Multi-day plans with stops + stays' },
          { kicker: 'Short-form', title: 'Posts', sub: 'Photos and notes from the road' },
          { kicker: 'Live', title: 'Experiences', sub: 'Walks, workshops, host-led plans' },
        ]
      : [
          { kicker: 'Long-form', title: 'Essays', sub: 'Photo + narrative pieces' },
          { kicker: 'Short-form', title: 'Posts', sub: 'Quick stories from the field' },
          { kicker: 'Live', title: 'Events', sub: 'Meetups + reading nights' },
        ]

  return (
    <section style={{ marginBottom: 80 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--primary-tint)',
            color: 'var(--primary-deep)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span aria-hidden style={{ fontSize: 8, lineHeight: 1 }}>●</span>
          New voice
        </span>
        <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
          {creatorName} just joined CreatorHub
        </span>
      </div>
      <h2
        className="ch-display"
        style={{
          fontSize: 'clamp(24px, 3vw, 30px)',
          color: 'var(--ink)',
          margin: '0 0 10px',
          letterSpacing: '-0.01em',
          fontWeight: 600,
        }}
      >
        First chapter, coming soon.
      </h2>
      <p
        style={{
          fontSize: 15,
          color: 'var(--ink-soft)',
          lineHeight: 1.55,
          maxWidth: 580,
          marginBottom: 28,
        }}
      >
        Follow now to get the moment they publish — usually within a week of joining.
        We&rsquo;ll only ping you for new posts, never for stuff you didn&rsquo;t ask for.
      </p>

      {/* Teaser cards — what this creator can/will publish. Three small
          cards instead of one giant empty card. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: hasLinks ? 32 : 16,
        }}
      >
        {upcomingTeases.map((t) => (
          <div
            key={t.title}
            className="ch-card"
            style={{ padding: 18, display: 'grid', gap: 4 }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
              }}
            >
              {t.kicker}
            </span>
            <span
              className="ch-display"
              style={{ fontSize: 18, color: 'var(--ink)', fontWeight: 600 }}
            >
              {t.title}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4 }}>
              {t.sub}
            </span>
          </div>
        ))}
      </div>

      {hasLinks && (
        <>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              margin: '0 0 10px',
            }}
          >
            Find {creatorName.split(' ')[0]} on
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {links?.instagram && (
              <SocialPill href={`https://instagram.com/${links.instagram}`} label="Instagram" />
            )}
            {links?.youtube && <SocialPill href={links.youtube} label="YouTube" />}
            {links?.website && <SocialPill href={links.website} label="Website" />}
          </div>
        </>
      )}

      <div
        style={{
          paddingTop: 20,
          borderTop: '1px solid var(--hairline)',
          textAlign: 'center',
        }}
      >
        <Link
          href="/discover"
          style={{
            fontSize: 13,
            color: 'var(--ink-soft)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
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
