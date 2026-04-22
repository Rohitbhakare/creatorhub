'use client'

import { useRouter } from 'next/navigation'

const TYPES = ['all', 'content', 'user', 'comment', 'review'] as const
type TypeValue = (typeof TYPES)[number]

export function ReportTypeFilter({
  current,
}: {
  current: TypeValue
}): React.JSX.Element {
  const router = useRouter()

  return (
    <div className="flex flex-wrap items-center gap-1">
      {TYPES.map((t) => {
        const active = t === current
        return (
          <button
            key={t}
            type="button"
            onClick={() => {
              const qs =
                t === 'all' ? '' : `?type=${encodeURIComponent(t)}`
              router.push(`/moderation${qs}`)
            }}
            className="rounded-md px-3 py-1.5 text-xs font-medium border"
            style={{
              borderColor: active
                ? 'var(--color-coral)'
                : 'var(--color-border-strong)',
              backgroundColor: active
                ? 'var(--color-coral)'
                : 'transparent',
              color: active ? '#FFFFFF' : 'var(--color-text)',
            }}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}
