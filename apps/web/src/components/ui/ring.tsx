/**
 * Circular progress ring — used for quest progress, level XP fill,
 * itinerary completion. Coral fill = SRS allow-list spot 6 (user state).
 *
 * SVG-based so it scales crisply at any size; no animation here — the
 * caller wraps with framer-motion or supplies an animated `progress`
 * value if needed. Reduced-motion users see a static ring (no harm).
 *
 * SSR-safe.
 */

interface RingProps {
  /** Pixel diameter. Default 36. */
  size?: number
  /** 0..1 progress fraction. Clamped. */
  progress: number
  /** Stroke width in pixels. Default size/12. */
  stroke?: number
  /** Track color. Default `var(--surface-alt)`. */
  trackColor?: string
  /** Fill color. Default `var(--primary)` (coral allow-list spot 6). */
  fillColor?: string
  /** Optional center label (e.g. "3/5", a number, or an icon). */
  children?: React.ReactNode
  /** Accessible label for screen readers. */
  label?: string
}

export function Ring({
  size = 36,
  progress,
  stroke,
  trackColor = 'var(--surface-alt)',
  fillColor = 'var(--primary)',
  children,
  label,
}: RingProps) {
  const clamped = Math.max(0, Math.min(1, progress))
  const sw = stroke ?? Math.max(2, Math.round(size / 12))
  const radius = (size - sw) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped)

  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-grid',
        placeItems: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 360ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      {children !== undefined && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: Math.round(size * 0.32),
            fontWeight: 600,
            color: 'var(--ink)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
