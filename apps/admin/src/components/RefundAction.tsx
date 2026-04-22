'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'
import { ConfirmActionModal } from './ConfirmActionModal'

export function RefundAction({
  bookingId,
  amountLabel,
}: {
  bookingId: string
  amountLabel: string
}): React.JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(reason: string): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/admin/bookings/${bookingId}/refund`, {
        method: 'POST',
        body: { reason },
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      if (err instanceof ClientApiError) {
        setError(err.message)
      } else {
        setError('Refund failed. Retry.')
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
        Process refund
      </button>

      {open && (
        <ConfirmActionModal
          title="Process refund"
          description={`Refund ${amountLabel} to the buyer via Razorpay. The booking will be marked 'refunded' and any pending payout release will be blocked. Reason is recorded in the audit log.`}
          cta="Process refund"
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
