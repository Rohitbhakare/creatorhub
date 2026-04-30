'use client'

import { useSignInModal } from '@/components/auth/sign-in-modal-provider'

interface Props {
  remaining: number
  contentTitle?: string
}

/**
 * Guest-facing "View N more comments" button. Opens the contextual sign-in
 * modal so the user doesn't lose their scroll position.
 */
export function CommentMoreClient({ remaining, contentTitle }: Props) {
  const { openSignInModal } = useSignInModal()
  return (
    <button
      type="button"
      onClick={() => {
        const truncated =
          contentTitle && contentTitle.length > 36
            ? `${contentTitle.slice(0, 35)}…`
            : contentTitle
        openSignInModal({
          contextLabel: truncated ? `Read all comments on “${truncated}”` : 'Read all comments',
          reason: "We'll bring you straight back to where you were.",
        })
      }}
      style={{
        marginTop: 24,
        background: 'transparent',
        border: 'none',
        padding: 0,
        fontSize: 13.5,
        color: 'var(--primary-deep)',
        fontWeight: 600,
        cursor: 'pointer',
        borderBottom: '1.5px solid var(--primary)',
        paddingBottom: 2,
        fontFamily: 'inherit',
      }}
    >
      Sign in to read all {remaining.toLocaleString('en-IN')} comments →
    </button>
  )
}
