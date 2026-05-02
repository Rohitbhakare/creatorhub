import type { ReactNode } from 'react'

interface StudioShellProps {
  /** @deprecated — sidebar lives in /studio/layout.tsx now and self-derives
   *  active state from pathname. Kept here only so existing callsites compile;
   *  remove on next pass through these files. */
  active?: string
  kicker?: string
  title: string
  children: ReactNode
  actions?: ReactNode
}

/**
 * Studio page chrome: kicker + H1 + optional actions row + children.
 * The grid + sidebar + WebHeader + WebFooter all live in /studio/layout.tsx
 * (post 2026-05-02 refactor — fixes the "active highlight inconsistent
 * between pages" + "Settings link sometimes unclickable" bug pair: those
 * studio pages that didn't render <StudioShell>/<StudioSidebar> went
 * sidebar-less, breaking the layout column from underneath them).
 */
export function StudioShell({ kicker, title, children, actions }: StudioShellProps) {
  return (
    <main id="main-content">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 32,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          {kicker && (
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
              {kicker}
            </span>
          )}
          <h1
            className="ch-display"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: 'var(--ink)',
              margin: '8px 0 0',
            }}
          >
            {title}
          </h1>
        </div>
        {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
      </div>
      {children}
    </main>
  )
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string
  body: string
  cta?: ReactNode
}) {
  return (
    <div
      className="ch-card"
      style={{ padding: 48, textAlign: 'center', color: 'var(--ink-muted)' }}
    >
      <h2 className="ch-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 12 }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>{body}</p>
      {cta}
    </div>
  )
}
