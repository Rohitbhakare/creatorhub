import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'
import { fetchAchievements, fetchLeaderboard, fetchQuestSummary } from '@/lib/api'
import { LeaderboardTabs } from './leaderboard-tabs'

export const metadata: Metadata = {
  title: 'Quests',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ scope?: string }>
}

export default async function QuestsPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/signin?next=/quests')

  const sp = await searchParams
  const scope = (sp.scope ?? 'city') as 'city' | 'national' | 'all-time'

  const [quests, achievements, leaderboard] = await Promise.all([
    fetchQuestSummary(),
    fetchAchievements(),
    fetchLeaderboard(scope),
  ])

  const xpRatio = quests
    ? Math.min(1, quests.xp / Math.max(1, quests.xp + quests.xpToNextLevel))
    : 0

  return (
    <>
      <WebHeader session={session} streak={quests?.streakDays ?? 0} />
      <main id="main-content" style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 32px 80px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          Today
        </span>
        <h1
          className="ch-display"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--ink)', margin: '8px 0 32px' }}
        >
          Quests &amp; achievements
        </h1>

        {quests && (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
              marginBottom: 48,
            }}
          >
            <Tile label="Daily quests">
              <RingDial completed={quests.completedToday} total={quests.totalToday} />
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-muted)' }}>
                {quests.completedToday === quests.totalToday
                  ? 'All done today — see you tomorrow.'
                  : `${String(quests.totalToday - quests.completedToday)} more to clear today.`}
              </div>
            </Tile>
            <Tile label="Streak">
              <div className="ch-display" style={{ fontSize: 56, color: 'var(--primary)', lineHeight: 1 }}>
                {String(quests.streakDays)}
                <span style={{ fontSize: 16, color: 'var(--ink-muted)', marginLeft: 6 }}>days</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-muted)' }}>
                {quests.brokenStreakAlert
                  ? "Don't lose it — open something today!"
                  : `🔥 keep going`}
              </div>
            </Tile>
            <Tile label={`Level ${String(quests.level)}`}>
              <div
                style={{
                  height: 10,
                  background: 'var(--surface-alt)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${String(Math.round(xpRatio * 100))}%`,
                    height: '100%',
                    background: 'var(--primary)',
                  }}
                />
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-muted)' }}>
                {String(quests.xp)} / {String(quests.xp + quests.xpToNextLevel)} XP to Lv{' '}
                {String(quests.level + 1)}
              </div>
            </Tile>
          </section>
        )}

        <section style={{ marginBottom: 56 }}>
          <h2
            className="ch-display"
            style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 16 }}
          >
            Achievements
          </h2>
          {achievements.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
              Unlock achievements by booking, saving, posting, and inviting friends. They show up
              here as you go.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {achievements.map((a) => (
                <article
                  key={a.id}
                  className="ch-card"
                  style={{
                    padding: 18,
                    opacity: a.unlocked ? 1 : 0.55,
                    filter: a.unlocked ? 'none' : 'grayscale(0.5)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: a.unlocked ? 'var(--primary-deep)' : 'var(--ink-muted)',
                      }}
                    >
                      +{String(a.xpReward)} XP
                    </span>
                    {a.unlocked && <span aria-hidden style={{ color: 'var(--primary)' }}>✓</span>}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 18,
                      color: 'var(--ink)',
                      marginBottom: 4,
                    }}
                  >
                    {a.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                    {a.description}
                  </p>
                  {!a.unlocked && a.progress && (
                    <div
                      style={{
                        marginTop: 10,
                        height: 4,
                        background: 'var(--surface-alt)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${String(Math.round((a.progress.current / Math.max(1, a.progress.total)) * 100))}%`,
                          height: '100%',
                          background: 'var(--ink-faint)',
                        }}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2
            className="ch-display"
            style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 16 }}
          >
            Leaderboard
          </h2>
          <LeaderboardTabs initialScope={scope} initialRows={leaderboard} />
        </section>
      </main>
      <WebFooter />
    </>
  )
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ch-card" style={{ padding: 24 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          display: 'block',
          marginBottom: 16,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

function RingDial({ completed, total }: { completed: number; total: number }) {
  const size = 120
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const segLen = c / Math.max(1, total)
  const gap = 6
  const filled = Math.min(completed, total) * segLen
  return (
    <svg width={size} height={size} aria-hidden style={{ display: 'block' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface-alt)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={stroke}
        strokeDasharray={`${String(Math.max(0, filled - gap))} ${String(c)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${String(size / 2)} ${String(size / 2)})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-serif)"
        fontWeight={600}
        fontSize={32}
        fill="var(--ink)"
      >
        {String(completed)}/{String(total)}
      </text>
    </svg>
  )
}
