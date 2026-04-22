import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '../lib/session'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * Authoritative authenticated shell. Every authenticated page wraps
 * its content in `<AppShell>`. If the session is expired the user is
 * bounced to `/login`; if `must_change_password=true` the user is
 * bounced to `/change-password` regardless of the requested URL.
 *
 * Pages call `<AppShell currentPath="/users">...`) so the sidebar can
 * highlight the active item. (Highlight wiring is a V2 polish — the
 * prop is wired through now so we don't need to touch every caller
 * later.)
 */
export async function AppShell({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  const admin = await getCurrentAdmin()
  if (admin === null) redirect('/login')
  if (admin.must_change_password) redirect('/change-password')

  return (
    <div className="min-h-screen flex">
      <Sidebar role={admin.role} />
      <div className="flex-1 flex flex-col">
        <TopBar admin={admin} />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  )
}
