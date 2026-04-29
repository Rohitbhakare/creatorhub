import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/signin?next=/studio')

  return (
    <>
      <WebHeader session={session} active="studio" />
      {children}
      <WebFooter />
    </>
  )
}
