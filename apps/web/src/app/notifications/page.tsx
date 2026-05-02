import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'
import { fetchNotifications } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${String(m)}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${String(h)}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${String(d)}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/notifications')

  const items = await fetchNotifications()

  return (
    <>
      <WebHeader session={session} />
      <main id="main-content" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 80px' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono, var(--font-sans))',
            fontSize: 11,
            color: 'var(--primary-text-bg)',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            margin: 0,
            marginBottom: 10,
          }}
        >
          Activity
        </p>
        <h1
          className="ch-display"
          style={{
            fontSize: 'clamp(32px, 4vw, 44px)',
            color: 'var(--ink)',
            margin: 0,
            marginBottom: 24,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          Your <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>notifications</em>.
        </h1>
        {items.length === 0 ? (
          <div
            className="ch-card"
            style={{ padding: 48, textAlign: 'center', color: 'var(--ink-muted)' }}
          >
            All caught up.
          </div>
        ) : (
          <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((n, i) => (
              <Link
                key={n.id}
                href={n.href ?? '#'}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '16px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
                  background: n.isRead ? 'transparent' : 'var(--surface-alt)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
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
                    flex: '0 0 auto',
                  }}
                >
                  {(n.actorName || '?').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
                    {n.message}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-muted)',
                      marginTop: 4,
                    }}
                  >
                    {relativeTime(n.createdAt)}
                  </div>
                </div>
                {!n.isRead && (
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: 'var(--primary)',
                      flex: '0 0 auto',
                      marginTop: 8,
                    }}
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <WebFooter />
    </>
  )
}
