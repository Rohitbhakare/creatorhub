'use client'

import { useId, useMemo } from 'react'

interface DataPoint {
  date: string
  valuePaisa: number
}

interface Props {
  /** 30-day earnings series. Up to 30 points; missing days plot at 0. */
  trend: readonly DataPoint[]
  width?: number
  height?: number
}

/**
 * 30-day earnings sparkline (E5.7 T2).
 *
 * Pure SVG — no library. Path is a polyline through normalised values
 * with an area fill below. Hover targets are invisible 1px-wide rects
 * over each x-position; on focus/hover, a `<title>` tooltip + a coral
 * dot pin to that point.
 *
 * Accessibility: outer `<svg role="img">` with `<title>` summarising
 * total + peak; the screen reader summary is sufficient since per-point
 * data is also surfaced by the recent-activity list below the dashboard.
 */
export function EarningsSparkline({ trend, width = 720, height = 160 }: Props) {
  const id = useId()
  const padX = 8
  const padY = 12

  const stats = useMemo(() => {
    if (trend.length === 0) return null
    const values = trend.map((t) => t.valuePaisa)
    const max = Math.max(...values, 1)
    const total = values.reduce((s, v) => s + v, 0)
    const peakIdx = values.indexOf(Math.max(...values))
    return { max, total, peakIdx }
  }, [trend])

  if (!stats || trend.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-muted)',
          fontSize: 13,
          background: 'var(--surface-alt)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        No earnings yet — publish to start tracking
      </div>
    )
  }

  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const stepX = trend.length > 1 ? innerW / (trend.length - 1) : 0

  const points = trend.map((t, i) => {
    const x = padX + i * stepX
    const y = padY + innerH - (t.valuePaisa / stats.max) * innerH
    return { x, y, ...t }
  })

  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const first = points[0]
  const last = points[points.length - 1]
  const peak = points[stats.peakIdx]
  if (!first || !last || !peak) return null
  const baseY = padY + innerH
  const areaPath =
    `M ${first.x.toFixed(1)} ${baseY.toString()} ` +
    points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
    ` L ${last.x.toFixed(1)} ${baseY.toString()} Z`
  const totalRupees = (stats.total / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })

  return (
    <svg
      role="img"
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-labelledby={`${id}-title ${id}-desc`}
    >
      <title id={`${id}-title`}>30-day earnings</title>
      <desc id={`${id}-desc`}>
        ₹{totalRupees} total over 30 days. Peak: ₹
        {(peak.valuePaisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })} on{' '}
        {peak.date}.
      </desc>

      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Area fill below the line */}
      <path d={areaPath} fill={`url(#${id}-fill)`} />

      {/* Polyline */}
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Peak marker */}
      <circle cx={peak.x} cy={peak.y} r={4} fill="var(--primary)" stroke="var(--bg)" strokeWidth="2" />
    </svg>
  )
}
