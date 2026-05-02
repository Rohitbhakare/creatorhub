'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { SubCategoryRow } from '@/lib/api/discover'

interface Props {
  subCategories: SubCategoryRow[]
  /**
   * When true, the sheet listens for `?filters=open` in the URL and opens
   * itself (used by the v3 sidebar's "+ More filters" link). Closing the
   * sheet strips the param. Default: false (in-component button only).
   */
  urlParamControlsOpen?: boolean
  /**
   * When true, hide the in-component "Filters" trigger button. Combined
   * with `urlParamControlsOpen` this gives the v3 sidebar exclusive control.
   * Default: false.
   */
  hideTrigger?: boolean
}

const CONTENT_TYPES: { id: string; label: string }[] = [
  { id: 'post', label: 'Posts' },
  { id: 'self_paced_itinerary', label: 'Itineraries' },
  { id: 'scheduled_experience', label: 'Experiences' },
  { id: 'event', label: 'Events' },
]
const TIME_WINDOWS = [
  { id: 'today', label: 'Today' },
  { id: 'this_weekend', label: 'This weekend' },
  { id: 'next_7d', label: 'Next 7 days' },
  { id: 'this_month', label: 'This month' },
]
const DURATIONS = [
  { id: 'day_trip', label: 'Day trip' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'short', label: 'Short (3–5 days)' },
  { id: 'long', label: 'Long (6+ days)' },
]
const BUDGETS = [
  { id: 'free', label: 'Free' },
  { id: 'lt2k', label: 'Under ₹2k' },
  { id: '2to5k', label: '₹2k–5k' },
  { id: '5to15k', label: '₹5k–15k' },
  { id: 'gt15k', label: 'Over ₹15k' },
]
const SEASONS = [
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'monsoon', label: 'Monsoon' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
]
const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'challenging', label: 'Challenging' },
  { id: 'expert', label: 'Expert' },
]
const GROUP_SIZES = [
  { id: 'solo', label: 'Solo' },
  { id: 'couple', label: 'Couple' },
  { id: 'small', label: 'Small group' },
  { id: 'large', label: 'Large group' },
]
const DISTANCES = [25, 50, 100, 250]

interface SheetState {
  subCategoryId: string | null
  type: string | null
  timeWindow: string | null
  durations: Set<string>
  budgets: Set<string>
  seasons: Set<string>
  difficulties: Set<string>
  groupSizes: Set<string>
  distanceKm: number | null
}

function readState(sp: URLSearchParams): SheetState {
  const csv = (key: string): Set<string> => {
    const v = sp.get(key)
    if (!v) return new Set()
    return new Set(v.split(',').map((s) => s.trim()).filter(Boolean))
  }
  const dist = parseInt(sp.get('distance_km') ?? '', 10)
  return {
    subCategoryId: sp.get('sub_category_id') || null,
    type: sp.get('type') || null,
    timeWindow: sp.get('time_window') || null,
    durations: csv('duration_buckets'),
    budgets: csv('budget_buckets'),
    seasons: csv('seasons'),
    difficulties: csv('difficulties'),
    groupSizes: csv('group_sizes'),
    distanceKm: DISTANCES.includes(dist) ? dist : null,
  }
}

function activeCount(s: SheetState): number {
  let n = 0
  if (s.subCategoryId) n++
  if (s.type) n++
  if (s.timeWindow) n++
  if (s.durations.size) n++
  if (s.budgets.size) n++
  if (s.seasons.size) n++
  if (s.difficulties.size) n++
  if (s.groupSizes.size) n++
  if (s.distanceKm) n++
  return n
}

function stateToParams(s: SheetState, base: URLSearchParams): URLSearchParams {
  // Preserve params we don't manage (q, starting_city_id, sort, vertical, etc).
  const next = new URLSearchParams(base)
  // Wipe managed keys so removing the only filter for a key drops it.
  for (const k of [
    'sub_category_id',
    'type',
    'time_window',
    'duration_buckets',
    'budget_buckets',
    'seasons',
    'difficulties',
    'group_sizes',
    'distance_km',
  ]) {
    next.delete(k)
  }
  if (s.subCategoryId) next.set('sub_category_id', s.subCategoryId)
  if (s.type) next.set('type', s.type)
  if (s.timeWindow) next.set('time_window', s.timeWindow)
  if (s.durations.size) next.set('duration_buckets', [...s.durations].join(','))
  if (s.budgets.size) next.set('budget_buckets', [...s.budgets].join(','))
  if (s.seasons.size) next.set('seasons', [...s.seasons].join(','))
  if (s.difficulties.size) next.set('difficulties', [...s.difficulties].join(','))
  if (s.groupSizes.size) next.set('group_sizes', [...s.groupSizes].join(','))
  if (s.distanceKm) next.set('distance_km', String(s.distanceKm))
  // Reset cursor when filters change.
  next.delete('cursor')
  return next
}

export function FilterSheet({
  subCategories,
  urlParamControlsOpen = false,
  hideTrigger = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  // URL-driven open: when the v3 sidebar's "+ More filters" link writes
  // `?filters=open`, the sheet picks that up and shows itself. Closing
  // strips the param so back-navigation doesn't re-open it.
  useEffect(() => {
    if (!urlParamControlsOpen) return
    const wantsOpen = searchParams.get('filters') === 'open'
    if (wantsOpen && !open) setOpen(true)
  }, [searchParams, urlParamControlsOpen, open])
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<SheetState>(() => readState(new URLSearchParams()))
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect viewport — bottom-sheet on mobile, side drawer on desktop.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent): void => {
      setIsDesktop(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => {
      mq.removeEventListener('change', handler)
    }
  }, [])

  // When the sheet opens, hydrate from the current URL (so re-opening
  // reflects whatever state Apply / chip removal left us in).
  useEffect(() => {
    if (open) {
      setState(readState(new URLSearchParams(searchParams.toString())))
    }
  }, [open, searchParams])

  // Debounced preview count — runs against /api/v1/discover/results?count_only=1
  // via a same-origin Next.js route handler we stand up below.
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const next = stateToParams(state, new URLSearchParams(searchParams.toString()))
      next.set('count_only', '1')
      next.set('limit', '1')
      fetch(`/api/discover/results-count?${next.toString()}`, { method: 'GET' })
        .then((r) => (r.ok ? (r.json() as Promise<{ count?: number | null }>) : Promise.reject(new Error('count fetch failed'))))
        .then((data) => {
          setPreviewCount(typeof data.count === 'number' ? data.count : null)
        })
        .catch(() => {
          setPreviewCount(null)
        })
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [state, open, searchParams])

  const count = useMemo(() => activeCount(state), [state])

  const closeSheet = (): void => {
    setOpen(false)
    if (urlParamControlsOpen && searchParams.get('filters') === 'open') {
      const next = new URLSearchParams(searchParams.toString())
      next.delete('filters')
      const qs = next.toString()
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
      })
    }
  }

  const apply = (): void => {
    const next = stateToParams(state, new URLSearchParams(searchParams.toString()))
    next.delete('filters')
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
      setOpen(false)
    })
  }

  const clearAll = (): void => {
    setState({
      subCategoryId: null,
      type: null,
      timeWindow: null,
      durations: new Set(),
      budgets: new Set(),
      seasons: new Set(),
      difficulties: new Set(),
      groupSizes: new Set(),
      distanceKm: null,
    })
  }

  const urlActive = activeCount(readState(new URLSearchParams(searchParams.toString())))

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          style={{
            padding: '9px 14px',
            borderRadius: 999,
            border: '1px solid var(--hairline)',
            background: urlActive > 0 ? 'var(--primary-tint)' : 'var(--surface)',
            color: urlActive > 0 ? 'var(--primary-deep)' : 'var(--ink)',
            fontSize: 13,
            fontWeight: urlActive > 0 ? 600 : 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M3 6h18M6 12h12M10 18h4" />
          </svg>
          Filters
          {urlActive > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 999,
                background: 'var(--primary-text-bg, var(--primary))',
                color: 'white',
                marginLeft: 2,
              }}
            >
              {urlActive}
            </span>
          )}
        </button>
      )}
      {open && (
        <Sheet isDesktop={isDesktop} onClose={closeSheet}>
          <header
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 className="ch-display" style={{ fontSize: 18, color: 'var(--ink)' }}>
              Filters {count > 0 && <span style={{ color: 'var(--ink-muted)' }}>({count})</span>}
            </h2>
            <button
              type="button"
              onClick={closeSheet}
              aria-label="Close filters"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
                color: 'var(--ink-muted)',
              }}
            >
              ×
            </button>
          </header>
          <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
            <Group label="Category">
              <select
                value={state.subCategoryId ?? ''}
                onChange={(e) => {
                  setState((s) => ({
                    ...s,
                    subCategoryId: e.target.value === '' ? null : e.target.value,
                  }))
                }}
                style={selectStyle}
              >
                <option value="">Any category</option>
                {subCategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </Group>
            <Group label="Content type">
              <ChipRow
                items={CONTENT_TYPES}
                selected={state.type}
                onSelect={(id) => {
                  setState((s) => ({ ...s, type: s.type === id ? null : id }))
                }}
              />
            </Group>
            <Group label="When">
              <ChipRow
                items={TIME_WINDOWS}
                selected={state.timeWindow}
                onSelect={(id) => {
                  setState((s) => ({ ...s, timeWindow: s.timeWindow === id ? null : id }))
                }}
              />
            </Group>
            <Group label="Duration">
              <MultiChipRow
                items={DURATIONS}
                selected={state.durations}
                onToggle={(id) => {
                  setState((s) => {
                    const next = new Set(s.durations)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return { ...s, durations: next }
                  })
                }}
              />
            </Group>
            <Group label="Budget">
              <MultiChipRow
                items={BUDGETS}
                selected={state.budgets}
                onToggle={(id) => {
                  setState((s) => {
                    const next = new Set(s.budgets)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return { ...s, budgets: next }
                  })
                }}
              />
            </Group>
            <Group label="Season">
              <MultiChipRow
                items={SEASONS}
                selected={state.seasons}
                onToggle={(id) => {
                  setState((s) => {
                    const next = new Set(s.seasons)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return { ...s, seasons: next }
                  })
                }}
              />
            </Group>
            <Group label="Difficulty">
              <MultiChipRow
                items={DIFFICULTIES}
                selected={state.difficulties}
                onToggle={(id) => {
                  setState((s) => {
                    const next = new Set(s.difficulties)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return { ...s, difficulties: next }
                  })
                }}
              />
            </Group>
            <Group label="Group size">
              <MultiChipRow
                items={GROUP_SIZES}
                selected={state.groupSizes}
                onToggle={(id) => {
                  setState((s) => {
                    const next = new Set(s.groupSizes)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return { ...s, groupSizes: next }
                  })
                }}
              />
            </Group>
            <Group label="Distance from me">
              <ChipRow
                items={DISTANCES.map((d) => ({ id: String(d), label: `${String(d)} km` }))}
                selected={state.distanceKm ? String(state.distanceKm) : null}
                onSelect={(id) => {
                  const n = parseInt(id, 10)
                  setState((s) => ({
                    ...s,
                    distanceKm: s.distanceKm === n ? null : (n as 25 | 50 | 100 | 250),
                  }))
                }}
              />
            </Group>
          </div>
          <footer
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontSize: 13,
                color: 'var(--ink-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                fontFamily: 'inherit',
                textDecoration: 'underline',
              }}
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={pending}
              className="ch-btn ch-btn-ink"
              style={{ padding: '10px 18px', minWidth: 160 }}
            >
              {previewCount === null
                ? 'Show results'
                : `Show ${previewCount.toLocaleString('en-IN')} ${
                    previewCount === 1 ? 'result' : 'results'
                  }`}
            </button>
          </footer>
        </Sheet>
      )}
    </>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--hairline)',
  background: 'var(--surface)',
  fontSize: 13,
  color: 'var(--ink)',
  fontFamily: 'inherit',
}

function Group({ label, children }: { label: string; children: React.ReactNode }): React.ReactNode {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        {label}
      </h3>
      {children}
    </div>
  )
}

interface ChipItem {
  id: string
  label: string
}

function ChipRow({
  items,
  selected,
  onSelect,
}: {
  items: ChipItem[]
  selected: string | null
  onSelect: (id: string) => void
}): React.ReactNode {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((it) => {
        const active = selected === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => {
              onSelect(it.id)
            }}
            style={chipStyle(active)}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function MultiChipRow({
  items,
  selected,
  onToggle,
}: {
  items: ChipItem[]
  selected: Set<string>
  onToggle: (id: string) => void
}): React.ReactNode {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((it) => {
        const active = selected.has(it.id)
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => {
              onToggle(it.id)
            }}
            style={chipStyle(active)}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid var(--hairline)',
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? 'white' : 'var(--ink)',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

function Sheet({
  isDesktop,
  onClose,
  children,
}: {
  isDesktop: boolean
  onClose: () => void
  children: React.ReactNode
}): React.ReactNode {
  // Lock body scroll while open. Cheap and prevents the underlying grid
  // from scrolling under the bottom-sheet on iOS.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 90,
        }}
      />
      <div
        role="dialog"
        aria-label="Filters"
        aria-modal="true"
        style={
          isDesktop
            ? {
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 420,
                background: 'var(--bg)',
                boxShadow: '-12px 0 32px rgba(0,0,0,0.12)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
              }
            : {
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '90vh',
                background: 'var(--bg)',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                boxShadow: '0 -12px 32px rgba(0,0,0,0.12)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
              }
        }
      >
        {children}
      </div>
    </>
  )
}
