import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { getSession } from '@/lib/session'
import { SubCatPicker } from './sub-cat-picker'

export const metadata: Metadata = {
  title: 'What calls you?',
  robots: { index: false, follow: false },
}

const SUB_CATS = [
  {
    id: 'road_trips',
    label: 'Road trips',
    blurb: 'Highway routes, weekend drives, long hauls.',
    photo: 'ch-photo--konkan',
  },
  {
    id: 'biking',
    label: 'Biking',
    blurb: 'Two wheels, twisty roads, mountain passes.',
    photo: 'ch-photo--ladakh',
  },
  {
    id: 'trekking',
    label: 'Trekking',
    blurb: 'Trails, summits, alpine meadows.',
    photo: 'ch-photo--monsoon',
  },
  {
    id: 'food_trails',
    label: 'Food trails',
    blurb: 'Local kitchens, street food, regional flavours.',
    photo: 'ch-photo--bandra',
  },
] as const

export default async function SubCategoriesPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/onboarding/sub-categories')

  return (
    <>
      <WebHeader variant="auth" />
      <main id="main-content"
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '40px 32px 80px',
        }}
      >
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
          Step 1 of 2
        </span>
        <h1
          className="ch-display"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--ink)', margin: '12px 0 12px' }}
        >
          What kind of travel{' '}
          <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>calls you?</em>
        </h1>
        <p
          style={{
            fontSize: 17,
            color: 'var(--ink-soft)',
            lineHeight: 1.55,
            maxWidth: 540,
            marginBottom: 32,
          }}
        >
          Pick at least 2. We&rsquo;ll use this to shape your home feed. You can change these later
          in settings.
        </p>
        <SubCatPicker options={[...SUB_CATS]} />
      </main>
    </>
  )
}
