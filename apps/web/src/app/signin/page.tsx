import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { SignInForm } from './signin-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to CreatorHub.',
  robots: { index: false, follow: true },
}

interface Props {
  searchParams: Promise<{ next?: string }>
}

/**
 * Same-origin path validator for the post-signin redirect target.
 * Round-4 SEC-04: the original `next.startsWith('/')` check let through
 * `//evil.com` (protocol-relative) and `/\\evil.com` (backslash-as-slash
 * in some legacy parsers) — both produce cross-origin redirects after
 * sign-in, enabling phishing flows. Strict check now: must begin with a
 * single forward slash followed by a non-slash, non-backslash character.
 */
function safeNext(next: string | undefined): string {
  if (!next) return '/feed'
  if (!next.startsWith('/')) return '/feed'
  if (next.startsWith('//') || next.startsWith('/\\')) return '/feed'
  return next
}

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams
  const nextSafe = safeNext(next)

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
        <div
          className="ch-card"
          style={{
            width: '100%',
            maxWidth: 460,
            padding: 36,
          }}
        >
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
            Sign in
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
            Welcome <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>back</em>.
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
            Sign in to follow creators, save chapters, and book trips.
          </p>
          <SignInForm next={nextSafe} />
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
            New to CreatorHub?{' '}
            <Link
              href="/signup"
              style={{ color: 'var(--primary-deep)', fontWeight: 600, textDecoration: 'none' }}
            >
              Create an account
            </Link>
          </div>
        </div>
      </main>
      <WebFooter />
    </>
  )
}
