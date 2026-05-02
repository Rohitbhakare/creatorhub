import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { fetchContentDetail } from '@/lib/api'
import { getSession } from '@/lib/session'
import { MarkdownBody } from '@/components/reader/markdown-body'

interface Props {
  params: Promise<{ draftId: string }>
  searchParams: Promise<{ v?: string }>
}

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
}

/**
 * Owner-gated draft preview (E5.5 T7).
 *
 * Renders the unpublished content using the same reader components as
 * `/content/[id]`, but stripped of public chrome (no header / footer /
 * comments / save button) so an iframe of this URL inside the wizard
 * gives a clean WYSIWYG view.
 *
 * Access control: requires session AND `content.creator.id === session.userId`.
 * Anything else → 404 (not 403, to avoid leaking that the draft exists).
 */
export default async function DraftPreviewPage({ params, searchParams }: Props) {
  const { draftId } = await params
  const _sp = await searchParams
  const session = await getSession()
  if (!session) redirect(`/signin?next=/preview/${draftId}`)

  const content = await fetchContentDetail(draftId)
  if (!content) notFound()
  if (content.creator.id !== session.userId) notFound()

  // Refresh-trigger token from `?v=<timestamp>` keeps the browser from
  // caching across autosaves. Read but ignored — Next's render path
  // already keys on URL.
  void _sp.v

  return (
    <main
      id="main-content"
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '32px 24px 80px',
        background: 'var(--bg)',
        minHeight: '100vh',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono, var(--font-sans))',
          fontSize: 11,
          color: 'var(--primary-text-bg)',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Preview · Draft
      </p>
      <h1
        className="ch-display"
        style={{
          margin: 0,
          fontSize: 'clamp(28px, 4vw, 44px)',
          lineHeight: 1.05,
          color: 'var(--ink)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          marginBottom: 6,
        }}
      >
        {content.title || 'Untitled'}
      </h1>
      {content.description && (
        <p
          style={{
            fontSize: 18,
            color: 'var(--ink-soft)',
            fontStyle: 'italic',
            margin: '14px 0 28px',
            lineHeight: 1.5,
          }}
        >
          {content.description}
        </p>
      )}
      {content.coverImageUrl && (
        <div
          style={{
            width: '100%',
            aspectRatio: '2 / 1',
            borderRadius: 'var(--radius-lg)',
            backgroundImage: `url(${content.coverImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginBottom: 28,
          }}
          aria-hidden
        />
      )}
      {content.body ? (
        <article style={{ fontFamily: 'var(--font-serif)' }}>
          <MarkdownBody body={content.body} mode="magazine" />
        </article>
      ) : (
        <p style={{ color: 'var(--ink-muted)' }}>Nothing to preview yet — start writing.</p>
      )}
    </main>
  )
}
