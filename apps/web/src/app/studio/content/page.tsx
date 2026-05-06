import type { Metadata } from 'next'
import Link from 'next/link'
import { StudioShell, EmptyState } from '@/components/chrome/studio-shell'
import { fetchStudioContents } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { contentSlugId } from '@/lib/slug'

export const metadata: Metadata = {
  title: 'Content',
  robots: { index: false, follow: false },
}

const STATUS_COLOR: Record<string, string> = {
  published: 'var(--success)',
  draft: 'var(--ink-muted)',
  archived: 'var(--ink-faint)',
  rejected: 'var(--danger)',
}

const TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  itinerary: 'Itinerary',
  experience: 'Experience',
  event: 'Event',
}

export default async function StudioContentPage() {
  const items = await fetchStudioContents()

  // Round-6 audit B5: when there are zero items, the empty-state's
  // "Start publishing" CTA is the focal action — don't double up with a
  // "+ New" button in the header. Show "+ New" only once the creator
  // has at least one piece of content (the table-vs-empty branch).
  const isEmpty = items.length === 0
  return (
    <StudioShell
      kicker="Studio · Content"
      title="Your stories"
      {...(isEmpty
        ? {}
        : {
            actions: (
              <Link href="/publish" className="ch-btn ch-btn-primary">
                + New
              </Link>
            ),
          })}
    >
      {isEmpty ? (
        <EmptyState
          title="Publish your first chapter"
          body="Once you publish, this table fills up with views, saves, and bookings."
          cta={
            <Link href="/publish" className="ch-btn ch-btn-primary">
              Start publishing
            </Link>
          }
        />
      ) : (
        <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) 110px 110px repeat(3, 90px) 100px',
              gap: 16,
              padding: '14px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              borderBottom: '1px solid var(--hairline)',
              background: 'var(--surface-alt)',
            }}
          >
            <span>Title</span>
            <span>Type</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Views</span>
            <span style={{ textAlign: 'right' }}>Saves</span>
            <span style={{ textAlign: 'right' }}>Bookings</span>
            <span style={{ textAlign: 'right' }}>Price</span>
          </div>
          {items.map((c, i) => (
            <Link
              key={c.id}
              href={`/content/${contentSlugId(c.title, c.id, c.slug)}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) 110px 110px repeat(3, 90px) 100px',
                gap: 16,
                padding: '14px 20px',
                fontSize: 13,
                color: 'var(--ink)',
                textDecoration: 'none',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.title}
              </span>
              <span style={{ color: 'var(--ink-muted)' }}>{TYPE_LABELS[c.type] ?? c.type}</span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: STATUS_COLOR[c.status],
                }}
              >
                {c.status}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--ink-soft)' }}>
                {Intl.NumberFormat('en-IN', { notation: 'compact' }).format(c.views)}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--ink-soft)' }}>
                {Intl.NumberFormat('en-IN', { notation: 'compact' }).format(c.saves)}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--ink-soft)' }}>
                {Intl.NumberFormat('en-IN', { notation: 'compact' }).format(c.bookings)}
              </span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-serif)', fontSize: 14 }}>
                {formatPrice(c.priceInPaisa, c.isFree)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </StudioShell>
  )
}
