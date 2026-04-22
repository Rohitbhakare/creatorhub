'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'
import { ConfirmActionModal } from './ConfirmActionModal'

export function ForceReleaseAction({
  payoutId,
}: {
  payoutId: string
}): React.JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(reason: string): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/admin/payouts/release`, {
        method: 'POST',
        body: { payout_id: payoutId, reason },
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      if (err instanceof ClientApiError) {
        setError(err.message)
      } else {
        setError('Release failed. Retry.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setError(null)
        }}
        className="rounded-md px-3 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: 'var(--color-error)' }}
      >
        Force release
      </button>

      {open && (
        <ConfirmActionModal
          title="Force-release payout"
          description="Bypasses the 48h dispute window and instructs Razorpay to release the transfer. The booking-completed + no-refund-in-flight guards still apply. Reason is recorded in the audit log."
          cta="Force release"
          requiresReason
          minReasonLength={10}
          submitting={submitting}
          error={error}
          destructive
          onCancel={() => {
            setOpen(false)
          }}
          onConfirm={(reason) => {
            void run(reason)
          }}
        />
      )}
    </>
  )
}
