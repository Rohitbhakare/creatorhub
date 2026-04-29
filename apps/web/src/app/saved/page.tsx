import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ContentCard } from '@/components/content/content-card'
import { getSession } from '@/lib/session'
import { apiFetch } from '@/lib/api-client'
import type { ContentCard as ContentCardModel } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Saved',
  robots: { index: false, follow: false },
}

async function fetchSaved(): Promise<ContentCardModel[]> {
  try {
    const data = await apiFetch<{ items: ContentCardModel[] }>(`/api/v1/social/saves`, {
      next: { revalidate: 0 },
    })
    return data.items
  } catch {
    return []
  }
}

export default async function SavedPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/saved')
  const items = await fetchSaved()

  return (
    <>
      <WebHeader session={session} active="saved" />
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1
          className="ch-display"
          style={{ fontSize: 'clamp(32px, 4vw, 44px)', color: 'var(--ink)', marginBottom: 24 }}
        >
          Saved chapters
        </h1>
        {items.length === 0 ? (
          <div
            className="ch-card"
            style={{ padding: 64, textAlign: 'center', color: 'var(--ink-muted)' }}
          >
            <p style={{ fontSize: 16, marginBottom: 20 }}>Nothing saved yet.</p>
            <Link href="/discover" className="ch-btn ch-btn-primary">
              Browse discover
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 32,
            }}
          >
            {items.map((c) => (
              <ContentCard key={c.id} content={c} />
            ))}
          </div>
        )}
      </main>
      <WebFooter />
    </>
  )
}
