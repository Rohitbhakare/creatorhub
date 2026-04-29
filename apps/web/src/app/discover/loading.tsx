import { WebHeader } from '@/components/chrome/web-header'
import { ContentCardSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function DiscoverLoading() {
  return (
    <>
      <WebHeader active="discover" />
      <section
        className="ch-container"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--hairline)',
          paddingBlock: '40px',
        }}
      >
        <Skeleton width={120} height={11} rounded="sm" style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={48} rounded="sm" style={{ marginBottom: 24 }} />
        <Skeleton height={48} rounded="pill" style={{ maxWidth: 720 }} />
      </section>
      <main className="ch-container" style={{ paddingBlock: '32px 80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 32,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </>
  )
}
