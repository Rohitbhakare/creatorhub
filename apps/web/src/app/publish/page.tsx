import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'
import { fetchKycStatus } from '@/lib/kyc'

export const metadata: Metadata = {
  title: 'Publish',
  robots: { index: false, follow: false },
}

const TYPES = [
  {
    id: 'post',
    label: 'Post',
    blurb: 'A quick photo + caption from the road. Free, no KYC.',
    paid: false,
    href: '/publish/post',
  },
  {
    id: 'itinerary',
    label: 'Itinerary',
    blurb: 'Multi-day plan with spots and a route. Free or paid unlock.',
    paid: true,
    href: '/publish/itinerary',
  },
  {
    id: 'experience',
    label: 'Experience',
    blurb: 'Live event you host — date, venue, capacity. KYC required.',
    paid: true,
    href: '/publish/experience',
  },
  {
    id: 'event',
    label: 'Event',
    blurb: 'Group meetup or launch — RSVP-based, public or invite-only.',
    paid: true,
    href: '/publish/event',
  },
]

export default async function PublishTypePicker() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/publish')
  const kyc = await fetchKycStatus()
  const kycVerified = kyc.status === 'approved'

  return (
    <>
      <WebHeader session={session} active="studio" />
      <main
        id="main-content"
        style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 32px 80px' }}
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
          Creator tools
        </span>
        <h1
          className="ch-display"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--ink)', margin: '8px 0 12px' }}
        >
          What are you publishing?
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--ink-soft)',
            lineHeight: 1.55,
            maxWidth: 560,
            marginBottom: 32,
          }}
        >
          Pick the type — we tailor the wizard to what each format needs. You can always switch
          before publishing.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {TYPES.map((t) => {
            const lockedForKyc = t.paid && !kycVerified
            return (
              <Link
                key={t.id}
                href={lockedForKyc ? '/studio/kyc' : t.href}
                aria-disabled={lockedForKyc}
                prefetch
                className="ch-card"
                style={{
                  padding: 24,
                  textDecoration: 'none',
                  color: 'inherit',
                  position: 'relative',
                  opacity: lockedForKyc ? 0.7 : 1,
                  cursor: 'pointer',
                  // Round-5 audit Bug 3: cards looked clickable but
                  // first-click felt unresponsive in dev (cold-compile of
                  // the destination route). Explicit cursor + a hover
                  // border tint give immediate click affordance so the
                  // user knows the click landed even before navigation
                  // resolves.
                  transition: 'border-color 120ms ease-out, transform 120ms ease-out',
                }}
              >
                {/* Round-6 audit B2: card-level chips so creators can
                    tell at a glance which type they can start with vs
                    which need KYC. Coral "FREE" for unlocked, grey lock
                    chip for paid-without-KYC. */}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 9px',
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono, var(--font-sans))',
                    background: lockedForKyc
                      ? 'var(--surface-alt)'
                      : 'color-mix(in srgb, var(--primary) 14%, transparent)',
                    color: lockedForKyc ? 'var(--ink-soft)' : 'var(--primary-text-bg)',
                  }}
                >
                  {lockedForKyc ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                      KYC
                    </>
                  ) : (
                    'Free'
                  )}
                </span>
                <div className="ch-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 6, paddingRight: 56 }}>
                  {t.label}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55 }}>{t.blurb}</p>
                {lockedForKyc && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 12,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'var(--surface-alt)',
                      color: 'var(--ink-soft)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Verify identity to unlock →
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </main>
      <WebFooter />
    </>
  )
}
