import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { StudioSidebar } from '@/components/chrome/studio-sidebar'
import { getSession } from '@/lib/session'
import { fetchStudioMetrics } from '@/lib/api'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Studio',
  robots: { index: false, follow: false },
}

export default async function StudioPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/studio')

  const metrics = await fetchStudioMetrics()

  return (
    <>
      <WebHeader session={session} active="studio" />
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
        <StudioSidebar active="overview" />

        <main>
          <div style={{ marginBottom: 40 }}>
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
              Studio
            </span>
            <h1
              className="ch-display"
              style={{ fontSize: 'clamp(32px, 4vw, 44px)', color: 'var(--ink)', marginTop: 8 }}
            >
              Welcome back, {session.displayName.split(' ')[0]}
            </h1>
          </div>

          {metrics ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                  marginBottom: 40,
                }}
              >
                <Stat
                  label="Earnings · 30d"
                  value={formatPrice(metrics.earningsLast30dPaisa, false)}
                />
                <Stat label="Bookings · 30d" value={metrics.bookingsLast30d.toString()} />
                <Stat label="Saves · 30d" value={metrics.savesLast30d.toString()} />
                <Stat
                  label="Followers"
                  value={Intl.NumberFormat('en-IN', { notation: 'compact' }).format(
                    metrics.followerCount,
                  )}
                />
              </div>

              {metrics.recentActivity.length > 0 && (
                <section>
                  <h2
                    className="ch-display"
                    style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 16 }}
                  >
                    Recent activity
                  </h2>
                  <div
                    className="ch-card"
                    style={{ padding: 0, overflow: 'hidden' }}
                  >
                    {metrics.recentActivity.map((a, i) => (
                      <div
                        key={a.id}
                        style={{
                          padding: '14px 20px',
                          borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
                          fontSize: 13.5,
                          color: 'var(--ink-soft)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{a.message}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                          {new Date(a.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="ch-card" style={{ padding: 48, textAlign: 'center' }}>
              <h2
                className="ch-display"
                style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 12 }}
              >
                Publish your first chapter
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 24 }}>
                Once you publish, this dashboard fills with earnings, bookings, and reach.
              </p>
              <Link href="/publish" className="ch-btn ch-btn-primary">
                Start publishing
              </Link>
            </div>
          )}
        </main>
      </div>
      <WebFooter />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ch-card" style={{ padding: 20 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div className="ch-display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  )
}
