import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { fetchKycStatus, type KycStatus } from '@/lib/kyc'

export const metadata: Metadata = {
  title: 'KYC verification',
  robots: { index: false, follow: false },
}

const STEPS = [
  { num: 1, label: 'PAN card', detail: 'Photo of your PAN — name and number' },
  { num: 2, label: 'Aadhaar (last 4)', detail: 'Last 4 digits of your Aadhaar number' },
  { num: 3, label: 'Selfie', detail: 'Webcam capture with our oval guide' },
  { num: 4, label: 'Bank account', detail: 'IFSC + account for payouts' },
  { num: 5, label: 'Review & submit', detail: 'Usually verified within 24 h' },
]

export default async function KycEntryPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/studio/kyc')
  const kyc = await fetchKycStatus()

  // Suppress unused — session is enforced by parent layout, kept for clarity
  void session

  return (
    <>
      <main>
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
            Studio · KYC
          </span>
          <h1
            className="ch-display"
            style={{
              fontSize: 'clamp(32px, 4vw, 44px)',
              color: 'var(--ink)',
              margin: '8px 0 16px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Verify your <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>identity</em>.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--ink-soft)',
              lineHeight: 1.55,
              maxWidth: 640,
              marginBottom: 32,
            }}
          >
            India&rsquo;s tax + payout regulations need a one-time check before you can publish
            paid content or receive payouts. Takes about 5 minutes. Your documents are stored
            encrypted, accessed only by our compliance team.
          </p>

          <KycStatusCard status={kyc} />

          {(kyc.status === 'not_started' || kyc.status === 'rejected') && (
            <>
              <h2
                className="ch-display"
                style={{ fontSize: 22, color: 'var(--ink)', margin: '40px 0 16px' }}
              >
                What we&rsquo;ll need
              </h2>
              <ol
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 32,
                  maxWidth: 640,
                }}
              >
                {STEPS.map((s) => (
                  <li
                    key={s.num}
                    className="ch-card"
                    style={{ padding: 16, display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14 }}
                  >
                    <div
                      aria-hidden
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: 'var(--surface-alt)',
                        color: 'var(--ink-soft)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 600,
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      {s.num}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
                        {s.detail}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/studio/kyc/submit"
                className="ch-btn ch-btn-primary"
                style={{ padding: '14px 24px' }}
              >
                {kyc.status === 'rejected' ? 'Re-submit verification' : 'Start verification'}
              </Link>
            </>
          )}
      </main>
    </>
  )
}

function KycStatusCard({ status }: { status: KycStatus }) {
  const meta = describe(status)
  return (
    <div
      className="ch-card"
      role="status"
      aria-live="polite"
      style={{
        padding: 24,
        borderColor: meta.borderColor,
        background: meta.bg,
        maxWidth: 640,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: meta.iconBg,
            color: meta.iconFg,
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
            fontWeight: 700,
            flex: '0 0 auto',
          }}
        >
          {meta.icon}
        </div>
        <div>
          <div className="ch-display" style={{ fontSize: 22, color: 'var(--ink)' }}>
            {meta.title}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 2 }}>
            {meta.subtitle}
          </div>
        </div>
      </div>
      {status.rejectionReason && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13.5,
            color: 'var(--ink-soft)',
          }}
        >
          <strong style={{ color: 'var(--ink)' }}>Reason:</strong> {status.rejectionReason}
        </div>
      )}
      {status.submittedAt && (
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 12 }}>
          Submitted {new Date(status.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}

function describe(s: KycStatus): {
  title: string
  subtitle: string
  icon: string
  iconBg: string
  iconFg: string
  bg: string
  borderColor: string
} {
  switch (s.status) {
    case 'approved':
      return {
        title: 'Verified',
        subtitle: 'You can publish paid content and receive payouts.',
        icon: '✓',
        iconBg: 'color-mix(in srgb, var(--success) 18%, transparent)',
        iconFg: 'var(--success)',
        bg: 'color-mix(in srgb, var(--success) 6%, var(--surface))',
        borderColor: 'color-mix(in srgb, var(--success) 30%, var(--hairline))',
      }
    case 'pending':
      return {
        title: 'Under review',
        subtitle: 'Usually verified within 24 hours. We’ll email you when done.',
        icon: '…',
        iconBg: 'color-mix(in srgb, var(--info) 18%, transparent)',
        iconFg: 'var(--info)',
        bg: 'color-mix(in srgb, var(--info) 6%, var(--surface))',
        borderColor: 'color-mix(in srgb, var(--info) 30%, var(--hairline))',
      }
    case 'rejected':
      return {
        title: 'Verification needs attention',
        subtitle: 'Re-submit with the correction below.',
        icon: '!',
        iconBg: 'color-mix(in srgb, var(--danger) 18%, transparent)',
        iconFg: 'var(--danger)',
        bg: 'color-mix(in srgb, var(--danger) 6%, var(--surface))',
        borderColor: 'color-mix(in srgb, var(--danger) 30%, var(--hairline))',
      }
    default:
      return {
        title: 'Not started',
        subtitle: 'Begin verification to unlock paid publishing.',
        icon: '→',
        iconBg: 'var(--primary-tint)',
        iconFg: 'var(--primary-deep)',
        bg: 'var(--surface)',
        borderColor: 'var(--hairline)',
      }
  }
}
