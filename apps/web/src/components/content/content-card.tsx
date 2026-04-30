import Link from 'next/link'
import Image from 'next/image'
import type { ContentCard as ContentCardModel } from '@/lib/api/types'
import { formatPrice } from '@/lib/format'
import { contentSlugId } from '@/lib/slug'

interface ContentCardProps {
  content: ContentCardModel
  variant?: 'default' | 'wide' | 'compact'
  /** When true, render hero photo at 16:9 aspect for editorial sections. */
  hero?: boolean
}

const PHOTO_KEYS: Record<string, string> = {
  konkan: 'konkan',
  spiti: 'spiti',
  ladakh: 'ladakh',
  goa: 'goa',
  monsoon: 'monsoon',
  hampi: 'hampi',
  bandra: 'bandra',
  matheran: 'matheran',
}

function pickPhoto(content: ContentCardModel): string {
  const lower = `${content.title} ${content.city ?? ''}`.toLowerCase()
  for (const [k] of Object.entries(PHOTO_KEYS)) {
    if (lower.includes(k)) return `ch-photo--${k}`
  }
  // Hash-based fallback so the same content keeps the same photo.
  const keys = Object.keys(PHOTO_KEYS)
  let hash = 0
  for (let i = 0; i < content.id.length; i++) {
    hash = (hash * 31 + content.id.charCodeAt(i)) | 0
  }
  return `ch-photo--${keys[Math.abs(hash) % keys.length] ?? 'konkan'}`
}

function typeLabel(type: ContentCardModel['type']): string {
  return { post: 'Post', itinerary: 'Itinerary', experience: 'Experience', event: 'Event' }[type]
}

/** Skip Next image optimizer for hosts not in next.config remotePatterns. */
function isExternalUnoptimized(url: string): boolean {
  try {
    const u = new URL(url)
    const allowed = [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'creatorhub.in',
    ]
    if (allowed.some((host) => u.host.endsWith(host))) return false
    if (
      u.host.endsWith('.googleusercontent.com') ||
      u.host.endsWith('.cloudfront.net') ||
      u.host.endsWith('.supabase.co') ||
      u.host === 'images.unsplash.com' ||
      u.host === 'plus.unsplash.com'
    ) {
      return false
    }
    return true
  } catch {
    return true
  }
}

export function ContentCard({ content, variant = 'default', hero = false }: ContentCardProps) {
  const photoClass = pickPhoto(content)
  const isCompact = variant === 'compact'
  const photoHeight = hero ? 280 : isCompact ? 140 : 200

  return (
    <Link
      href={`/content/${contentSlugId(content.title, content.id, content.slug)}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        className={`ch-photo ${content.coverImageUrl ? '' : photoClass}`}
        style={{ height: photoHeight, position: 'relative', overflow: 'hidden' }}
      >
        {content.coverImageUrl && (
          <Image
            src={content.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1240px) 33vw, 320px"
            style={{ objectFit: 'cover' }}
            unoptimized={isExternalUnoptimized(content.coverImageUrl)}
          />
        )}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 2 }}>
          <span className="ch-pill ch-pill-glass">{typeLabel(content.type)}</span>
          {content.isFree && <span className="ch-pill ch-pill-coral">Free</span>}
        </div>
        {!content.isFree && content.priceInPaisa > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              fontWeight: 600,
              color: 'white',
              background: 'rgba(20, 20, 24, 0.78)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 999,
              zIndex: 2,
            }}
          >
            {formatPrice(content.priceInPaisa, content.isFree)}
          </div>
        )}
      </div>

      <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3
          className="ch-display"
          style={{
            fontSize: hero ? 22 : 17,
            lineHeight: 1.25,
            color: 'var(--ink)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {content.title}
        </h3>

        {content.summary && !isCompact && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-muted)',
              lineHeight: 1.5,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {content.summary}
          </p>
        )}

        {/* Tag chips — small, max 2 to keep the card calm. */}
        {content.tags && content.tags.length > 0 && !isCompact && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {content.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'var(--surface-alt)',
                  color: 'var(--ink-soft)',
                  fontWeight: 500,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Creator strip with avatar — always visible, gives faces to the feed. */}
        {content.creator && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
            }}
          >
            <CardAvatar
              name={content.creator.displayName}
              url={content.creator.avatarUrl}
              size={24}
            />
            <span
              style={{
                fontSize: 12.5,
                color: 'var(--ink)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {content.creator.displayName}
            </span>
            {content.creator.isVerified && (
              <span
                aria-label="Verified"
                title="Verified creator"
                style={{ color: 'var(--primary)', fontSize: 12, lineHeight: 1 }}
              >
                ✓
              </span>
            )}
          </div>
        )}

        {/* Meta row: city · duration · rating · save count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--ink-muted)',
            marginTop: 4,
            flexWrap: 'wrap',
          }}
        >
          {content.city && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span aria-hidden style={{ color: 'var(--primary)' }}>●</span>
              {content.city}
            </span>
          )}
          {content.durationDays != null && content.durationDays > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>
                {content.durationDays}
                {content.durationDays === 1 ? ' day' : ' days'}
              </span>
            </>
          )}
          {content.rating != null && (
            <>
              <span aria-hidden>·</span>
              <span>★ {content.rating.toFixed(1)}</span>
            </>
          )}
          {content.saveCount != null && content.saveCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>
                {formatCount(content.saveCount)} saved
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${String(Math.round(n / 1000))}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function CardAvatar({ name, url, size }: { name: string; url: string | null; size: number }) {
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
        fontSize: size * 0.42,
        flex: '0 0 auto',
        overflow: 'hidden',
      }}
    >
      {url ? '' : initials || '?'}
    </div>
  )
}
