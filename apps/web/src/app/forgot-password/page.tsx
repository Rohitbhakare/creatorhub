import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ForgotForm } from './forgot-form'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Reset your CreatorHub password.',
  robots: { index: false, follow: true },
}

export default function ForgotPasswordPage() {
  return (
    <>
      <WebHeader variant="auth" />
      <main id="main-content"
        style={{
          minHeight: 'calc(100vh - 220px)',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 20px',
        }}
      >
        <div className="ch-card" style={{ width: '100%', maxWidth: 460, padding: 36 }}>
          <p
            style={{
              fontFamily: 'var(--font-mono, var(--font-sans))',
              fontSize: 11,
              color: 'var(--primary)',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: 10,
            }}
          >
            Recover access
          </p>
          <h1
            className="ch-display"
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              color: 'var(--ink)',
              margin: 0,
              marginBottom: 8,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Reset your <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>password</em>.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.5,
              margin: 0,
              marginBottom: 28,
            }}
          >
            Enter the email on your account. We&rsquo;ll send a link valid for one hour, single
            use. (Generic response — we won&rsquo;t confirm whether the email exists.)
          </p>
          <ForgotForm />
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid var(--hairline)',
              fontSize: 13,
              color: 'var(--ink-muted)',
              textAlign: 'center',
            }}
          >
            Remembered it?{' '}
            <Link
              href="/signin"
              style={{ color: 'var(--primary-deep)', fontWeight: 600, textDecoration: 'none' }}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
      <WebFooter />
    </>
  )
}
