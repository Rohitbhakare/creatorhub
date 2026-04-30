/**
 * Streak chip — flame glyph + day count. Used in the right-rail quest
 * dock and in `/quests`. Coral usage is allow-list spot 6 (user state).
 *
 * SSR-safe.
 */

import { Pill } from './pill'

interface StreakChipProps {
  /** Number of consecutive days the user has been active. */
  days: number
  /** Whether the streak is at risk (e.g., not yet logged in today). */
  atRisk?: boolean
}

export function StreakChip({ days, atRisk = false }: StreakChipProps) {
  return (
    <Pill
      variant="tint"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: atRisk ? 0.7 : 1,
      }}
      aria-label={`${String(days)}-day streak${atRisk ? ' — at risk' : ''}`}
    >
      <FlameIcon dim={atRisk} />
      <span style={{ fontSize: 11, fontWeight: 600 }}>{days}d</span>
    </Pill>
  )
}

function FlameIcon({ dim }: { dim: boolean }) {
  return (
    <svg
      width="12"
      height="14"
      viewBox="0 0 12 14"
      fill={dim ? 'var(--ink-muted)' : 'var(--primary)'}
      aria-hidden
    >
      <path d="M6 0c1 2 3 3 3 6 0 1.4-.7 2.6-1.7 3.4 0-.8-.4-1.6-1-2.2.2 1.4-.7 2.6-1.6 3.4-.5.4-.7 1-.7 1.6C2 11.4 1 9.8 1 8.2 1 5.5 3.5 4 5 1.5 5.4 1 5.7.5 6 0z" />
    </svg>
  )
}
