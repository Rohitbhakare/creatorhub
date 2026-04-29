'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { LeaderboardRow } from '@/lib/api'

type Scope = 'city' | 'national' | 'all-time'

const TABS: { id: Scope; label: string }[] = [
  { id: 'city', label: 'Your city' },
  { id: 'national', label: 'National' },
  { id: 'all-time', label: 'All-time' },
]

export function LeaderboardTabs({
  initialScope,
  initialRows,
}: {
  initialScope: Scope
  initialRows: LeaderboardRow[]
}) {
  const router = useRouter()
  const [scope, setScope] = useState<Scope>(initialScope)
  const [, startTransition] = useTransition()

  function go(s: Scope) {
    setScope(s)
    startTransition(() => {
      router.replace(`/quests?scope=${s}`)
    })
  }

  return (
    <div>
      <div
        role="tablist"
        style={{
          display: 'inline-flex',
          gap: 4,
          padding: 4,
          background: 'var(--surface-alt)',
          borderRadius: 999,
          marginBottom: 20,
        }}
      >
        {TABS.map((t) => {
          const isActive = scope === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                go(t.id)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 0,
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {initialRows.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
          Leaderboard fills in as travellers earn XP. Check back tomorrow.
        </p>
      ) : (
        <ol
          className="ch-card"
          style={{ listStyle: 'none', padding: 0, margin: 0, overflow: 'hidden' }}
        >
          {initialRows.map((row, i) => (
            <motion.li
              key={`${row.userId}-${String(row.rank)}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
                delay: Math.min(i * 0.03, 0.4),
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 36px minmax(0, 1fr) auto',
                gap: 12,
                alignItems: 'center',
                padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
                background: row.isMe ? 'var(--primary-tint)' : 'transparent',
                color: row.isMe ? 'var(--primary-deep)' : 'var(--ink)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 18,
                  fontWeight: 600,
                  textAlign: 'right',
                  color: row.rank <= 3 ? 'var(--primary)' : row.isMe ? 'inherit' : 'var(--ink-muted)',
                }}
              >
                {row.rank <= 3 ? medal(row.rank) : `#${String(row.rank)}`}
              </span>
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #d4b896, #a07c5a)',
                  color: 'white',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {row.displayName.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {row.displayName}
                  {row.isMe && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
                      YOU
                    </span>
                  )}
                </div>
                {row.city && (
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{row.city}</div>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  color: row.isMe ? 'var(--primary-deep)' : 'var(--ink)',
                }}
              >
                {Intl.NumberFormat('en-IN', { notation: 'compact' }).format(row.xp)} XP
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  )
}

function medal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${String(rank)}`
}
