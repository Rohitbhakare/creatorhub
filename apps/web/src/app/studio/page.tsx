import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EarningsSparkline } from '@/components/studio/earnings-sparkline'
import { BookingsDrawer } from '@/components/studio/bookings-drawer'
import { getSession } from '@/lib/session'
import { fetchStudioMetrics, fetchStudioBookings } from '@/lib/api'
import { fetchKycStatus } from '@/lib/kyc'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Studio',
  robots: { index: false, follow: false },
}

export default async function StudioPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/studio')

  const [metrics, kyc, bookings] = await Promise.all([
    fetchStudioMetrics(),
    fetchKycStatus(),
    fetchStudioBookings(),
  ])
  const showKycBanner = kyc.status !== 'approved'

  return (
    <>
      <main>
          {showKycBanner && (
            <Link
              href="/studio/kyc"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: kyc.status === 'rejected' ? 'color-mix(in srgb, var(--danger) 8%, var(--surface))' : 'var(--primary-tint)',
                border: `1px solid ${kyc.status === 'rejected' ? 'color-mix(in srgb, var(--danger) 30%, var(--hairline))' : 'color-mix(in srgb, var(--primary) 25%, var(--hairline))'}`,
                borderRadius: 'var(--radius-md)',
                marginBottom: 24,
                textDecoration: 'none',
                color: 'var(--ink)',
              }}
            >
              <span aria-hidden style={{ fontSize: 20 }}>
                {kyc.status === 'rejected' ? '!' : '→'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {kyc.status === 'pending'
                    ? 'KYC under review · usually within 24 h'
                    : kyc.status === 'rejected'
                      ? 'KYC needs your attention'
                      : 'Verify identity to publish paid content'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
                  {kyc.status === 'rejected' && kyc.rejectionReason
                    ? kyc.rejectionReason
                    : '~5 minutes · PAN, Aadhaar last 4, selfie, bank'}
                </div>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: kyc.status === 'rejected' ? 'var(--danger)' : 'var(--primary-deep)',
                }}
              >
                {kyc.status === 'pending' ? 'View status' : kyc.status === 'rejected' ? 'Re-submit' : 'Start →'}
              </span>
            </Link>
          )}
          <div style={{ marginBottom: 40 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, var(--font-sans))',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--primary-text-bg)',
              }}
            >
              Studio
            </span>
            <h1
              className="ch-display"
              style={{
                fontSize: 'clamp(32px, 4vw, 44px)',
                color: 'var(--ink)',
                marginTop: 8,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              Welcome back,{' '}
              <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>
                {(session.displayName ?? session.username).split(' ')[0] || 'creator'}
              </em>
            </h1>
            <div style={{ marginTop: 14 }}>
              <BookingsDrawer bookings={bookings} />
            </div>
          </div>

          {metrics ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
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

              {/* 30-day earnings sparkline (E5.7 T2). */}
              <div className="ch-card" style={{ padding: 20, marginBottom: 40 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono, var(--font-sans))',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                    marginBottom: 12,
                  }}
                >
                  Earnings · last 30 days
                </div>
                <EarningsSparkline trend={metrics.earningsTrend} />
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
