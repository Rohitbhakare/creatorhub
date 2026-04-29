import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { StudioShell } from '@/components/chrome/studio-shell'
import { getSession } from '@/lib/session'
import { SettingsTabs } from './settings-tabs'

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function StudioSettingsPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/signin?next=/studio/settings')

  const sp = await searchParams
  const tab = (sp.tab ?? 'account') as
    | 'account'
    | 'payout'
    | 'notifications'
    | 'privacy'

  return (
    <StudioShell active="settings" kicker="Studio · Settings" title="Settings">
      <SettingsTabs initialTab={tab} session={{ displayName: session.displayName, username: session.username }} />
    </StudioShell>
  )
}
