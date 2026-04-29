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

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams
  const nextSafe = next && next.startsWith('/') ? next : '/feed'

  return (
    <>
      <WebHeader variant="auth" />
      <main
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
          <h1
            className="ch-display"
            style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 8 }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.5,
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
