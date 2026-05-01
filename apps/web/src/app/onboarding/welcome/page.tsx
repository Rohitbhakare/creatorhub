import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { getSession } from '@/lib/session'
import { WelcomeBurst } from './welcome-burst'

export const metadata: Metadata = {
  title: 'Welcome',
  robots: { index: false, follow: false },
}

export default async function WelcomePage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/feed')

  const firstName = session.displayName.split(' ')[0] ?? 'there'

  return (
    <>
      <WebHeader variant="auth" />
      <main id="main-content"
        style={{
          minHeight: 'calc(100vh - 220px)',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <WelcomeBurst />
        <div style={{ textAlign: 'center', maxWidth: 540, position: 'relative', zIndex: 1 }}>
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
            You&rsquo;re in
          </span>
          <h1
            className="ch-display"
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              color: 'var(--ink)',
              margin: '12px 0 16px',
              lineHeight: 1.05,
            }}
          >
            Welcome aboard,{' '}
            <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>{firstName}</em>.
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'var(--ink-soft)',
              lineHeight: 1.55,
              marginBottom: 32,
            }}
          >
            Your feed is ready — chapters, itineraries, and live experiences from creators who
            match your moods.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/onboarding/sub-categories"
              className="ch-btn ch-btn-primary"
              style={{ padding: '14px 28px' }}
            >
              Pick a few interests
            </a>
            <a href="/feed" className="ch-btn ch-btn-ghost" style={{ padding: '14px 28px' }}>
              Skip — open my feed
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
