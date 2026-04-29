import Link from 'next/link'

interface WebFooterProps {
  big?: boolean
}

const COLUMNS = [
  { h: 'Travelers', items: [
    { label: 'Discover', href: '/discover' },
    { label: 'Stories', href: '/discover?type=post' },
    { label: 'Itineraries', href: '/discover?type=itinerary' },
    { label: 'Experiences', href: '/discover?type=experience' },
    { label: 'Events', href: '/discover?type=event' },
  ]},
  { h: 'Creators', items: [
    { label: 'Why CreatorHub', href: '/for-creators' },
    { label: 'Earnings', href: '/for-creators#earnings' },
    { label: 'Get verified', href: '/studio/kyc' },
    { label: 'Help center', href: '/help' },
  ]},
  { h: 'Company', items: [
    { label: 'About', href: '/about' },
    { label: 'Press', href: '/press' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ]},
  { h: 'Legal', items: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Refunds', href: '/refunds' },
    { label: 'Trust & safety', href: '/community-guidelines' },
  ]},
]

export function WebFooter({ big = false }: WebFooterProps) {
  if (!big) {
    return (
      <footer
        style={{
          marginTop: 60,
          padding: '32px 32px 28px',
          borderTop: '1px solid var(--hairline)',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            maxWidth: 1640,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <span className="ch-brand" style={{ fontSize: 18 }}>
            creator<em>hub</em>
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Travel stories worth saving · Made in Bengaluru
          </span>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--ink-soft)',
            }}
          >
            {['About', 'Help', 'Privacy', 'Terms'].map((label) => (
              <Link
                key={label}
                href={`/${label.toLowerCase()}`}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer
      style={{
        marginTop: 80,
        padding: '60px 32px 40px',
        borderTop: '1px solid var(--hairline)',
        background: 'var(--surface)',
      }}
    >
      <div
        className="ch-footer-grid"
        style={{
          maxWidth: 1640,
          margin: '0 auto',
          paddingInline: 'clamp(16px, 4vw, 32px)',
        }}
      >
        <div>
          <span className="ch-brand" style={{ display: 'block', marginBottom: 10 }}>
            creator<em>hub</em>
          </span>
          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-muted)',
              lineHeight: 1.55,
              marginBottom: 18,
              maxWidth: 280,
            }}
          >
            Travel stories worth saving. Travel plans worth booking. Made in Bengaluru, India.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['IG', 'YT', 'X', 'WA'].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--surface-alt)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  textDecoration: 'none',
                }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.h}>
            <h3
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-muted)',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {col.h}
            </h3>
            {col.items.map((item) => (
              <div key={item.label} style={{ marginBottom: 10 }}>
                <Link
                  href={item.href}
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-soft)',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: 1640,
          margin: '36px auto 0',
          paddingTop: 20,
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--ink-muted)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span>© 2026 CreatorHub Technologies Pvt Ltd · India · INR · UPI-first</span>
        <span>Pure white · Coral only</span>
      </div>
    </footer>
  )
}
