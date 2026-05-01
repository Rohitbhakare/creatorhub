'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

interface ChipDef {
  key: string
  label: string
  /**
   * For multi-select fields, the specific value to peel out of the CSV; for
   * single-select fields, leave undefined (the whole param is dropped).
   */
  value?: string
}

interface Props {
  /** Plain object form of the current URL search params. */
  params: Record<string, string>
  chips: ChipDef[]
}

/**
 * Renders the currently-applied filters as dismissible chips above the
 * results grid. Clicking × strips that filter from the URL and navigates
 * with `replace` so back doesn't restore the filter (Airbnb convention).
 */
export function FilterChipBar({ params, chips }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  if (chips.length === 0) return null

  const remove = (chip: ChipDef): void => {
    const next = new URLSearchParams(params)
    if (chip.value !== undefined) {
      // Multi-select CSV field: drop the matching value, keep others.
      const current = (next.get(chip.key) ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const remaining = current.filter((v) => v !== chip.value)
      if (remaining.length > 0) next.set(chip.key, remaining.join(','))
      else next.delete(chip.key)
    } else {
      next.delete(chip.key)
    }
    startTransition(() => {
      const qs = next.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    })
  }

  return (
    <div
      role="region"
      aria-label="Active filters"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 18,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          fontWeight: 700,
        }}
      >
        Active filters
      </span>
      {chips.map((c) => (
        <button
          key={`${c.key}:${c.value ?? '_'}`}
          type="button"
          onClick={() => {
            remove(c)
          }}
          disabled={pending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'var(--primary-tint)',
            color: 'var(--primary-deep)',
            border: '1px solid var(--primary-tint)',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: pending ? 'progress' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {c.label}
          <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          startTransition(() => {
            router.replace(pathname, { scroll: false })
          })
        }}
        disabled={pending}
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
        Clear all
      </button>
    </div>
  )
}
