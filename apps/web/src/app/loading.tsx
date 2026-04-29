import { WebHeader } from '@/components/chrome/web-header'
import {
  BentoSkeleton,
  HeroFeatureSkeleton,
  SectionRailSkeleton,
  Skeleton,
} from '@/components/ui/skeleton'

/**
 * Home / feed skeleton — the same shape as `/page.tsx` so the user sees
 * structure instantly. RSC streams in below this when ready.
 */
export default function Loading() {
  return (
    <>
      <WebHeader />
      <main className="ch-container" style={{ paddingBlock: '20px 64px' }}>
        <Skeleton width={220} height={11} rounded="sm" style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={40} rounded="sm" style={{ marginBottom: 32 }} />
        <HeroFeatureSkeleton />
        <div style={{ marginTop: 56 }}>
          <BentoSkeleton />
        </div>
        <SectionRailSkeleton />
        <SectionRailSkeleton />
      </main>
    </>
  )
}
