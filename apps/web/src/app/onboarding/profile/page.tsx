import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { getSession } from '@/lib/session'
import { ProfileForm } from './profile-form'

export const metadata: Metadata = {
  title: 'Pick your handle',
  robots: { index: false, follow: false },
}

/**
 * Round-6 audit C1, step 1 of the onboarding gap fix.
 *
 * Captures display_name + username before the user reaches Studio.
 * Without this, both fields stay null in the JWT and Studio renders
 * "Welcome back, creator" + creator profiles get an `@null` handle.
 *
 * Existing users with both fields already set are auto-forwarded to
 * the next step (sub-categories) so they don't see this screen twice.
 */
export default async function OnboardingProfilePage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/onboarding/profile')

  if (session.displayName && session.username) {
    redirect('/onboarding/sub-categories')
  }

  return (
    <>
      <WebHeader session={session} />
      <main
        id="main-content"
        style={{
          minHeight: 'calc(100vh - 220px)',
          maxWidth: 560,
          margin: '0 auto',
          padding: '40px 32px 80px',
        }}
      >
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
          Step 1 of 3
        </span>
        <h1
          className="ch-display"
          tabIndex={-1}
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: 'var(--ink)',
            margin: '8px 0 12px',
            letterSpacing: '-0.02em',
          }}
        >
          Pick your name &amp; handle
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--ink-soft)',
            lineHeight: 1.55,
            marginBottom: 24,
          }}
        >
          The name shows on your posts and profile. The handle is your
          shareable URL. Both can be changed later in{' '}
          <strong style={{ color: 'var(--ink)' }}>Studio · Settings</strong>.
        </p>
        <ProfileForm
          initialDisplayName={session.displayName ?? ''}
          initialUsername={session.username ?? ''}
        />
      </main>
    </>
  )
}
