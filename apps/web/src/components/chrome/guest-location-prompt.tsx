'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface GuestLocationPromptProps {
  cities: { name: string; count: number }[]
}

const STORAGE_KEY = 'ch_guest_city'
const SKIP_KEY = 'ch_guest_city_skip'

/**
 * Inline banner asking the guest for a city so the home feed surfaces
 * "near you" content. Saves the choice in localStorage; sets a `?city=`
 * query param so the SSR'd feed picks it up on next load. Dismissible.
 *
 * Hidden by default until the script confirms (a) no city saved, and
 * (b) not previously skipped — so the SSR HTML doesn't flash the banner
 * for users who already picked.
 */
export function GuestLocationPrompt({ cities }: GuestLocationPromptProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [show, setShow] = useState(false)
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasCity = Boolean(localStorage.getItem(STORAGE_KEY))
    const skipped = sessionStorage.getItem(SKIP_KEY) === '1'
    if (!hasCity && !skipped) setShow(true)
  }, [])

  function pick(name: string) {
    localStorage.setItem(STORAGE_KEY, name)
    setShow(false)
    const url = new URL(window.location.href)
    url.searchParams.set('city', name)
    router.replace(`${url.pathname}${url.search}`)
    router.refresh()
  }

  function skip() {
    sessionStorage.setItem(SKIP_KEY, '1')
    setShow(false)
  }

  function useDeviceLocation() {
    if (!('geolocation' in navigator)) {
      setPicking(true)
      return
    }
    const onSuccess = (pos: GeolocationPosition) => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/cities/nearby?lat=${String(pos.coords.latitude)}&lng=${String(
              pos.coords.longitude,
            )}`,
          )
          if (!res.ok) {
            setPicking(true)
            return
          }
          const data = (await res.json()) as { name?: string }
          if (data.name) pick(data.name)
          else setPicking(true)
        } catch {
          setPicking(true)
        }
      })()
    }
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        setPicking(true)
      },
      { timeout: 6_000, maximumAge: 600_000 },
    )
  }

  const filtered =
    query.trim().length > 0
      ? cities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : cities.slice(0, 8)

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduced ? 0.1 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Pick your city"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--ch-page-max, 1640px)',
              margin: '0 auto',
              padding: '14px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 240px', minWidth: 240 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  marginBottom: 4,
                }}
              >
                Where are you exploring from?
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                We&rsquo;ll surface trips near you. You can change this anytime.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flex: '1 1 380px', flexWrap: 'wrap' }}>
              {!picking ? (
                <>
                  <button
                    type="button"
                    onClick={useDeviceLocation}
                    className="ch-btn ch-btn-primary"
                    style={{ padding: '10px 16px', fontSize: 13 }}
                  >
                    📍 Use my location
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPicking(true)
                    }}
                    className="ch-btn ch-btn-ghost"
                    style={{ padding: '10px 16px', fontSize: 13 }}
                  >
                    Pick a city
                  </button>
                  <button
                    type="button"
                    onClick={skip}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'var(--ink-muted)',
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '10px 8px',
                      fontFamily: 'inherit',
                    }}
                  >
                    Skip for now
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                    }}
                    placeholder="Type a city…"
                    autoFocus
                    style={{
                      flex: '1 1 200px',
                      padding: '10px 14px',
                      borderRadius: 999,
                      border: '1.5px solid var(--hairline-strong)',
                      background: 'var(--bg)',
                      fontSize: 13.5,
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                      minWidth: 200,
                    }}
                  />
                  <button
                    type="button"
                    onClick={skip}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'var(--ink-muted)',
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '10px 8px',
                      fontFamily: 'inherit',
                    }}
                  >
                    Skip
                  </button>
                </>
              )}
            </div>
          </div>

          {picking && filtered.length > 0 && (
            <div
              style={{
                maxWidth: 'var(--ch-page-max, 1640px)',
                margin: '0 auto',
                padding: '0 32px 14px',
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              {filtered.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    pick(c.name)
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--hairline)',
                    background: 'var(--surface)',
                    fontSize: 12.5,
                    color: 'var(--ink)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {c.name}
                  {c.count > 0 && (
                    <span style={{ color: 'var(--ink-muted)', marginLeft: 4 }}>
                      {String(c.count)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
