'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/studio' },
  { id: 'content', label: 'Content', href: '/studio/content' },
  { id: 'bookings', label: 'Bookings', href: '/studio/bookings' },
  { id: 'reviews', label: 'Reviews', href: '/studio/reviews' },
  { id: 'payouts', label: 'Payouts', href: '/studio/payouts' },
  { id: 'kyc', label: 'KYC', href: '/studio/kyc' },
  { id: 'settings', label: 'Settings', href: '/studio/settings' },
]

/**
 * Self-aware sidebar — derives `active` from pathname so callers don't have
 * to pass it. Mounted once at /studio/layout.tsx so every studio sub-route
 * gets identical chrome (was previously rendered per-page, with several
 * pages forgetting it — caught in the 2026-05-02 bug bash as "Settings link
 * sometimes unclickable" and "active-highlight inconsistent between pages").
 */
export function StudioSidebar() {
  const pathname = usePathname()
  // Match longest prefix first so /studio/kyc/submit lights up "kyc", not the
  // /studio root. Items are sorted by descending href length internally.
  const sortedByDepth = [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length)
  const activeItem =
    sortedByDepth.find((it) => pathname === it.href || pathname.startsWith(`${it.href}/`)) ?? null

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
          const isActive = activeItem?.id === item.id
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
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
