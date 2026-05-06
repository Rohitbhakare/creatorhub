import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { StudioSidebar } from '@/components/chrome/studio-sidebar'
import { getSession } from '@/lib/session'

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/signin?next=/studio')

  return (
    // Flex-column wrapper ensures the footer is always pinned to the
    // bottom of the viewport — previously the layout had no minHeight
    // so on sparse pages (empty Bookings, empty Content) the footer
    // floated mid-screen. The inner content area grows (flex: 1) to
    // fill the remaining space, which also gives the sidebar a stable
    // vertical anchor so its sticky position is consistent across every
    // Studio sub-page regardless of how much content each page has.
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <WebHeader session={session} active="studio" />
      <div
        style={{
          flex: 1,
          maxWidth: 1240,
          width: '100%',
          margin: '0 auto',
          padding: '32px 32px 80px',
          display: 'grid',
          gridTemplateColumns: '220px minmax(0, 1fr)',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <StudioSidebar />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
      <WebFooter />
    </div>
  )
}
