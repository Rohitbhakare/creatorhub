import type { Metadata } from 'next'
import Link from 'next/link'
import { StudioShell, EmptyState } from '@/components/chrome/studio-shell'
import { fetchStudioReviews } from '@/lib/api'
import { ReviewReplyForm } from './review-reply-form'

export const metadata: Metadata = {
  title: 'Reviews',
  robots: { index: false, follow: false },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function StudioReviewsPage() {
  const items = await fetchStudioReviews()

  return (
    <StudioShell kicker="Studio · Reviews" title="Reviews">
      {items.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          body="Reviews show up here after travellers complete one of your bookings — there's a 14-day blind window before both reviews go public, then your reply (if any) is locked in. Until your first booking lands, this stays empty."
          cta={
            <Link href="/studio/content" className="ch-btn ch-btn-ink">
              Manage your content
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((r) => (
            <article key={r.id} className="ch-card" style={{ padding: 24 }}>
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #d4b896, #a07c5a)',
                    color: 'white',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {r.reviewerName.slice(0, 2).toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                    {r.reviewerName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    {r.contentTitle} · {formatDate(r.createdAt)}
                  </div>
                </div>
                <div
                  aria-label={`Rated ${String(r.rating)} out of 5`}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 18,
                    color: 'var(--primary-text-bg)',
                  }}
                >
                  {'★'.repeat(r.rating)}
                  <span style={{ color: 'var(--hairline-strong)' }}>
                    {'★'.repeat(5 - r.rating)}
                  </span>
                </div>
              </header>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: 'var(--ink)',
                  margin: '0 0 16px',
                }}
              >
                {r.body}
              </p>
              <ReviewReplyForm reviewId={r.id} initialReply={r.reply} />
            </article>
          ))}
        </div>
      )}
    </StudioShell>
  )
}
