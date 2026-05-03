import { Skeleton } from '@/components/ui/skeleton'

/**
 * Studio-scoped Suspense fallback. Renders inside <StudioLayout> so the
 * sidebar + header stay visible — only the right-pane content is replaced
 * with skeletons during navigation between /studio sub-routes.
 *
 * Without this file, Next falls through to the global app/loading.tsx
 * (which paints the magazine-home skeleton) and the user sees stale
 * content for the duration of the data fetch — round-3 QA flagged this
 * as "~2s delay before new page renders, see old content first."
 */
export default function StudioLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Skeleton width={140} height={11} rounded="sm" style={{ marginBottom: 10 }} />
      <Skeleton width="55%" height={32} rounded="sm" style={{ marginBottom: 28 }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Skeleton width={70} height={10} rounded="sm" />
            <Skeleton width="80%" height={26} rounded="sm" />
            <Skeleton width="50%" height={12} rounded="sm" />
          </div>
        ))}
      </div>

      <Skeleton width={180} height={20} rounded="sm" style={{ marginBottom: 14 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px minmax(0,1fr) 80px',
              gap: 14,
              padding: 14,
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-md)',
              alignItems: 'center',
            }}
          >
            <Skeleton width={56} height={56} rounded="md" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton width="70%" height={16} rounded="sm" />
              <Skeleton width="40%" height={12} rounded="sm" />
            </div>
            <Skeleton width={70} height={28} rounded="pill" />
          </div>
        ))}
      </div>
    </div>
  )
}
