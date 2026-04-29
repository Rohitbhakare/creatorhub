import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { getSession } from '@/lib/session'
import { apiFetch } from '@/lib/api-client'
import { BookingWizard } from './booking-wizard'

export const metadata: Metadata = {
  title: 'Complete your booking',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ intentId: string }>
}

interface IntentDetail {
  intent_id: string
  content_id: string
  content_title: string
  content_cover: string | null
  scheduled_date_id: string | null
  starts_at: string | null
  travellers: number
  expires_at: string
  pricing: {
    base_paisa: number
    platform_fee_paisa: number
    gst_paisa: number
    total_paisa: number
  }
  creator: {
    id: string
    username: string
    display_name: string
  }
}

async function fetchIntent(intentId: string): Promise<IntentDetail | null> {
  try {
    return await apiFetch<IntentDetail>(`/api/v1/booking-intents/${intentId}`, {
      next: { revalidate: 0 },
    })
  } catch {
    return null
  }
}

export default async function BookingPage({ params }: Props) {
  const { intentId } = await params
  const session = await getSession()
  if (!session) redirect(`/signin?next=/booking/${intentId}`)

  const intent = await fetchIntent(intentId)
  if (!intent) {
    return (
      <>
        <WebHeader session={session} active="bookings" />
        <main
          style={{
            minHeight: 'calc(100vh - 220px)',
            display: 'grid',
            placeItems: 'center',
            padding: 32,
          }}
        >
          <div
            className="ch-card"
            style={{ padding: 36, maxWidth: 480, textAlign: 'center' }}
          >
            <h1
              className="ch-display"
              style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 12 }}
            >
              Hold expired
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 24 }}>
              That booking hold has timed out. Head back to the trip and start a new one.
            </p>
            <a href="/feed" className="ch-btn ch-btn-primary">
              Back to feed
            </a>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <WebHeader session={session} active="bookings" />
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 32px 80px' }}>
        <BookingWizard intent={intent} />
      </main>
    </>
  )
}
