import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { GuestLocationPrompt } from '@/components/chrome/guest-location-prompt'
import { SectionRail } from '@/components/content/section-rail'
import { HeroFeature } from '@/components/content/hero-feature'
import { BentoMosaic } from '@/components/content/bento-mosaic'
import { ChapterHero } from '@/components/content/chapter-hero'
import { MapStrip } from '@/components/content/map-strip'
import { CreatorSpotlight } from '@/components/content/creator-spotlight'
import { ContinueReadingRail } from '@/components/content/continue-reading-rail'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { FeedChipRail } from '@/components/feed/feed-chip-rail'
import { QuestStripInline } from '@/components/feed/quest-strip-inline'
import { MoodSelector } from '@/components/feed/mood-selector'
import { parseMoodParam, rankByMood, type MoodId } from '@/components/feed/mood-types'
import { PostsFeedColumn } from '@/components/feed/posts-feed-column'
import { getSession } from '@/lib/session'
import {
  fetchPopularCities,
  fetchQuestSummary,
  getHomeFeedSections,
} from '@/lib/api'
import { getFeaturedChapterStory } from '@/lib/api/feed'

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
 *   Header → ChapterHero (or HeroFeature fallback) → FeedChipRail
 *   → QuestStripInline (authed) → MoodSelector → BentoMosaic (8 items)
 *   → MapStrip → CreatorSpotlight → ContinueReadingRail (empty for now)
 *   → 11 SectionRails → Footer
 *
 * Branches early on `?type=post` to render <PostsFeedColumn> instead of
 * the magazine. WEB-FEED-FR-026.
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
  const [sections, quests, cities, chapterStory] = await Promise.all([
    getHomeFeedSections(city ? { scope, city } : { scope }),
    isGuest ? Promise.resolve(null) : fetchQuestSummary(),
    fetchPopularCities(),
    getFeaturedChapterStory(city ? { city } : {}),
  ])

  // Mood filtering is currently client-side: same data, page reranks by
  // mood-keyword overlap. Server-side ranking is filed as E5.1/ENH-001;
  // when the API accepts ?mood=, this rerank can be removed.
  const filteredSections = mood
    ? sections.map((s) => ({ ...s, items: rankByMood(s.items, mood) }))
    : sections

  const allItemsRaw = filteredSections.flatMap((s) => s.items)
  const allItems = mood ? rankByMood(allItemsRaw, mood) : allItemsRaw

  // Bento takes 8 items. With a mood active we honor the mood ranking;
  // without one we still prefer items with covers (visual quality).
  const bentoCandidates = mood
    ? allItems.filter((c) => c.id !== chapterStory?.content.id)
    : allItems
        .filter((c) => c.id !== chapterStory?.content.id)
        .sort((a, b) => Number(b.coverImageUrl !== null) - Number(a.coverImageUrl !== null))
  const bentoItems = bentoCandidates.slice(0, 8)
  const bentoIds = new Set(bentoItems.map((c) => c.id))

  // Spotlight: pick the first item from a creator with content, that isn't already in the hero or bento.
  const spotlightContent = allItems.find(
    (c) => c.id !== chapterStory?.content.id && !bentoIds.has(c.id) && c.creator,
  )
  const spotlightSpotlightCreator = spotlightContent?.creator ?? null

  // Section rails get everything else
  const remainingSections = filteredSections
    .map((s) => ({
      ...s,
      items: s.items.filter(
        (i) => i.id !== chapterStory?.content.id && !bentoIds.has(i.id) && i.id !== spotlightContent?.id,
      ),
    }))
    .filter((s) => s.items.length > 0)

  // Headline city — use ?city= override, else session city, else first popular city.
  const headlineCity =
    city ?? session?.displayName ?? cities[0]?.name ?? null

  return (
    <>
      <WebHeader
        session={session}
        active="home"
        streak={quests?.streakDays ?? 0}
      />
      <main id="main-content">
        <FeedChipRail
          scope={scope}
          type={type}
          isGuest={isGuest}
          {...(city ? { city } : {})}
        />

        {/* Hero — chapter rotator if a featured itinerary is available; else
            fall back to the existing single-story HeroFeature. */}
        {chapterStory ? (
          <ChapterHero story={chapterStory} />
        ) : allItems[0] ? (
          <ScrollReveal>
            <HeroFeature content={allItems[0]} />
          </ScrollReveal>
        ) : null}

        {/* Quest strip — authed only. Guests get a sign-in nudge inline. */}
        {!isGuest && quests && (
          <ScrollReveal>
            <QuestStripInline summary={quests} />
          </ScrollReveal>
        )}

        {/* Mood selector — re-rank below by lifestyle mood. */}
        <ScrollReveal>
          <MoodSelector activeMood={mood} />
        </ScrollReveal>

        {/* Magazine bento — 8-tile asymmetric mosaic + bottom row. */}
        {bentoItems.length > 0 && (
          <ScrollReveal>
            <section style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}>
              <BentoMosaic
                items={bentoItems}
                kicker={mood ? `Tuned for ${moodLabel(mood)}` : 'Curated for your weekend'}
                title={
                  headlineCity
                    ? `Stories from ${headlineCity}, this week`
                    : 'Stories this week'
                }
                seeAllHref={mood ? `/discover?mood=${mood}` : '/discover'}
                {...(allItems.length > 8 ? { seeAllCount: allItems.length } : {})}
              />
            </section>
          </ScrollReveal>
        )}

        {/* Map strip — stylised placeholder until E5.3 Mapbox lands. */}
        {cities.length > 0 && (
          <ScrollReveal>
            <MapStrip cities={cities} fromCityName={headlineCity} />
          </ScrollReveal>
        )}

        {/* Creator spotlight — parallax tilt card. */}
        {spotlightContent && spotlightSpotlightCreator && (
          <ScrollReveal>
            <CreatorSpotlight
              creator={{
                id: spotlightSpotlightCreator.id,
                displayName: spotlightSpotlightCreator.displayName,
                username: spotlightSpotlightCreator.username,
                avatarUrl: spotlightSpotlightCreator.avatarUrl,
                city: spotlightContent.city ?? null,
                followerCount: 0,
                contentCount: 0,
              }}
              featuredContent={spotlightContent}
            />
          </ScrollReveal>
        )}

        {/* Continue reading — empty for now (no API endpoint yet). */}
        <ContinueReadingRail items={[]} />

        {/* Editorial section rails — the 11-section feed. */}
        {remainingSections.length > 0 && (
          <section style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}>
            {remainingSections.slice(0, 11).map((section) => (
              <ScrollReveal key={section.id}>
                <SectionRail section={section} />
              </ScrollReveal>
            ))}
          </section>
        )}

        {/* Guests get the bottom-of-page sign-in nudge. */}
        {isGuest && (
          <ScrollReveal>
            <section style={{ maxWidth: 720, margin: '60px auto 0', padding: '0 32px' }}>
              <div className="ch-card" style={{ padding: 28, textAlign: 'center' }}>
                <h2 className="ch-display" style={{ margin: '0 0 12px', fontSize: 22 }}>
                  Save stories. Follow creators. Book trips.
                </h2>
                <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-muted)' }}>
                  Free account — and we don't spam.
                </p>
                <Link href="/signup" className="ch-btn ch-btn-primary" style={{ padding: '10px 20px' }}>
                  Join CreatorHub
                </Link>
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>

      {isGuest && <GuestLocationPrompt cities={cities.slice(0, 6)} />}

      <WebFooter />
    </>
  )
}

function moodLabel(mood: MoodId): string {
  switch (mood) {
    case 'slow':
      return 'slow weekends'
    case 'high':
      return 'high-octane plans'
    case 'food':
      return 'food trails'
    case 'sunrise':
      return 'sunrise people'
    case 'art':
      return 'art & craft'
  }
}
