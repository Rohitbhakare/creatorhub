import type { ReactNode } from 'react'
import { StudioSidebar } from './studio-sidebar'

interface StudioShellProps {
  active: string
  kicker?: string
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function StudioShell({ active, kicker, title, children, actions }: StudioShellProps) {
  return (
    <div
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '32px 32px 80px',
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr)',
        gap: 40,
        alignItems: 'start',
      }}
    >
      <StudioSidebar active={active} />
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
    </div>
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
