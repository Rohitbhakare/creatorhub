'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'
import { ConfirmActionModal } from './ConfirmActionModal'

type Intent = 'dismissed' | 'content_removed' | 'user_suspended'

interface IntentCopy {
  title: string
  description: string
  cta: string
  requiresReason: boolean
  minReasonLength: number
  destructive: boolean
}

const COPY: Record<Intent, IntentCopy> = {
  dismissed: {
    title: 'Dismiss report',
    description:
      'Mark this report as reviewed with no action. The report will be closed and removed from the queue.',
    cta: 'Dismiss',
    requiresReason: false,
    minReasonLength: 0,
    destructive: false,
  },
  content_removed: {
    title: 'Record content takedown',
    description:
      'Marks the report as actioned with disposition "content_removed". This records what happened — the actual takedown must be performed from the content detail page.',
    cta: 'Record takedown',
    requiresReason: false,
    minReasonLength: 0,
    destructive: true,
  },
  user_suspended: {
    title: 'Record user suspension',
    description:
      'Marks the report as actioned with disposition "user_suspended". This records what happened — the actual suspension must be performed from the user detail page.',
    cta: 'Record suspension',
    requiresReason: false,
    minReasonLength: 0,
    destructive: true,
  },
}

export function ModerationActions({
  reportId,
}: {
  reportId: string
}): React.JSX.Element {
  const router = useRouter()
  const [intent, setIntent] = useState<Intent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(): Promise<void> {
    if (intent === null) return
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/admin/reports/${reportId}/action`, {
        method: 'POST',
        body: { action: intent },
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
        <button
          type="button"
          onClick={() => {
            setIntent('dismissed')
            setError(null)
          }}
          className="rounded-md px-3 py-2 text-sm font-medium border"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => {
            setIntent('content_removed')
            setError(null)
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-coral)' }}
        >
          Record takedown
        </button>
        <button
          type="button"
          onClick={() => {
            setIntent('user_suspended')
            setError(null)
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-error)' }}
        >
          Record suspension
        </button>
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
          destructive={copy.destructive}
          onCancel={() => {
            setIntent(null)
          }}
          onConfirm={() => {
            void run()
          }}
        />
      )}
    </>
  )
}
