import { apiFetchPublic } from '@/lib/api-client'
import { CommentComposeStub } from './comment-compose-stub'
import { CommentMoreClient } from './comment-more-client'

interface RawComment {
  id: string
  body: string
  created_at: string
  users: {
    id?: string
    display_name?: string | null
    username?: string | null
    avatar_url?: string | null
  } | null
}

interface RawListResponse {
  items: RawComment[]
  next_cursor: string | null
}

interface Props {
  contentId: string
  totalCount: number
  isAuthenticated: boolean
  /** Title used by the sign-in modal CTA copy. */
  contentTitle?: string
}

const PREVIEW_LIMIT = 3

/**
 * Comments section for the reader.
 *
 * Guests see the top {PREVIEW_LIMIT} comments + a `Sign in to read all N` button
 * that opens the contextual sign-in modal. Authed users see all comments and
 * a real compose box. Server-rendered so it's part of the SSR HTML for SEO
 * (more crawlable text on the page).
 */
export async function CommentsSection({
  contentId,
  totalCount,
  isAuthenticated,
  contentTitle,
}: Props) {
  let comments: RawComment[] = []
  try {
    const data = await apiFetchPublic<RawListResponse>(
      `/api/v1/content/${contentId}/comments?limit=${String(PREVIEW_LIMIT)}`,
      { next: { revalidate: 60 } },
    )
    comments = data?.items ?? []
  } catch {
    /* tolerate; section just shows empty state */
  }

  const hasMore = totalCount > comments.length

  return (
    <section
      style={{
        marginTop: 64,
        paddingTop: 32,
        borderTop: '1px solid var(--hairline)',
      }}
      aria-label="Comments"
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <h2
          className="ch-display"
          style={{
            fontSize: 'clamp(20px, 2.6vw, 26px)',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {totalCount > 0
            ? `${totalCount.toLocaleString('en-IN')} ${totalCount === 1 ? 'comment' : 'comments'}`
            : 'Comments'}
        </h2>
        {totalCount === 0 && (
          <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
            Be the first to share your take
          </span>
        )}
      </header>

      <CommentComposeStub
        contentId={contentId}
        isAuthenticated={isAuthenticated}
        {...(contentTitle !== undefined ? { contentTitle } : {})}
      />

      {comments.length > 0 ? (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '24px 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}
        </ul>
      ) : null}

      {hasMore && (
        <CommentMoreButton
          contentId={contentId}
          contentTitle={contentTitle ?? null}
          remaining={totalCount - comments.length}
          isAuthenticated={isAuthenticated}
        />
      )}
    </section>
  )
}

function CommentRow({ comment }: { comment: RawComment }) {
  const name = comment.users?.display_name ?? comment.users?.username ?? 'Reader'
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const when = formatRelative(comment.created_at)
  return (
    <li style={{ display: 'flex', gap: 14 }}>
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: 'linear-gradient(135deg, #d4b896, #a07c5a)',
          color: 'white',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-serif)',
          fontWeight: 600,
          fontSize: 14,
          flex: '0 0 auto',
          backgroundImage: comment.users?.avatar_url
            ? `url(${comment.users.avatar_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {comment.users?.avatar_url ? '' : initials || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 4,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{when}</span>
        </div>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-soft)',
            lineHeight: 1.55,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {comment.body}
        </p>
      </div>
    </li>
  )
}

function CommentMoreButton({
  contentId,
  contentTitle,
  remaining,
  isAuthenticated,
}: {
  contentId: string
  contentTitle: string | null
  remaining: number
  isAuthenticated: boolean
}) {
  // Authed users get a deep-link to the (future) full comments page; for now
  // we route to a hash anchor that they can scroll past — the route is the
  // same content page, so it's a no-op but doesn't break.
  if (isAuthenticated) {
    return (
      <a
        href={`/content/${contentId}#comments`}
        style={{
          display: 'inline-block',
          marginTop: 24,
          fontSize: 13.5,
          color: 'var(--primary-deep)',
          fontWeight: 600,
          textDecoration: 'none',
          borderBottom: '1.5px solid var(--primary)',
          paddingBottom: 2,
        }}
      >
        View {remaining.toLocaleString('en-IN')} more comments →
      </a>
    )
  }
  return (
    <CommentMoreClient
      remaining={remaining}
      {...(contentTitle ? { contentTitle } : {})}
    />
  )
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  const diff = Date.now() - t
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${String(m)}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${String(h)}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${String(d)}d ago`
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
