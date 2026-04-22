'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { roleColor, roleLabel } from '../lib/rbac'
import type { AdminProfile } from '../lib/types'

export function TopBar({ admin }: { admin: AdminProfile }): React.JSX.Element {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function onLogout(): Promise<void> {
    setLoggingOut(true)
    try {
      await apiFetch('/admin/auth/logout', { method: 'POST' })
    } catch {
      // Swallow — we force a client navigation to /login regardless so
      // the session is treated as over from the user's perspective.
    }
    router.replace('/login')
    router.refresh()
  }

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-6"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium">{admin.full_name}</span>
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {admin.email}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="px-2 py-1 rounded-md text-xs font-medium text-white"
          style={{ backgroundColor: roleColor(admin.role) }}
        >
          {roleLabel(admin.role)}
        </span>
        <button
          type="button"
          onClick={() => {
            void onLogout()
          }}
          disabled={loggingOut}
          className="text-sm underline disabled:opacity-60"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  )
}
