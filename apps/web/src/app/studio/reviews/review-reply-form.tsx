'use client'

import { useState, useTransition } from 'react'

interface ReviewReplyFormProps {
  reviewId: string
  initialReply: string | null
}

export function ReviewReplyForm({ reviewId, initialReply }: ReviewReplyFormProps) {
  const [reply, setReply] = useState(initialReply ?? '')
  const [savedReply, setSavedReply] = useState(initialReply)
  const [editing, setEditing] = useState(initialReply === null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    if (reply.trim().length < 4) {
      setError('Reply must be at least a few words')
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/studio/reviews/${reviewId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ reply: reply.trim() }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Could not save reply')
          return
        }
        setSavedReply(reply.trim())
        setEditing(false)
      } catch {
        setError('Network error — please retry')
      }
    })
  }

  if (!editing && savedReply) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 14,
          background: 'var(--surface-alt)',
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          color: 'var(--ink-soft)',
          lineHeight: 1.55,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginBottom: 6,
          }}
        >
          Your reply
        </div>
        {savedReply}
        <button
          type="button"
          onClick={() => {
            setEditing(true)
          }}
          style={{
            marginLeft: 8,
            background: 'transparent',
            border: 0,
            color: 'var(--primary-deep)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        value={reply}
        onChange={(e) => {
          setReply(e.target.value)
        }}
        placeholder="Reply publicly — visible to everyone."
        rows={3}
        style={{
          padding: 12,
          fontSize: 14,
          fontFamily: 'inherit',
          color: 'var(--ink)',
          background: 'var(--surface)',
          border: '1.5px solid var(--hairline-strong)',
          borderRadius: 'var(--radius-md)',
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="submit" className="ch-btn ch-btn-primary" disabled={pending}>
          {pending ? 'Saving…' : savedReply ? 'Update reply' : 'Post reply'}
        </button>
        {savedReply && (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setReply(savedReply)
            }}
            className="ch-btn ch-btn-ghost"
          >
            Cancel
          </button>
        )}
        {error && (
          <span style={{ color: 'var(--danger)', fontSize: 13 }} role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  )
}
