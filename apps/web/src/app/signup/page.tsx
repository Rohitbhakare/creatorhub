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
          <h1
            className="ch-display"
            style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 8 }}
          >
            Join CreatorHub
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.5,
              marginBottom: 28,
            }}
          >
            Save the work you love, follow the creators behind it, book what calls. We&rsquo;ll text a one-time code.
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
