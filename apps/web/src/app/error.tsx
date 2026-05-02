'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Browser-side error reporting (server has its own logger via api-client).
    if (typeof window !== 'undefined') {
      console.error('[ch] route error', { message: error.message, digest: error.digest })
    }
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1
          className="ch-display"
          style={{ fontSize: 36, color: 'var(--ink)', marginBottom: 16 }}
        >
          Something went wrong
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 24 }}>
          We hit a snag rendering this page. Refreshing usually clears it. If it keeps happening,
          drop us a note and we&rsquo;ll dig in.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-muted)',
              marginBottom: 24,
            }}
          >
            ref: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="ch-btn ch-btn-primary" type="button">
            Try again
          </button>
          <Link href="/" className="ch-btn ch-btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
