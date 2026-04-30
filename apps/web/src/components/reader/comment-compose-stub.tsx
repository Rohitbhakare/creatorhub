'use client'

import { useSignInModal } from '@/components/auth/sign-in-modal-provider'

interface Props {
  contentId: string
  isAuthenticated: boolean
  contentTitle?: string
}

/**
 * The compose row at the top of the comments section. For guests this is a
 * stub field whose click opens the contextual sign-in modal — the field
 * itself is purely visual. Authed users get a real textarea (TBD: full
 * compose UI is a follow-up; for now we link to the legacy /signin?next
 * which is harmless because authed users don't see this branch).
 *
 * Keeping authed compose simple here on purpose — the whole comments thread
 * UI is a separate workstream. This stub only exists so guests see "Sign in
 * to comment" as a tasteful nudge, not a missing affordance.
 */
export function CommentComposeStub({
  contentId,
  isAuthenticated,
  contentTitle,
}: Props) {
  const { openSignInModal } = useSignInModal()

  if (isAuthenticated) {
    // Authed compose comes later — see TODO above. For now show a simple
    // input that posts a comment via an inline mutation. Skipping that here
    // because the comments thread is itself a follow-up.
    return (
      <div
        style={{
          padding: 16,
          border: '1.5px solid var(--hairline)',
          borderRadius: 14,
          background: 'var(--surface)',
          color: 'var(--ink-muted)',
          fontSize: 13.5,
        }}
      >
        Comment box coming soon — meanwhile,{' '}
        <a href={`/content/${contentId}#comments`} style={{ color: 'var(--ink)' }}>
          view the full thread
        </a>
        .
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        const truncated =
          contentTitle && contentTitle.length > 36
            ? `${contentTitle.slice(0, 35)}…`
            : contentTitle
        openSignInModal({
          contextLabel: truncated ? `Comment on “${truncated}”` : 'Join the conversation',
          reason: 'Comments make the platform — sign in to share what you think.',
        })
      }}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '14px 18px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: '1.5px solid var(--hairline)',
        color: 'var(--ink-muted)',
        fontSize: 14,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Sign in to comment
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: 'var(--primary-deep)',
          fontWeight: 600,
        }}
      >
        Free →
      </span>
    </button>
  )
}
