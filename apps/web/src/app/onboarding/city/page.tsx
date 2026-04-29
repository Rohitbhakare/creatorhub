import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { getSession } from '@/lib/session'
import { fetchPopularCities } from '@/lib/api'
import { CityPicker } from './city-picker'

export const metadata: Metadata = {
  title: 'Where are you based?',
  robots: { index: false, follow: false },
}

export default async function CityPickerPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/onboarding/city')

  const cities = await fetchPopularCities()

  return (
    <>
      <WebHeader variant="auth" />
      <main id="main-content" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 80px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          Step 2 of 2
        </span>
        <h1
          className="ch-display"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--ink)', margin: '12px 0 12px' }}
        >
          Where are you{' '}
          <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>exploring from?</em>
        </h1>
        <p
          style={{
            fontSize: 17,
            color: 'var(--ink-soft)',
            lineHeight: 1.55,
            marginBottom: 32,
          }}
        >
          We&rsquo;ll show stories near you first. You can change this anytime.
        </p>
        <CityPicker cities={cities} />
      </main>
    </>
  )
}
