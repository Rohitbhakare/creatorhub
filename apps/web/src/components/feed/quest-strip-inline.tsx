import Link from 'next/link'
import type { QuestSummary } from '@/lib/api/types'

interface QuestStripInlineProps {
  summary: QuestSummary
  /** Width of the rolling streak window in days. Default 7. */
  streakWindow?: number
}

/**
 * v3 magazine quest strip — the "above the fold" gamification band that
 * sits between the chapter hero and the mood selector. WEB-FEED-FR-030.
 *
 * Four cards in a 1-1-1-1.4 grid (the active-quest CTA is wider). Server
 * component — no interactivity beyond the Link in the active-quest CTA.
 *
 * Coral usage on this surface (allow-list):
 *   - Level badge background (allow-list spot 6: user state)
 *   - XP bar fill                  (spot 6)
 *   - Streak block fills           (spot 6)
 *   - Active-quest CTA gradient    (spot 6 — gamification surface)
 *
 * Authed-only — render `null` for guests; the page composes the guest
 * variant separately (sign-in CTA card).
 */
export function QuestStripInline({ summary, streakWindow = 7 }: QuestStripInlineProps) {
  const xpPct = summary.xpToNextLevel > 0 ? Math.min(100, (summary.xp / summary.xpToNextLevel) * 100) : 0
  const xpRemaining = Math.max(0, summary.xpToNextLevel - summary.xp)
  const dailyPct = summary.totalToday > 0 ? (summary.completedToday / summary.totalToday) * 100 : 0
  const dailyRemaining = Math.max(0, summary.totalToday - summary.completedToday)
  const streakClamped = Math.max(0, Math.min(streakWindow, summary.streakDays))

  return (
    <section
      aria-label="Today's quests"
      style={{ maxWidth: 1240, margin: '24px auto 0', padding: '0 32px' }}
    >
      <div className="ch-quest-strip">
        {/* Level + XP */}
        <div className="ch-card ch-quest-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="ch-level-badge">L{String(summary.level)}</div>
            <div>
              <div className="ch-mono-kicker">Explorer</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>
                {levelLabel(summary.level)}
              </div>
            </div>
          </div>
          <div className="ch-progress-track" aria-hidden>
            <div className="ch-progress-fill" style={{ width: `${String(xpPct)}%` }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              color: 'var(--ink-muted)',
              marginTop: 8,
            }}
          >
            <span>
              <strong style={{ color: 'var(--ink)' }}>{String(summary.xp)}</strong> xp
            </span>
            <span>
              {String(xpRemaining)} to L{String(summary.level + 1)}
            </span>
          </div>
        </div>

        {/* Streak */}
        <div className="ch-card ch-quest-card">
          <div className="ch-mono-kicker" style={{ marginBottom: 8 }}>
            Reading streak
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <span
              className="ch-display"
              style={{ fontSize: 32, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em' }}
            >
              {String(summary.streakDays)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500 }}>
              days
            </span>
            <span style={{ marginLeft: 'auto' }} aria-hidden>
              <FlameIcon size={20} color="var(--primary)" />
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3 }} aria-hidden>
            {Array.from({ length: streakWindow }).map((_, i) => {
              const filled = i < streakClamped
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 2,
                    background: filled ? 'var(--primary)' : 'var(--surface-alt)',
                    opacity: filled ? 1 - (streakClamped - 1 - i) * 0.08 : 1,
                  }}
                />
              )
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-muted)' }}>
            {summary.brokenStreakAlert
              ? 'Read 1 story to keep the streak alive'
              : `${String(streakClamped)} of last ${String(streakWindow)} days`}
          </div>
        </div>

        {/* Daily quest count */}
        <div className="ch-card ch-quest-card">
          <div className="ch-mono-kicker" style={{ marginBottom: 8 }}>
            Today's quests
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span
              className="ch-display"
              style={{ fontSize: 32, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em' }}
            >
              {String(summary.completedToday)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500 }}>
              of {String(summary.totalToday)} done
            </span>
          </div>
          <div className="ch-progress-track" aria-hidden>
            <div className="ch-progress-fill" style={{ width: `${String(dailyPct)}%` }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-muted)' }}>
            {dailyRemaining === 0
              ? 'All done for today — see you tomorrow.'
              : `${String(dailyRemaining)} more to clear today's set`}
          </div>
        </div>

        {/* Active quest CTA — coral gradient */}
        <Link href="/quests" className="ch-quest-cta">
          <span aria-hidden className="ch-quest-cta__halo" />
          <span aria-hidden className="ch-quest-cta__trophy">
            <TrophyIcon size={36} />
          </span>
          <span style={{ position: 'relative', display: 'block' }}>
            <span
              className="ch-mono-kicker"
              style={{ color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: 6 }}
            >
              Earn XP today
            </span>
            <span
              className="ch-display"
              style={{
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.15,
                color: 'white',
                display: 'block',
                marginBottom: 14,
                maxWidth: 220,
              }}
            >
              {dailyRemaining > 0
                ? `Read ${String(dailyRemaining)} more ${dailyRemaining === 1 ? 'story' : 'stories'} to clear today's quests`
                : 'Daily quests done — explore weekly challenges'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.25)',
                  overflow: 'hidden',
                  display: 'block',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${String(dailyPct)}%`,
                    background: 'white',
                    borderRadius: 999,
                  }}
                />
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                {String(summary.completedToday)} / {String(summary.totalToday)}
              </span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  )
}

function levelLabel(level: number): string {
  if (level <= 1) return 'New explorer'
  if (level <= 3) return 'Trail spotter'
  if (level <= 6) return 'Trail scout'
  if (level <= 10) return 'Wayfinder'
  return 'Pathfinder'
}

function FlameIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 12 14" fill={color} aria-hidden>
      <path d="M6 0c1 2 3 3 3 6 0 1.4-.7 2.6-1.7 3.4 0-.8-.4-1.6-1-2.2.2 1.4-.7 2.6-1.6 3.4-.5.4-.7 1-.7 1.6C2 11.4 1 9.8 1 8.2 1 5.5 3.5 4 5 1.5 5.4 1 5.7.5 6 0z" />
    </svg>
  )
}

function TrophyIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9a6 6 0 0 0 12 0V3H6v6Z" />
      <path d="M4 5h2v4a4 4 0 0 1-4-4Zm16 0h-2v4a4 4 0 0 0 4-4Z" />
      <path d="M9 21h6" />
      <path d="M12 17v4" />
    </svg>
  )
}
