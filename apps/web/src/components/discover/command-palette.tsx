'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

interface Suggestion {
  contents: { id: string; title: string; type: string; creatorName: string | null }[]
  creators: { id: string; username: string; displayName: string; vertical: string }[]
  cities: { name: string; count: number }[]
}

const TRENDING = [
  'Konkan road trip',
  'Spiti before snow',
  'Monsoon hills',
  'Goa beyond beaches',
  'Ladakh in October',
  'Hampi backpack',
]

const RECENT_KEY = 'ch_recent_searches'

function readRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : []
  } catch {
    return []
  }
}

function pushRecent(q: string): void {
  if (typeof window === 'undefined') return
  const cur = readRecent().filter((r) => r !== q)
  cur.unshift(q)
  localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, 5)))
}

/**
 * Cmd+K command palette — global search overlay.
 * Cold state: recent + trending; typing state: live suggestions.
 */
export function CommandPalette() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion>({
    contents: [],
    creators: [],
    cities: [],
  })
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const recent = open ? readRecent() : []

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((p) => !p)
        return
      }
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    return () => {
      clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setSuggestions({ contents: [], creators: [], cities: [] })
      return
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/discover/suggest?q=${encodeURIComponent(q.trim())}`, {
            credentials: 'same-origin',
          })
          if (!res.ok) return
          const data = (await res.json()) as Suggestion
          setSuggestions(data)
        } catch {
          /* ignore */
        }
      })
    }, 180)
    return () => {
      clearTimeout(handle)
    }
  }, [q, open])

  function close() {
    setOpen(false)
    setQ('')
  }

  function go(query: string, href?: string) {
    pushRecent(query)
    close()
    router.push(href ?? `/discover?q=${encodeURIComponent(query)}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Enter' && q.trim().length >= 2) {
      go(q.trim())
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.18 }}
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(14, 15, 18, 0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
          }}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: reduced ? 0.1 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '76vh',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid var(--hairline)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.8" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                }}
                onKeyDown={onKeyDown}
                placeholder="Search creators, places, trips…"
                aria-label="Search"
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 0,
                  background: 'transparent',
                  fontSize: 16,
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-muted)',
                  padding: '3px 6px',
                  borderRadius: 4,
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--hairline)',
                }}
              >
                Esc
              </span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {q.trim().length < 2 ? (
                <Cold recent={recent} onPick={go} />
              ) : (
                <Live q={q.trim()} suggestions={suggestions} onPick={go} />
              )}
            </div>

            <footer
              style={{
                padding: '10px 20px',
                borderTop: '1px solid var(--hairline)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-muted)',
                display: 'flex',
                gap: 16,
                background: 'var(--surface-alt)',
              }}
            >
              <span>↵ open</span>
              <span>Esc close</span>
              <span style={{ marginLeft: 'auto' }}>⌘K toggle</span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Cold({ recent, onPick }: { recent: string[]; onPick: (q: string) => void }) {
  return (
    <div style={{ padding: 16 }}>
      {recent.length > 0 && (
        <Group title="Recent">
          {recent.map((r) => (
            <Row key={r} label={r} onClick={() => { onPick(r) }} />
          ))}
        </Group>
      )}
      <Group title="Trending">
        {TRENDING.map((t) => (
          <Row key={t} label={t} onClick={() => { onPick(t) }} />
        ))}
      </Group>
    </div>
  )
}

function Live({
  q,
  suggestions,
  onPick,
}: {
  q: string
  suggestions: Suggestion
  onPick: (q: string, href?: string) => void
}) {
  const empty =
    suggestions.contents.length === 0 &&
    suggestions.creators.length === 0 &&
    suggestions.cities.length === 0
  return (
    <div style={{ padding: 16 }}>
      <Row
        label={`Search "${q}"`}
        sub="Press Enter to see all results"
        onClick={() => {
          onPick(q)
        }}
        emphasised
      />
      {suggestions.contents.length > 0 && (
        <Group title="Stories">
          {suggestions.contents.map((c) => (
            <Row
              key={c.id}
              label={c.title}
              sub={c.creatorName ? `${c.type} · ${c.creatorName}` : c.type}
              onClick={() => {
                onPick(q, `/content/${c.id}`)
              }}
            />
          ))}
        </Group>
      )}
      {suggestions.creators.length > 0 && (
        <Group title="Creators">
          {suggestions.creators.map((c) => (
            <Row
              key={c.id}
              label={c.displayName}
              sub={`@${c.username}`}
              onClick={() => {
                onPick(q, `/${c.vertical}/${c.username}`)
              }}
            />
          ))}
        </Group>
      )}
      {suggestions.cities.length > 0 && (
        <Group title="Cities">
          {suggestions.cities.map((c) => (
            <Row
              key={c.name}
              label={c.name}
              sub={`${String(c.count)} stories`}
              onClick={() => {
                onPick(c.name, `/discover?city=${encodeURIComponent(c.name)}`)
              }}
            />
          ))}
        </Group>
      )}
      {empty && (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '20px 8px' }}>
          No quick matches — press Enter to search the full index.
        </p>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 8 }}>
      <h3
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          padding: '8px 12px',
          margin: 0,
        }}
      >
        {title}
      </h3>
      <div role="listbox">{children}</div>
    </section>
  )
}

function Row({
  label,
  sub,
  onClick,
  emphasised,
}: {
  label: string
  sub?: string
  onClick: () => void
  emphasised?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        border: 0,
        background: 'transparent',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-alt)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span
        style={{
          fontSize: emphasised ? 15 : 14,
          fontWeight: emphasised ? 600 : 500,
          color: 'var(--ink)',
        }}
      >
        {label}
      </span>
      {sub && <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{sub}</span>}
    </button>
  )
}

function isInputFocused(): boolean {
  const a = document.activeElement
  if (!a) return false
  const tag = a.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || (a as HTMLElement).isContentEditable
}
