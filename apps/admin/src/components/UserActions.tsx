'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'
import { ConfirmActionModal } from './ConfirmActionModal'

type Intent = 'suspend' | 'unsuspend' | 'feature' | 'unfeature'

interface IntentCopy {
  title: string
  description: string
  cta: string
  requiresReason: boolean
  minReasonLength: number
}

const COPY: Record<Intent, IntentCopy> = {
  suspend: {
    title: 'Suspend user',
    description:
      'Suspension hides all published content and blocks new logins. Reason is recorded to the audit log and is required.',
    cta: 'Suspend',
    requiresReason: true,
    minReasonLength: 10,
  },
  unsuspend: {
    title: 'Unsuspend user',
    description:
      'Restores account access and content visibility. Reason is optional.',
    cta: 'Unsuspend',
    requiresReason: false,
    minReasonLength: 0,
  },
  feature: {
    title: 'Feature user',
    description:
      'Featured users get prioritized in editorial surfaces. Reason is optional.',
    cta: 'Feature',
    requiresReason: false,
    minReasonLength: 3,
  },
  unfeature: {
    title: 'Unfeature user',
    description: 'Removes the user from featured editorial surfaces.',
    cta: 'Unfeature',
    requiresReason: false,
    minReasonLength: 0,
  },
}

export function UserActions({
  userId,
  isSuspended,
  isCreator,
}: {
  userId: string
  isSuspended: boolean
  isCreator: boolean
}): React.JSX.Element {
  const router = useRouter()
  const [intent, setIntent] = useState<Intent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(reason: string): Promise<void> {
    if (intent === null) return
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, string> = {}
      if (reason.trim().length > 0) body['reason'] = reason.trim()
      await apiFetch(`/admin/users/${userId}/${intent}`, {
        method: 'POST',
        body,
      })
      setIntent(null)
      router.refresh()
    } catch (err) {
      if (err instanceof ClientApiError) {
        setError(err.message)
      } else {
        setError('Action failed. Retry.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const copy = intent !== null ? COPY[intent] : null

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {isSuspended ? (
          <button
            type="button"
            onClick={() => {
              setIntent('unsuspend')
              setError(null)
            }}
            className="rounded-md px-3 py-2 text-sm font-medium border"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text)',
            }}
          >
            Unsuspend
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIntent('suspend')
              setError(null)
            }}
            className="rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            Suspend
          </button>
        )}

        {isCreator && (
          <button
            type="button"
            onClick={() => {
              setIntent('feature')
              setError(null)
            }}
            className="rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-coral)' }}
          >
            Feature
          </button>
        )}
        {isCreator && (
          <button
            type="button"
            onClick={() => {
              setIntent('unfeature')
              setError(null)
            }}
            className="rounded-md px-3 py-2 text-sm font-medium border"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text)',
            }}
          >
            Unfeature
          </button>
        )}
      </div>

      {copy !== null && (
        <ConfirmActionModal
          title={copy.title}
          description={copy.description}
          cta={copy.cta}
          requiresReason={copy.requiresReason}
          minReasonLength={copy.minReasonLength}
          submitting={submitting}
          error={error}
          destructive={intent === 'suspend'}
          onCancel={() => {
            setIntent(null)
          }}
          onConfirm={(reason) => {
            void run(reason)
          }}
        />
      )}
    </>
  )
}
