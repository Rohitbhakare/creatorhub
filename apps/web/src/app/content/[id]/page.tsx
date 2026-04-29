import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchContentDetail, formatPrice } from '@/lib/api'
import { getSession } from '@/lib/session'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ReadingProgress } from '@/components/reader/reading-progress'
import { SaveButton } from '@/components/reader/save-button'
import { BookCta } from '@/components/reader/book-cta'
import { MarkdownBody } from '@/components/reader/markdown-body'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const content = await fetchContentDetail(id)
  if (!content) return { title: 'Content not found' }

  const description = (content.description ?? content.body ?? '').slice(0, 160)

  return {
    title: content.title,
    description: description || `Read this ${content.type} on CreatorHub.`,
    openGraph: {
      title: content.title,
      description,
      images: content.coverImageUrl ? [content.coverImageUrl] : [],
      type: 'article',
      authors: [content.creator.displayName],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description,
      images: content.coverImageUrl ? [content.coverImageUrl] : [],
    },
    alternates: { canonical: `/content/${id}` },
  }
}

const TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  itinerary: 'Itinerary',
  experience: 'Experience',
  event: 'Event',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function pickPhoto(title: string): string {
  const lower = title.toLowerCase()
  const candidates = ['konkan', 'spiti', 'monsoon', 'goa', 'ladakh', 'hampi', 'matheran', 'bandra']
  for (const c of candidates) if (lower.includes(c)) return c
  return 'konkan'
}

function buildJsonLd(
  content: NonNullable<Awaited<ReturnType<typeof fetchContentDetail>>>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': content.type === 'event' ? 'Event' : 'Article',
    headline: content.title,
    description: content.description ?? content.body?.slice(0, 200) ?? '',
    image: content.coverImageUrl,
    author: {
      '@type': 'Person',
      name: content.creator.displayName,
      url: `https://creatorhub.in/${content.creator.vertical}/${content.creator.username}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CreatorHub',
      logo: { '@type': 'ImageObject', url: 'https://creatorhub.in/logo.png' },
    },
    ...(content.startsAt ? { startDate: content.startsAt } : {}),
    ...(content.endsAt ? { endDate: content.endsAt } : {}),
    ...(content.priceInPaisa > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: content.priceInPaisa / 100,
            priceCurrency: 'INR',
          },
        }
      : {}),
  }
}

export default async function ContentDetailPage({ params }: Props) {
  const { id } = await params
  const [content, session] = await Promise.all([fetchContentDetail(id), getSession()])

  if (!content) notFound()

  const isAuthenticated = Boolean(session)
  const photoClass = `ch-photo--${pickPhoto(content.title)}`
  const jsonLdString = JSON.stringify(buildJsonLd(content))

  return (
    <>
      <ReadingProgress />
      <WebHeader session={session} active={null} />

      <script type="application/ld+json">{jsonLdString}</script>

      <main>
        <section
          className={`ch-photo ${photoClass}`}
          style={{
            position: 'relative',
            height: '70vh',
            minHeight: 480,
            borderRadius: 0,
            margin: 0,
          }}
        >
          <div className="ch-photo-overlay" />
          <div
            style={{
              position: 'absolute',
              bottom: 48,
              left: 0,
              right: 0,
              padding: '0 32px',
              maxWidth: 1240,
              margin: '0 auto',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <span className="ch-pill ch-pill-glass">{TYPE_LABELS[content.type]}</span>
              {!content.isFree && (
                <span className="ch-pill ch-pill-coral">
                  {formatPrice(content.priceInPaisa, content.isFree)}
                </span>
              )}
              {content.isFree && <span className="ch-pill ch-pill-coral">Free</span>}
            </div>
            <h1
              className="ch-display"
              style={{
                fontSize: 'clamp(40px, 6vw, 72px)',
                color: 'white',
                lineHeight: 1.05,
                maxWidth: 880,
                marginBottom: 20,
              }}
            >
              {content.title}
            </h1>
            <Link
              href={`/${content.creator.vertical}/${content.creator.username}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                color: 'white',
                textDecoration: 'none',
                opacity: 0.92,
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #d4b896, #a07c5a)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {content.creator.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {content.creator.displayName}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>@{content.creator.username}</div>
              </div>
            </Link>
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 12,
                fontSize: 13,
                opacity: 0.85,
                flexWrap: 'wrap',
              }}
            >
              {content.durationDays != null && content.durationDays > 0 && (
                <span>{String(content.durationDays)} days</span>
              )}
              {content.distanceKm != null && content.distanceKm > 0 && (
                <span>· {String(content.distanceKm)} km</span>
              )}
              {content.rating != null && <span>· ★ {content.rating.toFixed(1)}</span>}
              {content.startsAt && <span>· Starts {formatDate(content.startsAt)}</span>}
            </div>
          </div>
        </section>

        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '64px 32px 80px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 56,
            alignItems: 'start',
          }}
        >
          <article
            style={{
              fontFamily: 'var(--font-serif)',
              maxWidth: 720,
            }}
          >
            {content.description && (
              <p
                style={{
                  fontSize: 22,
                  color: 'var(--ink-soft)',
                  fontStyle: 'italic',
                  borderLeft: '2px solid var(--primary)',
                  paddingLeft: 20,
                  margin: '0 0 32px',
                  lineHeight: 1.5,
                }}
              >
                {content.description}
              </p>
            )}
            {content.body ? (
              <MarkdownBody body={content.body} />
            ) : (
              <p
                style={{
                  color: 'var(--ink-muted)',
                  fontSize: 16,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Open this on the app to read the full chapter.
              </p>
            )}

            {content.spots && content.spots.length > 0 && (
              <section style={{ marginTop: 64 }}>
                <h2
                  className="ch-display"
                  style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 24 }}
                >
                  Stops along the way
                </h2>
                <ol
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {content.spots.map((spot, i) => (
                    <li
                      key={spot.id}
                      className="ch-card"
                      style={{
                        padding: 16,
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr',
                        gap: 16,
                        alignItems: 'start',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          background: 'var(--primary-tint)',
                          color: 'var(--primary-deep)',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 600,
                          fontFamily: 'var(--font-serif)',
                          fontSize: 16,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: 18,
                            color: 'var(--ink)',
                          }}
                        >
                          {spot.name}
                        </div>
                        {spot.description && (
                          <p
                            style={{
                              fontSize: 14,
                              color: 'var(--ink-muted)',
                              marginTop: 4,
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {spot.description}
                          </p>
                        )}
                        {spot.distanceFromPreviousKm != null && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--ink-faint)',
                              marginTop: 6,
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {String(spot.distanceFromPreviousKm)} km from previous
                            {spot.durationFromPreviousMin != null
                              ? ` · ${String(spot.durationFromPreviousMin)} min`
                              : ''}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div
              style={{
                marginTop: 64,
                paddingTop: 32,
                borderTop: '1px solid var(--hairline)',
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <SaveButton contentId={content.id} isAuthenticated={isAuthenticated} />
              <Link
                href={`/${content.creator.vertical}/${content.creator.username}`}
                className="ch-btn ch-btn-ghost"
              >
                More from {content.creator.displayName}
              </Link>
            </div>
          </article>

          <aside style={{ position: 'sticky', top: 96 }}>
            <BookCta
              contentId={content.id}
              contentType={content.type}
              priceInPaisa={content.priceInPaisa}
              isFree={content.isFree}
              scheduledDates={content.scheduledDates ?? []}
              isAuthenticated={isAuthenticated}
            />
          </aside>
        </div>
      </main>

      <WebFooter />
    </>
  )
}
