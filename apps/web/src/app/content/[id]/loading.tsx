import { Skeleton } from '@/components/ui/skeleton'

export default function ContentDetailLoading() {
  return (
    <main className="ch-container" style={{ paddingBlock: '32px 80px' }}>
      <Skeleton height="70vh" style={{ minHeight: 480, borderRadius: 0, marginInline: -32 }} />
      <div
        className="ch-page-grid"
        style={{ paddingBlock: '48px 0', maxWidth: 1640 }}
      >
        <article style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton width={120} height={11} rounded="sm" />
          <Skeleton height={26} rounded="sm" />
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} width={`${String(75 + Math.floor(Math.random() * 25))}%`} height={18} rounded="sm" />
          ))}
        </article>
        <aside>
          <Skeleton height={260} rounded="lg" />
        </aside>
      </div>
    </main>
  )
}
