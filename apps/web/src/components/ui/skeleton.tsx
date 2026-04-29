import type { CSSProperties } from 'react'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'pill'
  style?: CSSProperties
  className?: string
}

/** Reusable shimmer block. Reuses .ch-skeleton from globals.css. */
export function Skeleton({
  width = '100%',
  height = 14,
  rounded = 'md',
  style,
  className,
}: SkeletonProps) {
  return (
    <span
      className={`ch-skeleton ${className ?? ''}`}
      style={{
        display: 'block',
        width,
        height,
        borderRadius: `var(--radius-${rounded})`,
        ...style,
      }}
    />
  )
}

/** Card-shaped skeleton — matches the ContentCard footprint. */
export function ContentCardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton height={200} rounded="lg" />
      <Skeleton width="80%" height={20} rounded="sm" />
      <Skeleton width="60%" height={14} rounded="sm" />
    </div>
  )
}

/** Bento-shaped skeleton — feature + tall + 2 squares. */
export function BentoSkeleton() {
  return (
    <div className="ch-bento-grid" aria-hidden>
      <Skeleton height="100%" rounded="lg" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
      <Skeleton height="100%" rounded="lg" style={{ gridRow: 'span 2' }} />
      <Skeleton height="100%" rounded="lg" />
      <Skeleton height="100%" rounded="lg" />
    </div>
  )
}

/** Hero-shaped skeleton matching HeroFeature 1.3/1 grid. */
export function HeroFeatureSkeleton() {
  return (
    <div
      className="ch-hero-feature-grid"
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--hairline)',
        boxShadow: 'var(--shadow-md)',
        background: 'var(--surface)',
      }}
      aria-hidden
    >
      <Skeleton height={420} rounded="sm" style={{ borderRadius: 0 }} />
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Skeleton width={120} height={11} rounded="sm" />
        <Skeleton height={32} rounded="sm" />
        <Skeleton width="90%" height={18} rounded="sm" />
        <Skeleton width="72%" height={18} rounded="sm" />
        <Skeleton width="55%" height={18} rounded="sm" />
        <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
          <Skeleton width={140} height={40} rounded="pill" />
        </div>
      </div>
    </div>
  )
}

/** Section rail skeleton (kicker + heading + 4 cards). */
export function SectionRailSkeleton({ items = 4 }: { items?: number }) {
  return (
    <section style={{ marginTop: 56 }}>
      <Skeleton width={140} height={11} rounded="sm" style={{ marginBottom: 8 }} />
      <Skeleton width={280} height={28} rounded="sm" style={{ marginBottom: 24 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 32,
        }}
      >
        {Array.from({ length: items }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}
