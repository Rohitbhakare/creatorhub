'use client'

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { ItinerarySpot } from '@/lib/api/types'

interface AnimatedMapProps {
  spots: ItinerarySpot[]
}

/**
 * Right-rail map sketch. SVG polyline whose `pathLength` is bound to body
 * scroll progress; spot dots fade in as the path passes them. Reduced-motion
 * users see a static drawn-once polyline.
 *
 * No real Mapbox tile here — the polyline is computed from a simple
 * normalised projection of (lat, lng). When real tiles ship, replace the
 * background with `<MapboxMap>` and keep the SVG overlay as the polyline.
 */
export function AnimatedMap({ spots }: AnimatedMapProps) {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const drawProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 22 })
  const pathLength = useTransform(drawProgress, [0, 1], [0, 1])

  const [size, setSize] = useState({ w: 280, h: 360 })
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [])

  const pts = projectSpots(spots, size.w, size.h)
  const path = pts.length >= 2 ? toCatmullRomPath(pts) : ''

  return (
    <aside
      ref={wrapRef}
      aria-label="Route map"
      style={{
        position: 'sticky',
        top: 96,
        width: 280,
        flex: '0 0 280px',
        height: 360,
        borderRadius: 'var(--radius-lg)',
        background:
          'linear-gradient(135deg, var(--surface-alt) 0%, var(--surface) 100%)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
        }}
      >
        Route
      </span>
      {pts.length >= 2 ? (
        <svg width={size.w} height={size.h} aria-hidden style={{ position: 'absolute', inset: 0 }}>
          <motion.path
            d={path}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...(reduced
              ? {}
              : { style: { pathLength } as never, initial: { pathLength: 0 } })}
          />
          {pts.map((p, i) => (
            <SpotDot
              key={i}
              x={p.x}
              y={p.y}
              threshold={i / Math.max(1, pts.length - 1)}
              progress={drawProgress}
              reduced={reduced ?? false}
            />
          ))}
        </svg>
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-muted)',
            fontSize: 12,
          }}
        >
          Map drawn from spot coordinates.
        </div>
      )}
    </aside>
  )
}

interface Pt {
  x: number
  y: number
}

function SpotDot({
  x,
  y,
  threshold,
  progress,
  reduced,
}: {
  x: number
  y: number
  threshold: number
  progress: ReturnType<typeof useSpring>
  reduced: boolean
}) {
  const lit = useTransform(progress, (v) => (v >= threshold ? 1 : 0))
  return (
    <g transform={`translate(${String(x)} ${String(y)})`}>
      <motion.circle
        r={5}
        fill="var(--primary)"
        stroke="white"
        strokeWidth={2}
        {...(reduced ? {} : { style: { opacity: lit, scale: lit } as never })}
      />
    </g>
  )
}

function projectSpots(spots: ItinerarySpot[], w: number, h: number): Pt[] {
  const usable = spots.filter((s) => s.lat != null && s.lng != null)
  if (usable.length === 0) return []
  const lats = usable.map((s) => s.lat as number)
  const lngs = usable.map((s) => s.lng as number)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const padX = 28
  const padY = 36
  const innerW = Math.max(1, w - padX * 2)
  const innerH = Math.max(1, h - padY * 2)
  return usable.map((s) => {
    const lng = s.lng as number
    const lat = s.lat as number
    const x = padX + ((lng - minLng) / Math.max(0.0001, maxLng - minLng)) * innerW
    const y = padY + (1 - (lat - minLat) / Math.max(0.0001, maxLat - minLat)) * innerH
    return { x, y }
  })
}

function toCatmullRomPath(pts: Pt[]): string {
  // Simple smooth-ish curve through points using bezier midpoints.
  if (pts.length < 2) return ''
  let d = `M ${String(pts[0]?.x ?? 0)} ${String(pts[0]?.y ?? 0)}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    if (!prev || !curr) continue
    const cx = (prev.x + curr.x) / 2
    const cy = (prev.y + curr.y) / 2
    d += ` Q ${String(prev.x)} ${String(prev.y)} ${String(cx)} ${String(cy)}`
  }
  const last = pts[pts.length - 1]
  if (last) d += ` T ${String(last.x)} ${String(last.y)}`
  return d
}
