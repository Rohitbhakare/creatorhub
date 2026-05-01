'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export interface ScheduledDateRef {
  id: string
  /** ISO 8601 timestamp. Only the date part is shown; time is the trip start. */
  startsAt: string
  capacity: number
  seatsBooked: number
}

interface Props {
  scheduledDates: readonly ScheduledDateRef[]
  /** Optional clock for tests; defaults to `new Date()`. */
  now?: Date
  /** Locale day-1 of the calendar (defaults to today's month). */
  initialMonth?: Date
  onPick: (dateId: string) => void
  /** Suppress the second month on narrow viewports. Default false. */
  singleMonth?: boolean
}

/**
 * Dual-month calendar (E5.4 T2). Hand-rolled — no library.
 *
 * 2 side-by-side months on desktop (left = current, right = next month).
 * Single month on mobile via the `singleMonth` prop. Disabled days:
 *   - past dates
 *   - dates not in `scheduledDates`
 *   - sold-out dates (seatsBooked >= capacity)
 *
 * Keyboard nav (focus on a day):
 *   - Arrow keys: ±1 day / ±7 days
 *   - Home / End: first / last day of week
 *   - PageUp / PageDown: previous / next month
 *   - Enter / Space: pick the focused date
 */
export function DualMonthCalendar({
  scheduledDates,
  now = new Date(),
  initialMonth,
  onPick,
  singleMonth = false,
}: Props) {
  const startMonth = initialMonth ?? startOfMonth(now)
  const [viewStart, setViewStart] = useState<Date>(startMonth)
  const todayKey = ymd(now)

  const datesByYmd = useMemo(() => {
    const map = new Map<string, ScheduledDateRef>()
    for (const d of scheduledDates) map.set(ymd(new Date(d.startsAt)), d)
    return map
  }, [scheduledDates])

  const [focusedKey, setFocusedKey] = useState<string | null>(() => {
    const firstAvailable = [...scheduledDates]
      .filter((d) => new Date(d.startsAt).getTime() >= now.getTime() && d.seatsBooked < d.capacity)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0]
    return firstAvailable ? ymd(new Date(firstAvailable.startsAt)) : null
  })
  const gridRef = useRef<HTMLDivElement>(null)

  // Keep the focused day's button focused after re-render (PgUp/PgDn shifts the view).
  useEffect(() => {
    if (!focusedKey) return
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusedKey}"]`)
    el?.focus()
  }, [focusedKey, viewStart])

  const months = singleMonth ? [viewStart] : [viewStart, addMonths(viewStart, 1)]

  const onKey = (e: React.KeyboardEvent): void => {
    if (!focusedKey) return
    const cur = parseYmd(focusedKey)
    let next: Date | null = null
    switch (e.key) {
      case 'ArrowLeft':
        next = addDays(cur, -1)
        break
      case 'ArrowRight':
        next = addDays(cur, 1)
        break
      case 'ArrowUp':
        next = addDays(cur, -7)
        break
      case 'ArrowDown':
        next = addDays(cur, 7)
        break
      case 'Home':
        next = addDays(cur, -((cur.getDay() + 6) % 7)) // back to Monday
        break
      case 'End':
        next = addDays(cur, 6 - ((cur.getDay() + 6) % 7)) // forward to Sunday
        break
      case 'PageUp':
        next = addMonths(cur, -1)
        break
      case 'PageDown':
        next = addMonths(cur, 1)
        break
      case 'Enter':
      case ' ': {
        const ref = datesByYmd.get(focusedKey)
        if (ref && ref.seatsBooked < ref.capacity && cur.getTime() >= startOfDay(now).getTime()) {
          e.preventDefault()
          onPick(ref.id)
        }
        return
      }
      default:
        return
    }
    e.preventDefault()
    setFocusedKey(ymd(next))
    // Shift the view if the new focus is outside the rendered range.
    const lastVisible = addMonths(viewStart, singleMonth ? 1 : 2)
    if (next < viewStart) setViewStart(startOfMonth(next))
    else if (next >= lastVisible) setViewStart(startOfMonth(addMonths(next, singleMonth ? 0 : -1)))
  }

  return (
    <div
      onKeyDown={onKey}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => {
            setViewStart(addMonths(viewStart, -1))
          }}
          style={navBtnStyle}
        >
          ←
        </button>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink)',
          }}
        >
          {months.map((m) => formatMonthYear(m)).join(' · ')}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => {
            setViewStart(addMonths(viewStart, 1))
          }}
          style={navBtnStyle}
        >
          →
        </button>
      </div>

      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: singleMonth ? '1fr' : '1fr 1fr',
          gap: 24,
        }}
      >
        {months.map((m) => (
          <MonthGrid
            key={m.toISOString()}
            month={m}
            todayKey={todayKey}
            datesByYmd={datesByYmd}
            now={now}
            focusedKey={focusedKey}
            setFocusedKey={setFocusedKey}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  )
}

interface MonthGridProps {
  month: Date
  todayKey: string
  datesByYmd: Map<string, ScheduledDateRef>
  now: Date
  focusedKey: string | null
  setFocusedKey: (k: string) => void
  onPick: (id: string) => void
}

function MonthGrid({ month, todayKey, datesByYmd, now, focusedKey, setFocusedKey, onPick }: MonthGridProps) {
  const cells = monthCells(month)
  const startOfTodayMs = startOfDay(now).getTime()
  return (
    <div role="grid" aria-label={formatMonthYear(month)}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 6,
          fontFamily: 'var(--font-mono, var(--font-sans))',
          fontSize: 10,
          color: 'var(--ink-muted)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${String(i)}`} aria-hidden />
          const key = ymd(cell)
          const ref = datesByYmd.get(key)
          const isPast = cell.getTime() < startOfTodayMs
          const isToday = key === todayKey
          const isAvailable = !isPast && ref !== undefined && ref.seatsBooked < ref.capacity
          const isSoldOut = !isPast && ref !== undefined && ref.seatsBooked >= ref.capacity
          const isFocused = focusedKey === key
          const seatsLeftStr = ref ? String(ref.capacity - ref.seatsBooked) : '0'
          const dayLabel = `${cell.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}${
            isAvailable
              ? ` — ${seatsLeftStr} seats left`
              : isSoldOut
                ? ' — sold out'
                : isPast
                  ? ' — past'
                  : ' — not available'
          }`
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              data-day={key}
              tabIndex={isFocused ? 0 : -1}
              aria-disabled={!isAvailable}
              aria-label={dayLabel}
              onClick={() => {
                if (!isAvailable) return
                setFocusedKey(key)
                onPick(ref.id)
              }}
              onFocus={() => {
                setFocusedKey(key)
              }}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 'var(--radius-sm, 6px)',
                border: 'none',
                background: isAvailable
                  ? isFocused
                    ? 'var(--primary-tint)'
                    : 'var(--surface-alt)'
                  : 'transparent',
                color: isAvailable
                  ? isFocused
                    ? 'var(--primary-deep)'
                    : 'var(--ink)'
                  : isSoldOut
                    ? 'var(--ink-muted)'
                    : 'var(--ink-faint, var(--ink-muted))',
                fontSize: 13,
                fontWeight: isToday ? 700 : 500,
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                position: 'relative',
                fontFamily: 'inherit',
                outline: isFocused ? '2px solid var(--primary)' : 'none',
                outlineOffset: 0,
                textDecoration: isSoldOut ? 'line-through' : 'none',
              }}
            >
              {cell.getDate()}
              {isToday && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--primary)',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const navBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: 'none',
  background: 'var(--surface-alt)',
  color: 'var(--ink)',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
} as const

// ── Date helpers ────────────────────────────────────────────────────────────

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${String(y)}-${m}-${day}`
}

function parseYmd(key: string): Date {
  const [y, m, d] = key.split('-').map((s) => parseInt(s, 10))
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

/**
 * Returns 42 cells (6 rows × 7 cols) for a Mon-start calendar of `month`.
 * Cells outside the month are `null` so the grid renders blanks for padding.
 */
function monthCells(month: Date): (Date | null)[] {
  const first = startOfMonth(month)
  const dayOfWeekMonStart = (first.getDay() + 6) % 7 // Mon=0 .. Sun=6
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < dayOfWeekMonStart; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  // 42 cells = 6 rows; pad to that for visual stability.
  while (cells.length < 42) cells.push(null)
  return cells
}
