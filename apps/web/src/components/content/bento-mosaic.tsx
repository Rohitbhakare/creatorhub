import Link from 'next/link'
import Image from 'next/image'
import type { ContentCard as ContentCardModel } from '@/lib/api/types'
import { formatPrice } from '@/lib/format'
import { contentSlugId } from '@/lib/slug'

interface BentoMosaicProps {
  /**
   * Up to 8 items. Top mosaic (4 items: 1 large feature + 1 tall + 2 small)
   * + optional bottom row of 4 cards below. v3 magazine layout.
   */
  items: ContentCardModel[]
  kicker?: string
  title?: string
  seeAllHref?: string
  /** Optional total-count for the "Browse all N →" link. Falls back to "Browse all →". */
  seeAllCount?: number
}

/**
 * Asymmetric 4-col × 2-row mosaic. Mirrors the W3 wireframe bento:
 *   ┌───────────────┬──────┬──────┐
 *   │   FEATURE     │ TALL │ SMALL│
 *   │   2×2         │ 1×2  │  1×1 │
 *   │               │      ├──────┤
 *   │               │      │ SMALL│
 *   └───────────────┴──────┴──────┘
 */
export function BentoMosaic({ items, kicker, title, seeAllHref, seeAllCount }: BentoMosaicProps) {
  if (items.length === 0) return null

  const [feature, tall, small1, small2] = [items[0], items[1], items[2], items[3]]
  const bottomRow = items.slice(4, 8)

  return (
    <section style={{ marginTop: 56 }}>
      {(title ?? kicker) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 18,
            gap: 16,
          }}
        >
          <div>
            {kicker && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {kicker}
              </span>
            )}
            {title && (
              <h2
                className="ch-display"
                style={{
                  fontSize: 'clamp(24px, 3vw, 30px)',
                  color: 'var(--ink)',
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {title}
              </h2>
            )}
          </div>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1.5px solid var(--primary)',
                paddingBottom: 2,
              }}
            >
              {seeAllCount != null ? `Browse all ${String(seeAllCount)} →` : 'Browse all →'}
            </Link>
          )}
        </header>
      )}

      <div className="ch-bento-grid">
        {feature && (
          <BentoTile
            content={feature}
            placement="feature"
            className="ch-bento-feature"
            style={{ gridColumn: 'span 2', gridRow: 'span 2' }}
          />
        )}
        {tall && (
          <BentoTile
            content={tall}
            placement="tall"
            className="ch-bento-tall"
            style={{ gridRow: 'span 2' }}
          />
        )}
        {small1 && <BentoTile content={small1} placement="small" />}
        {small2 && <BentoTile content={small2} placement="small" />}
      </div>

      {bottomRow.length > 0 && (
        <div className="ch-bento-bottom-row">
          {bottomRow.map((item) => (
            <BentoBottomCard key={item.id} content={item} />
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Card-style tile for the bento bottom row — photo on top, text below.
 * Distinct from BentoTile (which is full-bleed photo with overlay text)
 * because v3's bottom row reads as a 4-card hand-off into the section
 * rails below it — softer, scannable.
 */
function BentoBottomCard({ content }: { content: ContentCardModel }) {
  const photoClass = pickPhoto(content)
  return (
    <Link
      href={`/content/${contentSlugId(content.title, content.id, content.slug)}`}
      className="ch-bento-bottom-card"
    >
      <div
        className={`ch-photo ${content.coverImageUrl ? '' : photoClass}`}
        style={{ position: 'relative', height: 150, borderRadius: 0 }}
      >
        {content.coverImageUrl && (
          <Image
            src={content.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1080px) 50vw, 290px"
            style={{ objectFit: 'cover' }}
            unoptimized={isExternalUnoptimized(content.coverImageUrl)}
          />
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <span className="ch-pill ch-pill-glass">{typeLabel(content.type)}</span>
        </div>
      </div>
      <div style={{ padding: '14px 14px 16px' }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1.3,
            marginBottom: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {content.title}
        </div>
        {content.creator && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
            {content.creator.displayName}
            {content.priceInPaisa > 0 ? ` · ${formatPrice(content.priceInPaisa, content.isFree)}` : ''}
          </div>
        )}
      </div>
    </Link>
  )
}

interface BentoTileProps {
  content: ContentCardModel
  placement: 'feature' | 'tall' | 'small'
  style?: React.CSSProperties
  className?: string
}

function BentoTile({ content, placement, style, className }: BentoTileProps) {
  const photoClass = pickPhoto(content)
  const titleSize =
    placement === 'feature' ? 'clamp(22px, 2.4vw, 28px)' : placement === 'tall' ? 18 : 15
  const padding = placement === 'feature' ? 22 : 14
  const showCreator = placement !== 'small'

  return (
    <Link
      href={`/content/${contentSlugId(content.title, content.id, content.slug)}`}
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        ...(style ?? {}),
      }}
    >
      <div
        className={`ch-photo ${content.coverImageUrl ? '' : photoClass}`}
        style={{ position: 'absolute', inset: 0, borderRadius: 0 }}
      >
        {content.coverImageUrl && (
          <Image
            src={content.coverImageUrl}
            alt=""
            fill
            sizes={
              placement === 'feature'
                ? '(max-width: 1080px) 100vw, 620px'
                : placement === 'tall'
                  ? '(max-width: 1080px) 50vw, 320px'
                  : '(max-width: 1080px) 50vw, 240px'
            }
            style={{ objectFit: 'cover' }}
            unoptimized={isExternalUnoptimized(content.coverImageUrl)}
          />
        )}
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            placement === 'feature'
              ? 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)'
              : 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: padding,
          left: padding,
          display: 'flex',
          gap: 6,
          zIndex: 2,
        }}
      >
        <span className="ch-pill ch-pill-glass">{typeLabel(content.type)}</span>
        {content.isFree && <span className="ch-pill ch-pill-coral">Free</span>}
        {!content.isFree && placement === 'feature' && content.priceInPaisa > 0 && (
          <span className="ch-pill ch-pill-coral">
            {formatPrice(content.priceInPaisa, content.isFree)}
          </span>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: padding,
          right: padding,
          bottom: padding,
          color: 'white',
          zIndex: 2,
        }}
      >
        {content.city && placement === 'feature' && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.85,
              marginBottom: 8,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            {content.city}
            {content.durationDays != null && content.durationDays > 0
              ? ` · ${String(content.durationDays)} days`
              : ''}
          </div>
        )}
        <h3
          className="ch-display"
          style={{
            margin: 0,
            fontSize: titleSize,
            color: 'white',
            lineHeight: 1.1,
            fontWeight: 600,
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            display: '-webkit-box',
            WebkitLineClamp: placement === 'small' ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {content.title}
        </h3>
        {showCreator && content.creator && (
          <div
            style={{
              fontSize: placement === 'feature' ? 13 : 11.5,
              opacity: 0.92,
              marginTop: placement === 'feature' ? 12 : 6,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            {content.creator.displayName}
            {!content.isFree && content.priceInPaisa > 0 && placement !== 'feature' && (
              <span> · {formatPrice(content.priceInPaisa, content.isFree)}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function typeLabel(t: ContentCardModel['type']): string {
  return { post: 'Story', itinerary: 'Itinerary', experience: 'Experience', event: 'Event' }[t]
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
