import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'For creators — earn from your travel stories',
  description:
    'CreatorHub turns your travel stories into a livelihood. Publish itineraries, host experiences, build a following — keep 83% of bookings.',
  alternates: { canonical: '/creators' },
  openGraph: {
    title: 'For creators on CreatorHub',
    description: 'Earn from your travel stories. 17% platform fee. Daily payouts.',
    type: 'website',
  },
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I get paid?',
    a: 'Bookings clear to your bank or UPI 48 hours after the trip is completed. We handle GST collection and TDS withholding so you never have to.',
  },
  {
    q: 'What does CreatorHub take?',
    a: '17% platform fee on paid bookings. That covers payment processing, refund insurance, support, and discovery surfaces. There are no listing fees, no monthly fees, and no fees on free posts.',
  },
  {
    q: 'Do I need to be a tour operator?',
    a: 'No. Most CreatorHub creators are travellers who write — bloggers, photographers, small-group hosts. Our terms cover liability and refunds; you focus on the story.',
  },
  {
    q: 'What can I publish?',
    a: 'Posts (free social content), itineraries (DIY plans), experiences (live events you host), and events (group meetups). All four work the same way — write once, earn from saves and bookings.',
  },
  {
    q: 'How long does verification take?',
    a: 'KYC usually clears in 24 hours. You can publish free content immediately; paid content unlocks once you’re verified.',
  },
  {
    q: 'Is there an app?',
    a: 'Yes — Flutter mobile app for iOS + Android. The web app is for readers and a creator studio dashboard.',
  },
]

export default async function CreatorsPage() {
  const session = await getSession()
  return (
    <>
      <WebHeader session={session} active={null} />
      <main id="main-content">
        {/* Hero */}
        <section
          style={{
            padding: '64px 32px 48px',
            background:
              'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div
            style={{
              maxWidth: 880,
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
                display: 'block',
                marginBottom: 14,
              }}
            >
              For creators
            </span>
            <h1
              className="ch-display"
              style={{
                fontSize: 'clamp(36px, 5.4vw, 60px)',
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: '-0.015em',
              }}
            >
              Earn from your{' '}
              <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>
                travel stories
              </em>
              .
            </h1>
            <p
              style={{
                fontSize: 18,
                color: 'var(--ink-muted)',
                marginTop: 18,
                lineHeight: 1.5,
                maxWidth: 600,
                marginInline: 'auto',
              }}
            >
              Publish your itineraries, host walks, build a following.
              CreatorHub is the platform for India&apos;s travel creators —
              17% fee, daily payouts, full editorial control.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
              <Link href="/signup?role=creator" className="ch-btn ch-btn-primary" style={{ padding: '12px 22px', fontSize: 14 }}>
                Join as a creator
              </Link>
              <Link href="/discover" className="ch-btn ch-btn-ghost" style={{ padding: '12px 22px', fontSize: 14 }}>
                Browse top creators →
              </Link>
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section style={{ padding: '40px 32px', borderBottom: '1px solid var(--hairline)' }}>
          <div
            style={{
              maxWidth: 1080,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 24,
              textAlign: 'center',
            }}
          >
            <Stat label="Platform fee" value="17%" sub="of paid bookings" />
            <Stat label="Payout cadence" value="48 h" sub="after trip completion" />
            <Stat label="Refund policy" value="100%" sub="up to 24 h before" />
            <Stat label="Cities live" value="14" sub="across India" />
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: '64px 32px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <h2
              className="ch-display"
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: 'var(--ink)',
                marginBottom: 36,
                textAlign: 'center',
                margin: '0 0 36px',
              }}
            >
              How it works
            </h2>
            <ol
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 24,
                counterReset: 'step',
              }}
            >
              {STEPS.map((s) => (
                <li
                  key={s.title}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 14,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      color: 'var(--primary)',
                      marginBottom: 12,
                    }}
                  >
                    {s.kicker}
                  </div>
                  <h3
                    className="ch-display"
                    style={{
                      fontSize: 20,
                      color: 'var(--ink)',
                      margin: '0 0 8px',
                      lineHeight: 1.25,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'var(--ink-muted)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section
          style={{
            padding: '40px 32px 80px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2
              className="ch-display"
              style={{
                fontSize: 'clamp(26px, 3.6vw, 34px)',
                color: 'var(--ink)',
                marginBottom: 28,
                margin: '0 0 28px',
              }}
            >
              Questions
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid var(--hairline)',
              }}
            >
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  style={{
                    borderBottom: '1px solid var(--hairline)',
                    padding: '16px 0',
                  }}
                >
                  <summary
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      listStyle: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    {f.q}
                    <span aria-hidden style={{ color: 'var(--ink-muted)', fontSize: 18 }}>+</span>
                  </summary>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--ink-muted)',
                      lineHeight: 1.65,
                      marginTop: 12,
                      marginBottom: 0,
                    }}
                  >
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <Link
                href="/signup?role=creator"
                className="ch-btn ch-btn-primary"
                style={{ padding: '12px 24px', fontSize: 14.5 }}
              >
                Become a creator — it&apos;s free
              </Link>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--ink-faint)',
                  marginTop: 12,
                }}
              >
                30 seconds to set up · KYC unlocks paid content within 24 h
              </p>
            </div>
          </div>
        </section>
      </main>
      <WebFooter />
    </>
  )
}

const STEPS: { kicker: string; title: string; body: string }[] = [
  {
    kicker: 'Step 1',
    title: 'Sign up free',
    body: 'Email or Google. No upfront fees, no commitment, no minimum follower count required.',
  },
  {
    kicker: 'Step 2',
    title: 'Publish your first story',
    body: 'A trip recap, a curated itinerary, an experience you host. Drag-and-drop editor, autosave, live preview.',
  },
  {
    kicker: 'Step 3',
    title: 'Verify (for paid content)',
    body: 'PAN + selfie KYC unlocks paid bookings + payouts. Free posts work without KYC.',
  },
  {
    kicker: 'Step 4',
    title: 'Get discovered',
    body: 'CreatorHub surfaces new creators in the home feed, discover, and city-specific rails. SEO + share cards do the rest.',
  },
  {
    kicker: 'Step 5',
    title: 'Earn',
    body: 'Bookings + tips clear to your bank/UPI 48h after trip completion. We handle GST + TDS automatically.',
  },
]

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        className="ch-display"
        style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          color: 'var(--ink)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 6 }}>{sub}</div>
    </div>
  )
}
