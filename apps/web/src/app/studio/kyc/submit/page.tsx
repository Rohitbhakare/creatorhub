import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { StudioSidebar } from '@/components/chrome/studio-sidebar'
import { getSession } from '@/lib/session'
import { fetchKycStatus } from '@/lib/kyc'
import { KycWizard } from './kyc-wizard'

export const metadata: Metadata = {
  title: 'Submit KYC',
  robots: { index: false, follow: false },
}

export default async function KycSubmitPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/studio/kyc/submit')

  const kyc = await fetchKycStatus()
  if (kyc.status === 'pending' || kyc.status === 'approved') {
    redirect('/studio/kyc')
  }

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
        <StudioSidebar active="kyc" />
        <main>
          <KycWizard isResubmit={kyc.status === 'rejected'} />
        </main>
      </div>
    </>
  )
}
