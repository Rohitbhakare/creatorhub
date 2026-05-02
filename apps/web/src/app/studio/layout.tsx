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
    <>
      <WebHeader session={session} active="studio" />
      <div
        style={{
          maxWidth: 1240,
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
    </>
  )
}
