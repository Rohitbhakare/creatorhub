import { WebHeader } from '@/components/chrome/web-header'
import { getSession } from '@/lib/session'
import {
  BentoSkeleton,
  HeroFeatureSkeleton,
  SectionRailSkeleton,
  Skeleton,
} from '@/components/ui/skeleton'

/**
 * Global skeleton — shown by Next.js whenever ANY route below this layout
 * is suspended (dev-mode compile, slow data fetch, RSC payload streaming).
 *
 * Reads the session so the header keeps its signed-in chrome during loading.
 * Without this, the skeleton flashed a guest header (Sign in / Join) until
 * the route resolved — caught in the 2026-05-02 bug bash as "infinite
 * skeleton + auth-lost" on /u/:username and /publish/*.
 */
export default async function Loading() {
  const session = await getSession()
  return (
    <>
      <WebHeader session={session} />
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
