import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchContentDetail, formatPrice } from '@/lib/api'
import { contentSlugId, extractContentId } from '@/lib/slug'
import { getSession } from '@/lib/session'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ReadingProgress } from '@/components/reader/reading-progress'
import { SaveButton } from '@/components/reader/save-button'
import { BookCta } from '@/components/reader/book-cta'
import { MarkdownBody } from '@/components/reader/markdown-body'
import { ParallaxHero } from '@/components/reader/parallax-hero'
import { StickyDayNav } from '@/components/reader/sticky-day-nav'
import { AnimatedMap } from '@/components/reader/animated-map'
import { LikeButton } from '@/components/social/like-button'
import { ShareButton } from '@/components/social/share-button'
import { CommentsSection } from '@/components/reader/comments-section'
import { EndOfArticleRail } from '@/components/reader/end-of-article-rail'
import { GuestGate } from '@/components/reader/guest-gate'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params
  const id = extractContentId(rawId)
  if (!id) return { title: 'Content not found' }
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
    alternates: {
      canonical: `/content/${contentSlugId(content.title, content.id, content.slug)}`,
    },
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

function hasItinerary(c: NonNullable<Awaited<ReturnType<typeof fetchContentDetail>>>): boolean {
  return c.type === 'itinerary' && (c.spots ?? []).length > 0
}

function groupSpotsByDay(
  spots: NonNullable<NonNullable<Awaited<ReturnType<typeof fetchContentDetail>>>['spots']>,
) {
  const map = new Map<number, typeof spots>()
  spots.forEach((s) => {
    const list = map.get(s.dayNumber) ?? []
    list.push(s)
    map.set(s.dayNumber, list)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, items]) => ({
      day,
      spots: items.sort((a, b) => a.orderIndex - b.orderIndex),
    }))
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
  const { id: rawId } = await params
  const id = extractContentId(rawId)
  if (!id) notFound()
  const [content, session] = await Promise.all([fetchContentDetail(id), getSession()])

  if (!content) notFound()

  const isAuthenticated = Boolean(session)
  const photoClass = `ch-photo--${pickPhoto(content.title)}`
  const jsonLdString = JSON.stringify(buildJsonLd(content))
  const isStory = content.type === 'post'

  return (
    <>
      <ReadingProgress />
      <WebHeader session={session} active={null} />

      <script type="application/ld+json">{jsonLdString}</script>

      <main id="main-content">
        {isStory ? (
          <header
            style={{
              maxWidth: 760,
              margin: '0 auto',
              padding: '64px 32px 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 24,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span className="ch-pill">{TYPE_LABELS[content.type]}</span>
              {content.isFree ? (
                <span className="ch-pill ch-pill-coral">Free</span>
              ) : (
                <span className="ch-pill ch-pill-coral">
                  {formatPrice(content.priceInPaisa, content.isFree)}
                </span>
              )}
            </div>
            <h1
              className="ch-display"
              style={{
                fontSize: 'clamp(32px, 4.4vw, 52px)',
                color: 'var(--ink)',
                lineHeight: 1.1,
                margin: '0 0 24px',
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
                color: 'var(--ink)',
                textDecoration: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #d4b896, #a07c5a)',
                  color: 'white',
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
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  @{content.creator.username}
                </div>
              </div>
            </Link>
            <figure
              className={`ch-photo ${content.coverImageUrl ? '' : photoClass}`}
              style={{
                marginTop: 32,
                aspectRatio: '16 / 9',
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                backgroundImage: content.coverImageUrl
                  ? `url(${content.coverImageUrl})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-hidden
            />
          </header>
        ) : (
          <ParallaxHero photoClass={photoClass}>
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
        </ParallaxHero>
        )}

        <div
          className={isStory ? '' : hasItinerary(content) ? 'ch-reader-grid' : 'ch-page-grid'}
          style={{
            maxWidth: isStory ? 760 : 1640,
            margin: '0 auto',
            padding: isStory
              ? 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px) 80px'
              : 'clamp(32px, 5vw, 64px) clamp(16px, 4vw, 32px) 80px',
            ...(isStory
              ? {
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr)',
                  gap: 48,
                  alignItems: 'start',
                }
              : {}),
          }}
        >
          {hasItinerary(content) && content.spots && <StickyDayNav spots={content.spots} />}
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
                {groupSpotsByDay(content.spots).map(({ day, spots }, dayIndex) => {
                  const dayBlock = (
                    <div
                      id={`day-${String(day)}`}
                      data-day={day}
                      style={{ marginBottom: 48 }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-muted)',
                          display: 'block',
                          marginBottom: 12,
                        }}
                      >
                        Day {String(day)}
                      </span>
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
                        {spots.map((spot, i) => (
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
                    </div>
                  )
                  // Day 1 is a free preview; gate Day 2+ for guests.
                  if (dayIndex === 0 || isAuthenticated) {
                    return <div key={day}>{dayBlock}</div>
                  }
                  return (
                    <GuestGate
                      key={day}
                      mode="fade"
                      isAuthenticated={isAuthenticated}
                      contextLabel={`See Day ${String(day)} and the rest of the trip`}
                      reason="The full plan unlocks instantly when you sign in. Free, no spam, takes 30 seconds."
                      ctaLabel="Sign in to keep reading"
                    >
                      {dayBlock}
                    </GuestGate>
                  )
                })}
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
              <SaveButton
                contentId={content.id}
                contentTitle={content.title}
                initialCount={content.saveCount ?? 0}
                isAuthenticated={isAuthenticated}
              />
              <LikeButton
                contentId={content.id}
                contentTitle={content.title}
                initialCount={(content as { likeCount?: number | null }).likeCount ?? 0}
                isAuthenticated={isAuthenticated}
              />
              <ShareButton
                url={`/content/${contentSlugId(content.title, content.id, content.slug)}`}
                title={content.title}
              />
              <Link
                href={`/${content.creator.vertical}/${content.creator.username}`}
                className="ch-btn ch-btn-ghost"
              >
                More from {content.creator.displayName}
              </Link>
            </div>

            <CommentsSection
              contentId={content.id}
              totalCount={
                (content as { commentCount?: number | null }).commentCount ?? 0
              }
              isAuthenticated={isAuthenticated}
              contentTitle={content.title}
            />

            <EndOfArticleRail
              currentContentId={content.id}
              creatorId={content.creator.id}
              creatorDisplayName={content.creator.displayName}
              creatorVertical={content.creator.vertical}
              creatorUsername={content.creator.username}
              city={content.city ?? null}
              showJoinPanel={!isAuthenticated}
            />
          </article>

          {!isStory && (
            <aside
              style={{
                position: 'sticky',
                top: 96,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <BookCta
                contentId={content.id}
                contentTitle={content.title}
                contentType={content.type}
                priceInPaisa={content.priceInPaisa}
                isFree={content.isFree}
                scheduledDates={content.scheduledDates ?? []}
                isAuthenticated={isAuthenticated}
              />
              {hasItinerary(content) && content.spots && content.spots.length >= 2 && (
                <AnimatedMap spots={content.spots} />
              )}
            </aside>
          )}
        </div>
      </main>

      <WebFooter />
    </>
  )
}
