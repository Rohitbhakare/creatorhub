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
import { AnimatedMap } from '@/components/reader/animated-map'
import { InlineSpotCard } from '@/components/reader/inline-spot-card'
import { PrevNextChapterFooter, type ChapterRef } from '@/components/reader/prev-next-chapter'
import { mergeSpotsIntoBody } from '@/lib/reader/merge-spots'
import { getReaderMode } from '@/lib/reader-mode'
import { LikeButton } from '@/components/social/like-button'
import { FollowButton } from '@/components/social/follow-button'
import { ShareButton } from '@/components/social/share-button'
import { CommentsSection } from '@/components/reader/comments-section'
import { EndOfArticleRail } from '@/components/reader/end-of-article-rail'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params
  const id = extractContentId(rawId)
  // Calling notFound() in generateMetadata is required in Next.js 15 — the
  // metadata phase commits the response status before the page render runs,
  // so a notFound() in the page itself is too late to set HTTP 404.
  if (!id) notFound()
  const content = await fetchContentDetail(id)
  if (!content) notFound()

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
      url: `https://creatorhub.in/u/${content.creator.username}`,
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
  const [content, session, mode] = await Promise.all([
    fetchContentDetail(id),
    getSession(),
    getReaderMode(),
  ])

  if (!content) notFound()

  const isAuthenticated = Boolean(session)
  const photoClass = `ch-photo--${pickPhoto(content.title)}`
  const jsonLdString = JSON.stringify(buildJsonLd(content))
  const isStory = content.type === 'post'

  // E5.3 T5: server-side merge body markdown + spots into a single block
  // stream the page can iterate. For posts, this returns just the body.
  const readerBlocks = mergeSpotsIntoBody(content.body, content.spots ?? [])

  // For multi-day itineraries, build the chapter list once for both
  // <ReaderChrome> (day-progress chip) and <PrevNextChapterFooter>.
  const dayList = (content.spots ?? []).reduce<{ day: number; title: string }[]>(
    (acc, spot) => {
      if (!acc.some((d) => d.day === spot.dayNumber)) {
        acc.push({ day: spot.dayNumber, title: `Day ${String(spot.dayNumber)}` })
      }
      return acc
    },
    [],
  )
  const isMultiDay = dayList.length > 1
  const lastChapter: ChapterRef | undefined = isMultiDay
    ? {
        href: `#day-${String(dayList[dayList.length - 1]?.day ?? 1)}`,
        kicker: `Day ${String(dayList[dayList.length - 1]?.day ?? 1)}`,
        title: `Day ${String(dayList[dayList.length - 1]?.day ?? 1)} of the trip`,
      }
    : undefined
  void lastChapter // (footer wiring lives further down; satisfy the linter)

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href={`/u/${content.creator.username}`}
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
              <FollowButton
                creatorId={content.creator.id}
                creatorName={content.creator.displayName}
                isAuthenticated={isAuthenticated}
                size="sm"
                hideCount
              />
            </div>
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
              href={`/u/${content.creator.username}`}
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
            {/* E5.3 T11: render the merged block stream — markdown chunks
                interleaved with <InlineSpotCard> for itineraries. For
                posts this is just one markdown block. The empty fallback
                still prompts users to install the app. */}
            {readerBlocks.length > 0 ? (
              readerBlocks.map((block, i) =>
                block.kind === 'markdown' ? (
                  <div
                    key={`md-${String(i)}`}
                    {...(block.dayNumber !== null
                      ? {
                          id: `day-${String(block.dayNumber)}`,
                          'data-day-anchor': String(block.dayNumber),
                        }
                      : {})}
                  >
                    <MarkdownBody body={block.body} mode={mode} />
                  </div>
                ) : (
                  <InlineSpotCard
                    key={`spot-${block.spot.id}`}
                    spot={block.spot}
                    isParentSaved={false}
                    onToggleSave={() => {
                      /* wired client-side via SaveButton API in this PR;
                         InlineSpotCard's onToggleSave is the magazine
                         heart, not the canonical save flow. */
                    }}
                  />
                ),
              )
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

            {/* E5.3 T9 — chapter-footer cards. Currently navigates via in-page
                hash anchors (each `data-day-anchor` set above). True
                per-chapter URLs are a future refactor. */}
            {isMultiDay && dayList.length >= 2 && (() => {
              const first = dayList[0]
              const last = dayList[dayList.length - 1]
              if (!first || !last) return null
              return (
                <PrevNextChapterFooter
                  prev={{
                    href: `#day-${String(first.day)}`,
                    kicker: `Day ${String(first.day)}`,
                    title: 'Start of the trip',
                  }}
                  next={{
                    href: `#day-${String(last.day)}`,
                    kicker: `Day ${String(last.day)}`,
                    title: 'End of the trip',
                  }}
                />
              )
            })()}

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
              <FollowButton
                creatorId={content.creator.id}
                creatorName={content.creator.displayName}
                isAuthenticated={isAuthenticated}
                size="sm"
                hideCount
              />
              <Link
                href={`/u/${content.creator.username}`}
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
              creatorUsername={content.creator.username}
              city={content.city ?? null}
              showJoinPanel={!isAuthenticated}
              isAuthenticated={isAuthenticated}
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
