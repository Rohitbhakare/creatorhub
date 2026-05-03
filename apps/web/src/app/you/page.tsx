import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'You',
  robots: { index: false, follow: false },
}

export default async function YouPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/you')

  return (
    <>
      <WebHeader session={session} active={null} />
      <main id="main-content" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 80px' }}>
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
          Your space
        </span>
        <h1
          className="ch-display"
          style={{
            fontSize: 'clamp(32px, 4vw, 44px)',
            color: 'var(--ink)',
            marginTop: 8,
            marginBottom: 32,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {(() => {
            // session.displayName + session.username can both be null
            // (OAuth users haven't picked names yet, the DB columns
            // allow null). Fall back to a generic so the H1 never
            // crashes — Account tab in /studio/settings is where they'll
            // set these, surfaced as a nudge below.
            const name = session.displayName ?? session.username ?? 'You'
            const parts = name.split(' ')
            const last = parts.pop() ?? ''
            const head = parts.join(' ')
            return head ? (
              <>
                {head}{' '}
                <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>{last}</em>
              </>
            ) : (
              <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>{name}</em>
            )
          })()}
        </h1>

        <div className="ch-card" style={{ padding: 24, marginBottom: 16 }}>
          <h2 className="ch-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 12 }}>
            Profile
          </h2>
          <Row label="Username" value={session.username ? `@${session.username}` : 'Not set yet'} />
          <Row label="Creator status" value={session.isCreator ? 'Active' : 'Not yet'} />
          {session.isCreator && session.vertical && (
            <Row label="Vertical" value={session.vertical} />
          )}
        </div>

        <div className="ch-card" style={{ padding: 24, marginBottom: 16 }}>
          <h2 className="ch-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 12 }}>
            Quick links
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/saved" style={linkStyle}>Saved chapters →</Link>
            <Link href="/bookings" style={linkStyle}>My bookings →</Link>
            <Link href="/notifications" style={linkStyle}>Notifications →</Link>
            {!session.isCreator && (
              <Link href="/studio/kyc" style={linkStyle}>Become a creator →</Link>
            )}
            {session.isCreator && (
              <Link href="/studio" style={linkStyle}>Open studio →</Link>
            )}
            <Link href="/settings" style={linkStyle}>Settings →</Link>
          </div>
        </div>

        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="ch-btn ch-btn-ghost"
            style={{ color: 'var(--danger)', borderColor: 'var(--hairline-strong)' }}
          >
            Sign out
          </button>
        </form>
      </main>
      <WebFooter />
    </>
  )
}

const linkStyle = {
  padding: '10px 0',
  fontSize: 14,
  color: 'var(--ink)',
  textDecoration: 'none',
  borderBottom: '1px solid var(--hairline)',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        padding: '8px 0',
        fontSize: 14,
      }}
    >
      <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
