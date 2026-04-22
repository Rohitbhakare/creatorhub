'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function UserSearchForm({
  defaultValue,
}: {
  defaultValue: string
}): React.JSX.Element {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function submit(): void {
    const params = new URLSearchParams()
    const q = value.trim()
    if (q.length > 0) params.set('q', q)
    router.push(`/users${params.size > 0 ? `?${params.toString()}` : ''}`)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex gap-2 w-full max-w-xl"
    >
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
        }}
        placeholder="username, email, or phone"
        className="flex-1 border rounded-md px-3 py-2 outline-none"
        style={{ borderColor: 'var(--color-border-strong)' }}
        autoFocus
      />
      <button
        type="submit"
        className="rounded-md px-4 py-2 font-medium text-white"
        style={{ backgroundColor: 'var(--color-coral)' }}
      >
        Search
      </button>
    </form>
  )
}
