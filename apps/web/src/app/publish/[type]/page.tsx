import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { getSession } from '@/lib/session'
import { fetchKycStatus } from '@/lib/kyc'
import { PublishWizard } from './publish-wizard'

export const metadata: Metadata = {
  title: 'Publish',
  robots: { index: false, follow: false },
}

const VALID_TYPES = ['post', 'itinerary', 'experience', 'event'] as const
type PublishType = (typeof VALID_TYPES)[number]

interface Props {
  params: Promise<{ type: string }>
}

export default async function PublishWizardPage({ params }: Props) {
  const { type } = await params
  if (!VALID_TYPES.includes(type as PublishType)) notFound()

  const session = await getSession()
  if (!session) redirect(`/signin?next=/publish/${type}`)

  // Paid types need KYC. Posts don't.
  if (type !== 'post') {
    const kyc = await fetchKycStatus()
    if (kyc.status !== 'approved') redirect('/studio/kyc?next=/publish/' + type)
  }

  return (
    <>
      <WebHeader session={session} active="studio" />
      <main id="main-content" style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 32px 80px' }}>
        <PublishWizard type={type as PublishType} />
      </main>
    </>
  )
}
