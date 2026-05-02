import Link from 'next/link'
import Image from 'next/image'
import type { ContentCard as ContentCardModel } from '@/lib/api/types'
import { formatPrice } from '@/lib/format'
import { contentSlugId } from '@/lib/slug'

interface HeroFeatureProps {
  content: ContentCardModel
  /** Showed before the title in mono kicker — e.g. 'CHAPTER · COASTAL'. */
  kicker?: string
  /** Optional pull-quote / one-liner on the narrative side. */
  pullQuote?: string
  /** "Read all 4 chapters →" CTA label. */
  primaryCta?: string
  /** Override link target (defaults to /content/{id}). */
  href?: string
}

/**
 * Big feature card: photo left (1.3fr) + narrative right (1fr) at desktop,
 * stacks at narrow widths. Used at the top of the home feed (per W3 hero
 * chapter card in the v3 wireframes).
 */
export function HeroFeature({
  content,
  kicker,
  pullQuote,
  primaryCta,
  href,
}: HeroFeatureProps) {
  const photoClass = pickPhoto(content)
  const target = href ?? `/content/${contentSlugId(content.title, content.id, content.slug)}`
  const summary = pullQuote ?? content.summary ?? ''
  const meta = formatMeta(content)

  return (
    <Link
      href={target}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 0,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        boxShadow: 'var(--shadow-md)',
        textDecoration: 'none',
        color: 'inherit',
        minHeight: 360,
      }}
      className="ch-hero-feature"
    >
      <div
        className={`ch-photo ${content.coverImageUrl ? '' : photoClass}`}
        style={{
          position: 'relative',
          minHeight: 360,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {content.coverImageUrl && (
          <Image
            src={content.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 1080px) 100vw, 720px"
            style={{ objectFit: 'cover' }}
            unoptimized={isExternalUnoptimized(content.coverImageUrl)}
            priority
          />
        )}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            display: 'flex',
            gap: 6,
            zIndex: 2,
          }}
        >
          <span className="ch-pill ch-pill-coral">★ Featured</span>
          <span className="ch-pill ch-pill-glass">{typeLabel(content.type)}</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            bottom: 22,
            color: 'white',
            zIndex: 2,
          }}
        >
          {meta && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                opacity: 0.85,
                marginBottom: 8,
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              {meta}
            </div>
          )}
          <h2
            className="ch-display"
            style={{
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              color: 'white',
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 600,
              maxWidth: '95%',
              textShadow: '0 2px 12px rgba(0,0,0,0.35)',
            }}
          >
            {content.title}
          </h2>
          {content.creator && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 12,
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.92)',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              <Avatar name={content.creator.displayName} url={content.creator.avatarUrl} size={28} />
              {content.creator.displayName}
              {content.rating != null && (
                <span style={{ opacity: 0.7 }}>· ★ {content.rating.toFixed(1)}</span>
              )}
              {content.saveCount != null && content.saveCount > 0 && (
                <span style={{ opacity: 0.7 }}>· {String(content.saveCount)} saves</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: '32px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--surface)',
          gap: 20,
        }}
      >
        <div>
          {/* Kicker — always shows. Falls back to type + city if no explicit
              kicker was passed. Keeps the right panel from feeling empty. */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--primary-text-bg)',
              display: 'block',
              marginBottom: 14,
            }}
          >
            {kicker ?? defaultKicker(content)}
          </span>
          <h3
            className="ch-display"
            style={{
              fontSize: 'clamp(22px, 2.4vw, 28px)',
              color: 'var(--ink)',
              lineHeight: 1.12,
              marginBottom: 14,
              letterSpacing: '-0.015em',
            }}
          >
            {content.title}
          </h3>
          {summary ? (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 17,
                lineHeight: 1.55,
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                fontWeight: 400,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              &ldquo;{summary}&rdquo;
            </p>
          ) : (
            // No summary in DB — show a structured editorial line so the
            // right panel still has body copy. WHAT this content is + WHY
            // it's here (featured/curated).
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--ink-soft)',
                margin: 0,
              }}
            >
              {fallbackBlurb(content)}
            </p>
          )}

          {/* Meta row — duration, distance, rating, save count. Only shows
              what we have data for; renders nothing on empty rather than a
              ghost row. */}
          {hasMetaStats(content) && (
            <div
              style={{
                marginTop: 18,
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-muted)',
                fontWeight: 600,
                letterSpacing: '0.06em',
              }}
            >
              {content.durationDays != null && content.durationDays > 0 && (
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{String(content.durationDays)}</strong>{' '}
                  {content.durationDays === 1 ? 'day' : 'days'}
                </span>
              )}
              {content.distanceKm != null && content.distanceKm > 0 && (
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{String(content.distanceKm)}</strong> km
                </span>
              )}
              {content.rating != null && (
                <span>
                  <strong style={{ color: 'var(--ink)' }}>★ {content.rating.toFixed(1)}</strong>
                </span>
              )}
              {content.saveCount != null && content.saveCount > 0 && (
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{String(content.saveCount)}</strong>{' '}
                  saves
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom row — byline + price + primary CTA. Always renders the
            byline if we have a creator, so the right panel always has a
            human signal. */}
        <div>
          {content.creator && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid var(--hairline)',
              }}
            >
              <Avatar
                name={content.creator.displayName}
                url={content.creator.avatarUrl ?? null}
                size={32}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                  {content.creator.displayName}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                  {bylineSecondary(content)}
                </div>
              </div>
              {!content.isFree && content.priceInPaisa > 0 && (
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 17,
                    color: 'var(--ink)',
                    fontWeight: 600,
                  }}
                >
                  {formatPrice(content.priceInPaisa, content.isFree)}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span
              className="ch-btn ch-btn-ink"
              style={{ padding: '12px 20px', fontSize: 13.5, flex: '0 0 auto' }}
            >
              {primaryCta ?? readCta(content)}
            </span>
            <span
              className="ch-btn ch-btn-ghost"
              style={{ padding: '12px 16px', fontSize: 13.5, flex: '0 0 auto' }}
              aria-hidden
            >
              <BookmarkIcon /> Save
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function defaultKicker(c: ContentCardModel): string {
  const parts: string[] = []
  parts.push(typeLabel(c.type).toUpperCase())
  if (c.city) parts.push(c.city.toUpperCase())
  if (c.isFree) parts.push('FREE')
  return parts.join(' · ')
}

function fallbackBlurb(c: ContentCardModel): string {
  const type = typeLabel(c.type).toLowerCase()
  if (c.city && c.durationDays != null && c.durationDays > 0) {
    const dayWord = c.durationDays === 1 ? 'day' : 'days'
    return `A ${String(c.durationDays)}-${dayWord.replace(/s$/, '')} ${type} from ${c.city}, hand-picked by the editors this week.`
  }
  if (c.city) {
    return `A ${type} from ${c.city}, hand-picked by the editors this week.`
  }
  return `A ${type} hand-picked by the editors this week.`
}

function hasMetaStats(c: ContentCardModel): boolean {
  return (
    (c.durationDays != null && c.durationDays > 0) ||
    (c.distanceKm != null && c.distanceKm > 0) ||
    c.rating != null ||
    (c.saveCount != null && c.saveCount > 0)
  )
}

function bylineSecondary(c: ContentCardModel): string {
  const parts: string[] = []
  if (c.tags && c.tags.length > 0) {
    parts.push(c.tags.slice(0, 2).map((t) => `#${t}`).join(' '))
  } else if (c.viewCount != null && c.viewCount > 0) {
    parts.push(`${formatCount(c.viewCount)} reads`)
  } else {
    parts.push('Creator on CreatorHub')
  }
  return parts.join(' · ')
}

function readCta(c: ContentCardModel): string {
  if (c.type === 'experience') return 'Book this →'
  if (c.type === 'event') return 'See details →'
  return 'Read this →'
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${String(Math.round(n / 1000))}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function BookmarkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function Avatar({ name, url, size }: { name: string; url: string | null; size: number }) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: url ? 'transparent' : 'linear-gradient(135deg, #d4b896, #a07c5a)',
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-serif)',
        fontWeight: 600,
        fontSize: size * 0.4,
        flex: '0 0 auto',
        overflow: 'hidden',
      }}
    >
      {url ? '' : initials || '?'}
    </div>
  )
}

function typeLabel(t: ContentCardModel['type']): string {
  return { post: 'Story', itinerary: 'Itinerary', experience: 'Experience', event: 'Event' }[t]
}

function formatMeta(c: ContentCardModel): string {
  const parts: string[] = []
  if (c.city) parts.push(c.city)
  if (c.durationDays != null && c.durationDays > 0) {
    parts.push(`${String(c.durationDays)} ${c.durationDays === 1 ? 'day' : 'days'}`)
  }
  return parts.join(' · ')
}

function pickPhoto(content: ContentCardModel): string {
  const lower = `${content.title} ${content.city ?? ''}`.toLowerCase()
  const candidates = [
    'konkan',
    'spiti',
    'monsoon',
    'goa',
    'ladakh',
    'hampi',
    'matheran',
    'bandra',
  ]
  for (const c of candidates) if (lower.includes(c)) return `ch-photo--${c}`
  let hash = 0
  for (let i = 0; i < content.id.length; i++) {
    hash = (hash * 31 + content.id.charCodeAt(i)) | 0
  }
  return `ch-photo--${candidates[Math.abs(hash) % candidates.length] ?? 'konkan'}`
}

function isExternalUnoptimized(url: string): boolean {
  try {
    const u = new URL(url)
    if (
      u.host.endsWith('googleusercontent.com') ||
      u.host.endsWith('cloudfront.net') ||
      u.host.endsWith('supabase.co') ||
      u.host === 'firebasestorage.googleapis.com' ||
      u.host === 'storage.googleapis.com' ||
      u.host === 'images.unsplash.com' ||
      u.host === 'plus.unsplash.com' ||
      u.host === 'creatorhub.in'
    ) {
      return false
    }
    return true
  } catch {
    return true
  }
}
