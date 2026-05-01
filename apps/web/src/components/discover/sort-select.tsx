'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const SORTS = [
  { id: 'recent', label: 'Newest' },
  { id: 'trending', label: 'Trending' },
  { id: 'price_asc', label: 'Price: low → high' },
  { id: 'price_desc', label: 'Price: high → low' },
]

export function SortSelect({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = new URLSearchParams(searchParams.toString())
        next.set('sort', e.target.value)
        next.delete('cursor')
        startTransition(() => {
          router.push(`${pathname}?${next.toString()}`, { scroll: false })
        })
      }}
      aria-label="Sort"
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
  )
}
