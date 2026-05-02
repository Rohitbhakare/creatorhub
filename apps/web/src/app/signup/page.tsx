import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { SignInForm } from '../signin/signin-form'

export const metadata: Metadata = {
  title: 'Join CreatorHub',
  description: 'Join CreatorHub to follow creators and book live experiences.',
  robots: { index: false, follow: true },
}

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function SignUpPage({ searchParams }: Props) {
  const { next } = await searchParams
  const nextSafe = next && next.startsWith('/') ? next : '/feed'

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
              color: 'var(--primary-text-bg)',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: 10,
            }}
          >
            Create account
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
            Join <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>CreatorHub</em>.
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
            Save the work you love, follow the creators behind it, book what calls.
          </p>
          <SignInForm next={nextSafe} intent="signup" />
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
            Already a member?{' '}
            <Link
              href="/signin"
              style={{ color: 'var(--primary-deep)', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
      <WebFooter />
    </>
  )
}
