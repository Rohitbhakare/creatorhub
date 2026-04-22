'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Status = 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed'

const OPTIONS: Status[] = [
  'scheduled',
  'pending',
  'processing',
  'completed',
  'failed',
]

export function PayoutStatusFilter({
  current,
}: {
  current: Status
}): React.JSX.Element {
  const router = useRouter()
  const search = useSearchParams()

  function select(status: Status): void {
    const next = new URLSearchParams(search.toString())
    next.set('status', status)
    router.push(`/payouts?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {OPTIONS.map((s) => {
        const active = s === current
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              select(s)
            }}
            className="rounded-full px-3 py-1 text-xs font-medium border"
            style={{
              borderColor: active
                ? 'var(--color-coral)'
                : 'var(--color-border-strong)',
              backgroundColor: active
                ? 'var(--color-coral)'
                : 'transparent',
              color: active ? '#fff' : 'var(--color-text)',
            }}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}
