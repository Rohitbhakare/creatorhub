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
          <h1
            className="ch-display"
            style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 8 }}
          >
            Reset password
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.5,
              marginBottom: 28,
            }}
          >
            Enter the email on your account. We&rsquo;ll send a link valid for one hour, single
            use.
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
