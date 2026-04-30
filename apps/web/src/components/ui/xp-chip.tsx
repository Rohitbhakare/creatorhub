/**
 * XP chip — small pill showing current XP toward next level. Composes
 * `<Pill variant="tint">` + `<Ring>` so the visual style stays in lock
 * with the design system. Coral usage here is SRS allow-list spot 6
 * (user state, not chrome).
 *
 * SSR-safe.
 */

import { Pill } from './pill'
import { Ring } from './ring'

interface XPChipProps {
  /** Current level (1, 2, 3, …). */
  level: number
  /** Current XP within the level. */
  xp: number
  /** XP threshold for next level. */
  nextLevelXp: number
}

export function XPChip({ level, xp, nextLevelXp }: XPChipProps) {
  const progress = nextLevelXp > 0 ? xp / nextLevelXp : 0
  return (
    <Pill
      variant="tint"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px 4px 4px',
      }}
      aria-label={`Level ${String(level)}, ${String(xp)} of ${String(nextLevelXp)} XP`}
    >
      <Ring size={20} progress={progress} stroke={2}>
        <span style={{ fontSize: 9, fontWeight: 700 }}>{level}</span>
      </Ring>
      <span style={{ fontSize: 11, fontWeight: 600 }}>
        {xp}/{nextLevelXp} XP
      </span>
    </Pill>
  )
}
