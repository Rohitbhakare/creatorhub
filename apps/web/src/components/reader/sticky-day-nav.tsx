'use client'

import { useEffect, useState } from 'react'
import type { ItinerarySpot } from '@/lib/api/types'

interface StickyDayNavProps {
  spots: ItinerarySpot[]
}

/**
 * Sticky left rail listing days. Each day shows the count of spots and is a
 * scroll-spy target — clicking jumps to that day's anchor, scrolling smoothly.
 */
export function StickyDayNav({ spots }: StickyDayNavProps) {
  const days = collectDays(spots)
  const [activeDay, setActiveDay] = useState<number>(days[0]?.day ?? 1)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const day = Number(entry.target.getAttribute('data-day') ?? '1')
            setActiveDay(day)
          }
        })
      },
      { rootMargin: '-30% 0px -50% 0px' },
    )
    days.forEach((d) => {
      const el = document.getElementById(`day-${String(d.day)}`)
      if (el) observer.observe(el)
    })
    return () => {
      observer.disconnect()
    }
  }, [days])

  if (days.length <= 1) return null

  return (
    <nav
      aria-label="Days"
      style={{
        position: 'sticky',
        top: 96,
        alignSelf: 'start',
        width: 200,
        flex: '0 0 200px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          display: 'block',
          marginBottom: 14,
        }}
      >
        Itinerary
      </span>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {days.map((d) => {
          const isActive = d.day === activeDay
          return (
            <li key={d.day}>
              <a
                href={`#day-${String(d.day)}`}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  position: 'relative',
                  display: 'block',
                  padding: '10px 14px',
                  paddingLeft: 18,
                  borderLeft: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                  color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  transition: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <span style={{ display: 'block' }}>Day {String(d.day)}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                  {String(d.count)} {d.count === 1 ? 'stop' : 'stops'}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function collectDays(spots: ItinerarySpot[]): { day: number; count: number }[] {
  const map = new Map<number, number>()
  spots.forEach((s) => {
    map.set(s.dayNumber, (map.get(s.dayNumber) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, count]) => ({ day, count }))
}
