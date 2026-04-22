'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'
import { ConfirmActionModal } from './ConfirmActionModal'

type Intent = 'approve' | 'reject'

interface IntentCopy {
  title: string
  description: string
  cta: string
  requiresReason: boolean
  minReasonLength: number
  destructive: boolean
}

const COPY: Record<Intent, IntentCopy> = {
  approve: {
    title: 'Approve KYC',
    description:
      'Marks the user as KYC-verified and unlocks paid content publishing. This is recorded to the audit log.',
    cta: 'Approve',
    requiresReason: false,
    minReasonLength: 0,
    destructive: false,
  },
  reject: {
    title: 'Reject KYC',
    description:
      'User is notified with this reason and must re-submit. Reason must be at least 10 characters.',
    cta: 'Reject',
    requiresReason: true,
    minReasonLength: 10,
    destructive: true,
  },
}

export function KycActions({
  userId,
}: {
  userId: string
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
      if (intent === 'reject') body['reason'] = reason.trim()
      await apiFetch(`/admin/kyc/${userId}/${intent}`, {
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
        <button
          type="button"
          onClick={() => {
            setIntent('approve')
            setError(null)
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-success)' }}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => {
            setIntent('reject')
            setError(null)
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-error)' }}
        >
          Reject
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
          onConfirm={(reason) => {
            void run(reason)
          }}
        />
      )}
    </>
  )
}
