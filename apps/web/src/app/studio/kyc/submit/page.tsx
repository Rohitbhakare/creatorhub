import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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

  void session

  return (
    <main>
      <KycWizard isResubmit={kyc.status === 'rejected'} />
    </main>
  )
}
