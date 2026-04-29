import Link from 'next/link'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/studio' },
  { id: 'content', label: 'Content', href: '/studio/content' },
  { id: 'bookings', label: 'Bookings', href: '/studio/bookings' },
  { id: 'reviews', label: 'Reviews', href: '/studio/reviews' },
  { id: 'payouts', label: 'Payouts', href: '/studio/payouts' },
  { id: 'kyc', label: 'KYC', href: '/studio/kyc' },
  { id: 'settings', label: 'Settings', href: '/studio/settings' },
]

export function StudioSidebar({ active }: { active: string }) {
  return (
    <nav style={{ position: 'sticky', top: 96 }} aria-label="Studio">
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--primary-deep)' : 'var(--ink-soft)',
                  background: isActive ? 'var(--primary-tint)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
