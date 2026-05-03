'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition, startTransition as reactStartTransition } from 'react'

type Scope = 'near-you' | 'following' | 'all'

interface FilterDef {
  id: string
  label: string
}

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'near-you', label: 'Near you' },
  { id: 'following', label: 'Following' },
  { id: 'all', label: 'All' },
]

const FILTERS: FilterDef[] = [
  { id: 'all', label: 'All' },
  { id: 'post', label: 'Posts' },
  { id: 'itinerary', label: 'Itineraries' },
  { id: 'experience', label: 'Experiences' },
  { id: 'event', label: 'Events' },
]

interface Props {
  scope: Scope
  type: string | undefined
  isGuest: boolean
  /** Extra params already on the URL we want to preserve (e.g. city). */
  preserve?: Record<string, string | undefined>
}

/**
 * Client-side filter chip rail. The previous server <Link> chips had to wait
 * for the full RSC roundtrip before the active state flipped — clicks felt
 * sluggish (300–800ms before any visual feedback). useOptimistic flips the
 * pill colour immediately while React Transitions stream the new feed in.
 */
export function FeedChipRail({ scope, type, isGuest, preserve }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [optimisticScope, setOptimisticScope] = useOptimistic(scope)
  const [optimisticType, setOptimisticType] = useOptimistic(type ?? 'all')

  function buildHref(nextScope: Scope, nextType: string): string {
    const params = new URLSearchParams()
    params.set('scope', nextScope)
    if (nextType !== 'all') params.set('type', nextType)
    if (preserve) {
      for (const [k, v] of Object.entries(preserve)) {
        if (v !== undefined && v !== '') params.set(k, v)
      }
    }
    return `/?${params.toString()}`
  }

  function navigate(nextScope: Scope, nextType: string) {
    startTransition(() => {
      reactStartTransition(() => {
        setOptimisticScope(nextScope)
        setOptimisticType(nextType)
      })
      router.push(buildHref(nextScope, nextType), { scroll: false })
    })
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 72,
        zIndex: 20,
        background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--hairline)',
        marginTop: 8,
      }}
    >
      <div
        className="ch-container ch-chip-rail-pad"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          overflowX: 'auto',
          opacity: pending ? 0.92 : 1,
          transition: 'opacity 120ms ease-out',
        }}
      >
        <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
          {SCOPES.map((s) => {
            const guestDisabled = isGuest && s.id === 'following'
            const isActive = optimisticScope === s.id && !guestDisabled
            if (guestDisabled) {
              // Round-5 audit: this used to render as a `disabled` chip
              // (greyed out, looked like dead content). For guests this
              // is a real conversion opportunity, not a disabled state —
              // restyle with a subtle coral underline + arrow so it reads
              // as a CTA. Same /signin?next=/ href.
              return (
                <Link
                  key={s.id}
                  href="/signin?next=/"
                  style={{
                    ...chipStyle({ active: false, disabled: false, kind: 'scope' }),
                    color: 'var(--primary-text-bg)',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    textDecorationThickness: 1.5,
                  }}
                >
                  Follow creators
                  <span aria-hidden style={{ marginLeft: 4, fontSize: 12 }}>→</span>
                </Link>
              )
            }
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  navigate(s.id, optimisticType)
                }}
                aria-pressed={isActive}
                style={chipStyle({ active: isActive, disabled: false, kind: 'scope' })}
              >
                {s.label}
              </button>
            )
          })}
        </div>
        <div
          style={{ width: 1, height: 22, background: 'var(--hairline)', flex: '0 0 auto' }}
        />
        <div style={{ display: 'flex', gap: 4, flex: '1 1 auto', overflowX: 'auto' }}>
          {FILTERS.map((f) => {
            const isActive = optimisticType === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  navigate(optimisticScope, f.id)
                }}
                aria-pressed={isActive}
                style={chipStyle({ active: isActive, disabled: false, kind: 'filter' })}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function chipStyle(opts: {
  active: boolean
  disabled: boolean
  kind: 'scope' | 'filter'
}): React.CSSProperties {
  const { active, disabled, kind } = opts
  const activeBg =
    kind === 'scope' ? 'var(--ink)' : 'var(--primary-tint)'
  const activeColor =
    kind === 'scope' ? 'white' : 'var(--primary-deep)'
  return {
    padding: '7px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? activeColor : disabled ? 'var(--ink-muted)' : 'var(--ink-soft)',
    background: active ? activeBg : 'transparent',
    border: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 140ms ease-out, color 140ms ease-out',
  }
}
