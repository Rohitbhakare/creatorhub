'use client'

import { useRouter } from 'next/navigation'

const WINDOWS = ['7d', '30d'] as const
type Window = (typeof WINDOWS)[number]

export function SearchAnalyticsWindow({
  current,
}: {
  current: Window
}): React.JSX.Element {
  const router = useRouter()
  return (
    <div className="flex items-center gap-1">
      {WINDOWS.map((w) => {
        const active = w === current
        return (
          <button
            key={w}
            type="button"
            onClick={() => {
              router.push(`/analytics/search?window=${w}`)
            }}
            className="rounded-md px-3 py-1.5 text-xs font-medium border"
            style={{
              borderColor: active
                ? 'var(--color-coral)'
                : 'var(--color-border-strong)',
              backgroundColor: active ? 'var(--color-coral)' : 'transparent',
              color: active ? '#FFFFFF' : 'var(--color-text)',
            }}
          >
            {w === '7d' ? 'Last 7 days' : 'Last 30 days'}
          </button>
        )
      })}
    </div>
  )
}
