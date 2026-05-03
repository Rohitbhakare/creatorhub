import Link from 'next/link'
import { BentoMosaic } from '@/components/content/bento-mosaic'
import { ContinueReadingRail } from '@/components/content/continue-reading-rail'
import { CreatorSpotlight } from '@/components/content/creator-spotlight'
import { HeroFeature } from '@/components/content/hero-feature'
import { MapStrip } from '@/components/content/map-strip'
import { SectionRail } from '@/components/content/section-rail'
import { GuestLocationPrompt } from '@/components/chrome/guest-location-prompt'
import { MoodSelector } from '@/components/feed/mood-selector'
import { rankByMood, type MoodId } from '@/components/feed/mood-types'
import { QuestStripInline } from '@/components/feed/quest-strip-inline'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { fetchPopularCities, fetchQuestSummary, getHomeFeedSections } from '@/lib/api'
import { getFeaturedChapterStory } from '@/lib/api/feed'

interface Props {
  scope: 'near-you' | 'following' | 'all'
  type?: string
  city?: string
  mood: MoodId | null
  isGuest: boolean
  sessionDisplayName?: string | null
}

/**
 * The 9-section feed body — bento + map strip + creator spotlight + 11
 * editorial rails. Awaits `getHomeFeedSections` (a Promise.all over 9
 * endpoints), `fetchPopularCities`, `fetchQuestSummary`, and re-reads the
 * already-cached `getFeaturedChapterStory` result for id-dedup.
 *
 * Wrapped in <Suspense> at the page level so the hero (above) can paint
 * before this resolves.
 */
export async function HomeFeed({
  scope,
  type,
  city,
  mood,
  isGuest,
  sessionDisplayName,
}: Props) {
  const [sections, quests, cities, chapterStory] = await Promise.all([
    getHomeFeedSections(city ? { scope, city } : { scope }),
    isGuest ? Promise.resolve(null) : fetchQuestSummary(),
    fetchPopularCities(),
    // Per-request memoised; the paired <HomeHero> already awaited this so
    // here it resolves synchronously from the cache.
    getFeaturedChapterStory(city ? { city } : {}),
  ])

  // Mood + type filtering — preserved from the pre-split page logic.
  const moodFilteredSections = mood
    ? sections.map((s) => ({ ...s, items: rankByMood(s.items, mood) }))
    : sections

  const filteredSections =
    type && type !== 'all' && type !== 'post'
      ? moodFilteredSections
          .map((s) => ({ ...s, items: s.items.filter((i) => i.type === type) }))
          .filter((s) => s.items.length > 0)
      : moodFilteredSections

  const allItemsRaw = filteredSections.flatMap((s) => s.items)
  const allItems = mood ? rankByMood(allItemsRaw, mood) : allItemsRaw

  const bentoCandidates = mood
    ? allItems.filter((c) => c.id !== chapterStory?.content.id)
    : allItems
        .filter((c) => c.id !== chapterStory?.content.id)
        .sort((a, b) => Number(b.coverImageUrl !== null) - Number(a.coverImageUrl !== null))
  const bentoItems = bentoCandidates.slice(0, 8)
  const bentoIds = new Set(bentoItems.map((c) => c.id))

  const spotlightContent = allItems.find(
    (c) => c.id !== chapterStory?.content.id && !bentoIds.has(c.id) && c.creator,
  )
  const spotlightSpotlightCreator = spotlightContent?.creator ?? null

  const remainingSections = filteredSections
    .map((s) => ({
      ...s,
      items: s.items.filter(
        (i) =>
          i.id !== chapterStory?.content.id &&
          !bentoIds.has(i.id) &&
          i.id !== spotlightContent?.id,
      ),
    }))
    .filter((s) => s.items.length > 0)

  const headlineCity = city ?? sessionDisplayName ?? cities[0]?.name ?? null

  // Hero fallback — only fires when <HomeHero> rendered nothing because
  // no eligible chapter itinerary exists. Uses the first section item.
  const heroFallback = !chapterStory && allItems[0] ? allItems[0] : null

  return (
    <>
      {heroFallback && (
        <ScrollReveal>
          <section style={{ maxWidth: 1640, margin: '0 auto', padding: '0 32px' }}>
            <HeroFeature content={heroFallback} />
          </section>
        </ScrollReveal>
      )}

      {!isGuest && quests && (
        <ScrollReveal>
          <QuestStripInline summary={quests} />
        </ScrollReveal>
      )}

      <ScrollReveal>
        <MoodSelector activeMood={mood} />
      </ScrollReveal>

      {bentoItems.length > 0 && (
        <ScrollReveal>
          <section style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}>
            <BentoMosaic
              items={bentoItems}
              kicker={mood ? `Tuned for ${moodLabel(mood)}` : 'Curated for your weekend'}
              title={
                headlineCity ? `Stories from ${headlineCity}, this week` : 'Stories this week'
              }
              seeAllHref={mood ? `/discover?mood=${mood}` : '/discover'}
              {...(allItems.length > 8 ? { seeAllCount: allItems.length } : {})}
            />
          </section>
        </ScrollReveal>
      )}

      {cities.length > 0 && (
        <ScrollReveal>
          <MapStrip cities={cities} fromCityName={headlineCity} />
        </ScrollReveal>
      )}

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

      <ContinueReadingRail items={[]} />

      {remainingSections.length > 0 && (
        <section style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}>
          {remainingSections.slice(0, 11).map((section) => (
            <ScrollReveal key={section.id}>
              <SectionRail section={section} />
            </ScrollReveal>
          ))}
        </section>
      )}

      {isGuest && (
        <ScrollReveal>
          <section style={{ maxWidth: 720, margin: '60px auto 0', padding: '0 32px' }}>
            <div className="ch-card" style={{ padding: 28, textAlign: 'center' }}>
              <h2 className="ch-display" style={{ margin: '0 0 12px', fontSize: 22 }}>
                Save stories. Follow creators. Book trips.
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-muted)' }}>
                Free account — and we don&apos;t spam.
              </p>
              <Link href="/signup" className="ch-btn ch-btn-primary" style={{ padding: '10px 20px' }}>
                Join CreatorHub
              </Link>
            </div>
          </section>
        </ScrollReveal>
      )}

      {isGuest && <GuestLocationPrompt cities={cities.slice(0, 6)} />}
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
