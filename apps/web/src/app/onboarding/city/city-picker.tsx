'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface City {
  name: string
  count: number
}

interface CityPickerProps {
  cities: City[]
}

const FALLBACK_CITIES: City[] = [
  { name: 'Mumbai', count: 0 },
  { name: 'Bangalore', count: 0 },
  { name: 'Delhi', count: 0 },
  { name: 'Pune', count: 0 },
  { name: 'Hyderabad', count: 0 },
  { name: 'Chennai', count: 0 },
  { name: 'Kolkata', count: 0 },
  { name: 'Goa', count: 0 },
  { name: 'Ahmedabad', count: 0 },
  { name: 'Jaipur', count: 0 },
  { name: 'Chandigarh', count: 0 },
  { name: 'Coimbatore', count: 0 },
]

export function CityPicker({ cities }: CityPickerProps) {
  const router = useRouter()
  const list = cities.length > 0 ? cities : FALLBACK_CITIES
  const [picked, setPicked] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filtered =
    query.trim().length > 0
      ? list.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      : list

  function submit() {
    if (!picked) {
      setError('Pick a city to continue')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/onboarding/city', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ city_id: picked }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Could not save')
          return
        }
        router.replace('/onboarding/welcome')
        router.refresh()
      } catch {
        setError('Network error — please retry')
      }
    })
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Type a city…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
        }}
        aria-label="Search cities"
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 999,
          border: '1.5px solid var(--hairline-strong)',
          background: 'var(--surface)',
          fontSize: 15,
          color: 'var(--ink)',
          fontFamily: 'inherit',
          marginBottom: 20,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 32,
          maxHeight: 320,
          overflowY: 'auto',
          paddingBottom: 4,
        }}
        role="radiogroup"
        aria-label="City"
      >
        {filtered.map((c) => {
          const isPicked = picked === c.name
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={isPicked}
              onClick={() => {
                setPicked(c.name)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 999,
                border: `1.5px solid ${isPicked ? 'var(--primary)' : 'var(--hairline)'}`,
                background: isPicked ? 'var(--primary-tint)' : 'var(--surface)',
                color: isPicked ? 'var(--primary-deep)' : 'var(--ink)',
                fontSize: 13.5,
                fontWeight: isPicked ? 600 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span aria-hidden style={{ color: isPicked ? 'var(--primary)' : 'var(--ink-faint)' }}>
                ●
              </span>
              {c.name}
              {c.count > 0 && (
                <span style={{ color: 'var(--ink-muted)', fontSize: 11 }}>{String(c.count)}</span>
              )}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            No matches. Type a different city.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={submit}
          disabled={!picked || pending}
          className="ch-btn ch-btn-primary"
          style={{ padding: '14px 24px', fontSize: 14.5 }}
        >
          {pending ? 'Saving…' : 'Continue'}
        </button>
        <button
          type="button"
          onClick={() => {
            router.replace('/onboarding/welcome')
          }}
          className="ch-btn ch-btn-ghost"
        >
          Skip for now
        </button>
      </div>
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: '10px 14px',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
