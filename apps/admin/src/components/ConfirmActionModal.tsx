'use client'

import { useEffect, useState } from 'react'

export function ConfirmActionModal({
  title,
  description,
  cta,
  requiresReason,
  minReasonLength,
  submitting,
  error,
  destructive,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  cta: string
  requiresReason: boolean
  minReasonLength: number
  submitting: boolean
  error: string | null
  destructive: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}): React.JSX.Element {
  const [reason, setReason] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return (): void => {
      window.removeEventListener('keydown', onKey)
    }
  }, [onCancel, submitting])

  const tooShort =
    requiresReason && reason.trim().length < minReasonLength
  const disabled = submitting || tooShort

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {description}
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Reason
            {requiresReason ? (
              <span style={{ color: 'var(--color-error)' }}> *</span>
            ) : (
              <span
                className="font-normal"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {' '}
                (optional)
              </span>
            )}
          </span>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
            }}
            rows={3}
            maxLength={500}
            className="border rounded-md px-3 py-2 outline-none resize-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
            placeholder={
              requiresReason
                ? `At least ${String(minReasonLength)} characters`
                : 'Appears in the audit log'
            }
            autoFocus
          />
        </label>

        {error !== null && (
          <p
            role="alert"
            className="text-sm"
            style={{ color: 'var(--color-error)' }}
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md px-3 py-2 text-sm font-medium border disabled:opacity-60"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(reason)
            }}
            disabled={disabled}
            className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{
              backgroundColor: destructive
                ? 'var(--color-error)'
                : 'var(--color-coral)',
            }}
          >
            {submitting ? 'Working…' : cta}
          </button>
        </div>
      </div>
    </div>
  )
}
