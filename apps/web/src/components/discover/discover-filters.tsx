'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sort: string
  priceMin?: string
  priceMax?: string
  city?: string
  cities: string[]
  q?: string
  type?: string
  section?: string
}

const SORTS = [
  { id: 'relevance', label: 'Most relevant' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price: low → high' },
  { id: 'price_desc', label: 'Price: high → low' },
  { id: 'rating', label: 'Top rated' },
]

const PRICE_PRESETS = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under ₹2k', min: 0, max: 2000 },
  { label: '₹2k–5k', min: 2000, max: 5000 },
  { label: '₹5k–10k', min: 5000, max: 10000 },
  { label: 'Over ₹10k', min: 10000, max: undefined },
]

/**
 * Sort + filter controls for the discover page. The sort dropdown is a
 * native <select> for accessibility; the filter button opens a small popover
 * with city dropdown + price preset chips. All changes route via
 * router.push inside startTransition so the page updates without a full
 * navigation flash.
 */
export function DiscoverFilters({
  sort,
  priceMin,
  priceMax,
  city,
  cities,
  q,
  type,
  section,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function navigate(override: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged: Record<string, string | undefined> = {
      q,
      type,
      section,
      city,
      sort,
      priceMin,
      priceMax,
      ...override,
    }
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') params.set(k, v)
    }
    startTransition(() => {
      router.push(`/discover${params.toString() ? `?${params.toString()}` : ''}`, {
        scroll: false,
      })
    })
  }

  const activeFilterCount =
    (priceMin !== undefined ? 1 : 0) + (priceMax !== undefined ? 1 : 0) + (city ? 1 : 0)

  const isActivePrice = (min: number | undefined, max: number | undefined) =>
    String(min ?? '') === (priceMin ?? '') && String(max ?? '') === (priceMax ?? '')

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
      <select
        value={sort}
        onChange={(e) => {
          navigate({ sort: e.target.value })
        }}
        aria-label="Sort"
        disabled={pending}
        style={{
          padding: '9px 14px',
          borderRadius: 999,
          border: '1px solid var(--hairline)',
          background: 'var(--surface)',
          fontSize: 13,
          color: 'var(--ink)',
          fontFamily: 'inherit',
          cursor: pending ? 'progress' : 'pointer',
        }}
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          padding: '9px 14px',
          borderRadius: 999,
          border: '1px solid var(--hairline)',
          background:
            activeFilterCount > 0 ? 'var(--primary-tint)' : 'var(--surface)',
          color:
            activeFilterCount > 0 ? 'var(--primary-deep)' : 'var(--ink)',
          fontSize: 13,
          fontWeight: activeFilterCount > 0 ? 600 : 500,
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
        {activeFilterCount > 0 && (
          <span
            style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 999,
              background: 'var(--primary)',
              color: 'white',
              marginLeft: 2,
            }}
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop click-to-close */}
          <div
            aria-hidden
            onClick={() => {
              setOpen(false)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'transparent',
              zIndex: 30,
            }}
          />
          <div
            role="dialog"
            aria-label="Filters"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 320,
              background: 'var(--bg)',
              border: '1px solid var(--hairline)',
              borderRadius: 14,
              padding: 16,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
              zIndex: 40,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                City
              </label>
              <select
                value={city ?? ''}
                onChange={(e) => {
                  navigate({ city: e.target.value === '' ? undefined : e.target.value })
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--hairline)',
                  background: 'var(--surface)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">Anywhere in India</option>
                {cities.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                Price
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRICE_PRESETS.map((p) => {
                  const active = isActivePrice(p.min, p.max)
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        if (active) {
                          navigate({ priceMin: undefined, priceMax: undefined })
                        } else {
                          navigate({
                            priceMin: String(p.min),
                            priceMax: p.max !== undefined ? String(p.max) : undefined,
                          })
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        border: '1px solid var(--hairline)',
                        background: active ? 'var(--primary)' : 'var(--surface)',
                        color: active ? 'white' : 'var(--ink)',
                        fontSize: 12,
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  navigate({ priceMin: undefined, priceMax: undefined, city: undefined })
                }}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
