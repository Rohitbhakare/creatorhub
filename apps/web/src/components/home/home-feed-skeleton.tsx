import { BentoSkeleton, SectionRailSkeleton, Skeleton } from '@/components/ui/skeleton'

/**
 * Suspense fallback for <HomeFeed>. Mirrors the feed's vertical rhythm so
 * the page doesn't shift when sections + cities + spotlight resolve.
 *
 * Order matches HomeFeed:
 *   MoodSelector chip rail → BentoMosaic → MapStrip → CreatorSpotlight
 *   → 2 SectionRails (showing the top of the rails block)
 */
export function HomeFeedSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      {/* Mood selector — 5 pills */}
      <section
        style={{
          maxWidth: 1640,
          margin: '32px auto 0',
          padding: '0 32px',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={104} height={36} rounded="pill" />
        ))}
      </section>

      {/* Bento mosaic */}
      <section style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}>
        <Skeleton width={180} height={11} rounded="sm" style={{ marginBottom: 8 }} />
        <Skeleton width={420} height={32} rounded="sm" style={{ marginBottom: 24 }} />
        <BentoSkeleton />
      </section>

      {/* Map strip placeholder */}
      <section style={{ maxWidth: 1640, margin: '56px auto 0', padding: '0 32px' }}>
        <Skeleton height={220} rounded="lg" />
      </section>

      {/* First two section rails */}
      <section style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}>
        <SectionRailSkeleton items={4} />
        <SectionRailSkeleton items={4} />
      </section>
    </div>
  )
}
