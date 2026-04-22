'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RefundLookupForm({
  defaultValue,
}: {
  defaultValue: string
}): React.JSX.Element {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function submit(e: React.SyntheticEvent<HTMLFormElement>): void {
    e.preventDefault()
    const id = value.trim()
    if (id.length === 0) {
      router.push('/refunds')
      return
    }
    router.push(`/refunds?bookingId=${encodeURIComponent(id)}`)
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 max-w-lg"
      role="search"
    >
      <label htmlFor="booking-id" className="text-sm font-medium">
        Booking ID
      </label>
      <div className="flex gap-2">
        <input
          id="booking-id"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          placeholder="00000000-0000-0000-0000-000000000000"
          className="flex-1 border rounded-md px-3 py-2 text-sm font-mono outline-none"
          style={{ borderColor: 'var(--color-border-strong)' }}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-coral)' }}
        >
          Look up
        </button>
      </div>
    </form>
  )
}
