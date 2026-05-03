import { Suspense } from 'react'
import type { Metadata } from 'next'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { FeedChipRail } from '@/components/feed/feed-chip-rail'
import { parseMoodParam, type MoodId } from '@/components/feed/mood-types'
import { PostsFeedColumn } from '@/components/feed/posts-feed-column'
import { HomeFeed } from '@/components/home/home-feed'
import { HomeFeedSkeleton } from '@/components/home/home-feed-skeleton'
import { HomeHero } from '@/components/home/home-hero'
import { getSession } from '@/lib/session'
import { fetchQuestSummary, getHomeFeedSections } from '@/lib/api'

export const metadata: Metadata = {
  title: 'CreatorHub — Stories, plans, and live moments',
  description:
    'Where creators build their thing. Posts, plans, live experiences, group events — discover and book the work of creators you trust.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'CreatorHub — Stories, plans, and live moments',
    description:
      'Where creators build their thing. Posts, plans, live experiences, group events.',
    type: 'website',
  },
}

interface Props {
  searchParams: Promise<{
    scope?: 'near-you' | 'following' | 'all'
    type?: string
    city?: string
    mood?: string
  }>
}

/**
 * v3 magazine home (E5.1). Single-column, max 1240px, no right rail.
 * SRS delta WEB-FEED-FR-023-R supersedes the original three-col spec —
 * see docs/00_SRS/v1.5/srs-v1.5-r-deltas.md.
 *
 * Composition (top-to-bottom):
 *   Header → FeedChipRail → <HomeHero> → <Suspense><HomeFeed/></Suspense>
 *   → Footer
 *
 * The hero awaits only the chapter-story fetch so it streams ahead of the
 * 9-section feed fan-out — kills the visual pop-in that the perf pass
 * (2026-05-02) flagged as the top LCP issue.
 */
export default async function HomePage({ searchParams }: Props) {
  const session = await getSession()
  const isGuest = !session

  const sp = await searchParams
  const scope: 'near-you' | 'following' | 'all' = sp.scope ?? 'near-you'
  const type = sp.type
  const city = sp.city
  const mood: MoodId | null = parseMoodParam(sp.mood)

  // ── Posts feed mode — single-column 640px Instagram-style ──────────
  if (type === 'post') {
    const sections = await getHomeFeedSections(city ? { scope, city } : { scope })
    const posts = sections
      .flatMap((s) => s.items)
      .filter((i) => i.type === 'post')
    return (
      <>
        <WebHeader session={session} active="home" />
        <main id="main-content">
          <FeedChipRail
            scope={scope}
            type="post"
            isGuest={isGuest}
            {...(city ? { city } : {})}
          />
          <PostsFeedColumn items={posts} />
        </main>
        <WebFooter />
      </>
    )
  }

  // ── Magazine mode (default) ────────────────────────────────────────
  // Quests for the header streak chip — fast auth-side call, also
  // re-read inside <HomeFeed> via React cache() for QuestStripInline.
  const quests = isGuest ? null : await fetchQuestSummary()

  return (
    <>
      <WebHeader
        session={session}
        active="home"
        streak={quests?.streakDays ?? 0}
      />
      <main id="main-content">
        {/* Round-5 audit: cold visitors landed straight in curated content
            with no value-prop. One serif line + coral kicker, guests only. */}
        {isGuest && (
          <section
            style={{
              maxWidth: 720,
              margin: '24px auto 0',
              padding: '0 32px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--primary-text-bg)',
                margin: '0 0 8px',
              }}
            >
              CreatorHub
            </p>
            <p
              className="ch-display"
              style={{
                fontSize: 'clamp(18px, 2.2vw, 22px)',
                color: 'var(--ink-soft)',
                margin: 0,
                lineHeight: 1.5,
                letterSpacing: '-0.005em',
              }}
            >
              Discover trips, stories and experiences from India&rsquo;s best independent creators.
            </p>
          </section>
        )}
        <FeedChipRail
          scope={scope}
          type={type}
          isGuest={isGuest}
          {...(city ? { city } : {})}
        />

        {/* Hero — streams independently of the feed fan-out below.
            Renders <ChapterHero> when an editorial itinerary with ≥3
            chapters is available; falls through to the feed's
            <HeroFeature> fallback otherwise. */}
        <HomeHero {...(city ? { city } : {})} />

        {/* Feed body — bento + map strip + spotlight + 11 rails.
            Wrapped in Suspense so the hero can paint first. */}
        <Suspense fallback={<HomeFeedSkeleton />}>
          <HomeFeed
            scope={scope}
            isGuest={isGuest}
            mood={mood}
            sessionDisplayName={session?.displayName ?? null}
            {...(type ? { type } : {})}
            {...(city ? { city } : {})}
          />
        </Suspense>
      </main>

      <WebFooter />
    </>
  )
}
