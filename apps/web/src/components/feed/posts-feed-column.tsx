import Link from 'next/link'
import Image from 'next/image'
import { InitialAvatar } from '@/components/ui/initial-avatar'
import { contentSlugId } from '@/lib/slug'
import type { ContentCard } from '@/lib/api/types'

interface PostsFeedColumnProps {
  items: ContentCard[]
}

/**
 * v3 Posts feed mode — when `?type=post` is active, the home renders this
 * instead of the magazine layout. WEB-FEED-FR-026: centered single-column,
 * 640px max-width, full-bleed cover photo per card, 3-line caption clamp,
 * Instagram-style reading rhythm.
 *
 * No client interactivity here — save/like buttons are server links to
 * the content detail (existing pattern). Optimistic save flips would
 * require T11's Server Action + a client wrapper around each card; out
 * of scope for the initial layout pass.
 */
export function PostsFeedColumn({ items }: PostsFeedColumnProps) {
  if (items.length === 0) {
    return (
      <section style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
          No posts yet. Check back soon — or switch to the full magazine view.
        </p>
        <Link
          href="/"
          className="ch-btn ch-btn-ghost"
          style={{ marginTop: 16, padding: '8px 16px', display: 'inline-flex' }}
        >
          ← Back to magazine
        </Link>
      </section>
    )
  }

  return (
    <section
      aria-label="Posts feed"
      style={{ maxWidth: 640, margin: '24px auto 0', padding: '0 16px' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h1
          className="ch-display"
          style={{ fontSize: 22, color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em' }}
        >
          Posts
        </h1>
        <Link
          href="/"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink-muted)',
            textDecoration: 'none',
          }}
        >
          ← Magazine
        </Link>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
        {items.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </ul>
    </section>
  )
}

function PostItem({ post }: { post: ContentCard }) {
  const photoClass = pickPhoto(post.title)
  const href = `/content/${contentSlugId(post.title, post.id, post.slug)}`
  return (
    <li>
      <article style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Header: avatar + creator + relative time */}
        {post.creator && (
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
            }}
          >
            <InitialAvatar
              name={post.creator.displayName}
              url={post.creator.avatarUrl ?? null}
              size={32}
            />
            <Link
              href={`/u/${post.creator.username}`}
              style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}
            >
              {post.creator.displayName}
            </Link>
            {post.city && (
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginLeft: 'auto' }}>
                {post.city}
              </span>
            )}
          </header>
        )}

        {/* Cover photo — full bleed, max 4:5 aspect */}
        <Link href={href} style={{ display: 'block', position: 'relative', paddingBottom: '125%' /* 4:5 */ }}>
          <div
            className={`ch-photo ${post.coverImageUrl ? '' : photoClass}`}
            style={{ position: 'absolute', inset: 0, borderRadius: 0 }}
          >
            {post.coverImageUrl && (
              <Image
                src={post.coverImageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                style={{ objectFit: 'cover' }}
              />
            )}
          </div>
        </Link>

        {/* Body — title + 3-line summary clamp */}
        <div style={{ padding: '14px 16px 16px' }}>
          <Link
            href={href}
            style={{
              display: 'block',
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.25,
              marginBottom: 6,
              textDecoration: 'none',
            }}
          >
            {post.title}
          </Link>
          {post.summary && (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                lineHeight: 1.65,
                color: 'var(--ink-soft)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {post.summary}
            </p>
          )}
          {post.summary && post.summary.length > 200 && (
            <Link
              href={href}
              style={{
                display: 'inline-block',
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1.5px solid var(--primary)',
                paddingBottom: 1,
              }}
            >
              Show all →
            </Link>
          )}
        </div>
      </article>
    </li>
  )
}

function pickPhoto(title: string): string {
  const lower = title.toLowerCase()
  const candidates = ['konkan', 'spiti', 'monsoon', 'goa', 'ladakh', 'hampi', 'matheran', 'bandra']
  for (const c of candidates) if (lower.includes(c)) return `ch-photo--${c}`
  return 'ch-photo--konkan'
}
