import Link from 'next/link'
import type { ContentCard, QuestSummary } from '@/lib/api/types'
import { contentSlugId } from '@/lib/slug'

interface RightRailProps {
  quests?: QuestSummary | null
  topCreators?: { id: string; name: string; followers: number; vertical: string }[]
  trendingTags?: string[]
  continueReading?: ContentCard | null
}

export function RightRail({
  quests,
  topCreators = [],
  trendingTags = [],
  continueReading,
}: RightRailProps) {
  return (
    <aside
      style={{
        width: 296,
        flex: '0 0 296px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
      aria-label="Discover sidebar"
    >
      {quests && (
        <div
          className="ch-card"
          style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
              }}
            >
              Today
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--primary-deep)',
                background: 'var(--primary-tint)',
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              Lv {String(quests.level)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <QuestRing completed={quests.completedToday} total={quests.totalToday} />
            <div style={{ flex: 1 }}>
              <div className="ch-display" style={{ fontSize: 19, lineHeight: 1.2 }}>
                {quests.streakDays}-day streak
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                {String(quests.completedToday)}/{String(quests.totalToday)} quests today
              </div>
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 999 }}>
            <div
              style={{
                width: `${String(Math.min(100, (quests.xp / Math.max(1, quests.xpToNextLevel)) * 100))}%`,
                height: '100%',
                background: 'var(--primary)',
                borderRadius: 999,
              }}
            />
          </div>
          <Link
            href="/quests"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            View all quests →
          </Link>
        </div>
      )}

      {continueReading && (
        <div className="ch-card" style={{ padding: 16 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 12,
              display: 'block',
            }}
          >
            Continue reading
          </span>
          <Link
            href={`/content/${contentSlugId(continueReading.title, continueReading.id)}`}
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="ch-photo ch-photo--konkan"
              style={{ height: 100, marginBottom: 10 }}
              aria-hidden
            />
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.3, color: 'var(--ink)' }}>
              {continueReading.title}
            </div>
            {continueReading.creator && (
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
                by {continueReading.creator.displayName}
              </div>
            )}
          </Link>
        </div>
      )}

      {topCreators.length > 0 && (
        <div className="ch-card" style={{ padding: 16 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 12,
              display: 'block',
            }}
          >
            Top creators this week
          </span>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topCreators.slice(0, 5).map((c, i) => (
              <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 18,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--ink-muted)',
                    textAlign: 'right',
                  }}
                >
                  {i + 1}
                </span>
                <Link
                  href={`/${c.vertical}/${c.id}`}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                  }}
                >
                  {c.name}
                </Link>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                  {Intl.NumberFormat('en-IN', { notation: 'compact' }).format(c.followers)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {trendingTags.length > 0 && (
        <div className="ch-card" style={{ padding: 16 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 12,
              display: 'block',
            }}
          >
            Trending
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trendingTags.map((tag) => (
              <Link
                key={tag}
                href={`/discover?q=${encodeURIComponent(tag)}`}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'var(--surface-alt)',
                  color: 'var(--ink-soft)',
                  textDecoration: 'none',
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

function QuestRing({ completed, total }: { completed: number; total: number }) {
  const size = 72
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const segmentLength = circumference / Math.max(1, total)
  const gap = 4
  const filledLength = Math.min(completed, total) * segmentLength
  return (
    <svg width={size} height={size} aria-hidden style={{ flex: '0 0 auto' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-alt)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={stroke}
        strokeDasharray={`${String(Math.max(0, filledLength - gap))} ${String(circumference)}`}
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
        fontSize={20}
        fill="var(--ink)"
      >
        {completed}/{total}
      </text>
    </svg>
  )
}
