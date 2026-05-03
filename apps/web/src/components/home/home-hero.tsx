import { ChapterHero } from '@/components/content/chapter-hero'
import { getFeaturedChapterStory } from '@/lib/api/feed'

interface Props {
  city?: string
}

/**
 * Hero band for the magazine home — awaits only `getFeaturedChapterStory`
 * so it can stream independently of the 9-section feed fan-out below.
 *
 * Returns null when no eligible chapter itinerary exists; in that case the
 * paired <HomeFeed> renders its own <HeroFeature> from the first section
 * item once feed data resolves. The common path (handpicked itinerary
 * present) renders the hero in one round-trip without waiting on the feed.
 */
export async function HomeHero({ city }: Props) {
  const chapterStory = await getFeaturedChapterStory(city ? { city } : {})
  if (!chapterStory) return null
  return <ChapterHero story={chapterStory} />
}
