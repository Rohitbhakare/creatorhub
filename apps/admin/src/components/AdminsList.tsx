'use client'

import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'
import { roleColor, roleLabel } from '../lib/rbac'
import type { AdminRole } from '@creatorhub/shared'

const ROLES: AdminRole[] = [
  'super_admin',
  'content_moderator',
  'support',
  'finance',
  'operations',
]

export interface AdminRow {
  id: string
  email: string
  full_name: string
  role: AdminRole
  is_active: boolean
  must_change_password: boolean
  last_login_at: string | null
  created_at: string
}

function relativeTime(iso: string | null): string {
  if (iso === null) return 'never'
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${String(mins)}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${String(hrs)}h ago`
  const days = Math.round(hrs / 24)
  return `${String(days)}d ago`
}

export function AdminsList({
  initialItems,
  currentAdminId,
}: {
  initialItems: AdminRow[]
  currentAdminId: string
}): React.JSX.Element {
  const [items, setItems] = useState<AdminRow[]>(initialItems)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<{
    email: string
    password: string
  } | null>(null)

  function upsert(next: AdminRow): void {
    setItems((prev) => prev.map((r) => (r.id === next.id ? next : r)))
  }

  async function changeRole(row: AdminRow, role: AdminRole): Promise<void> {
    setError(null)
    try {
      const updated = await apiFetch<AdminRow>(`/admin/admins/${row.id}`, {
        method: 'PATCH',
        body: { role },
      })
      upsert(updated)
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message)
      else setError('Role change failed. Retry.')
    }
  }

  async function toggleActive(row: AdminRow): Promise<void> {
    setError(null)
    const next = !row.is_active
    try {
      const updated = await apiFetch<AdminRow>(`/admin/admins/${row.id}`, {
        method: 'PATCH',
        body: { is_active: next },
      })
      upsert(updated)
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message)
      else setError('Update failed. Retry.')
    }
  }

  async function resetPassword(row: AdminRow): Promise<void> {
    setError(null)
    if (
      !window.confirm(
        `Reset password for ${row.email}? They will be forced to change it on next login.`,
      )
    ) {
      return
    }
    try {
      const data = await apiFetch<{
        admin: AdminRow
        temp_password: string
      }>(`/admin/admins/${row.id}/reset-password`, { method: 'POST' })
      upsert(data.admin)
      setTempPassword({ email: data.admin.email, password: data.temp_password })
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message)
      else setError('Reset failed. Retry.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setCreating(true)
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-coral)' }}
        >
          New admin
        </button>
      </div>

      {error !== null && (
        <p
          role="alert"
          className="text-sm"
          style={{ color: 'var(--color-error)' }}
        >
          {error}
        </p>
      )}

      <div
        className="border rounded-lg overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead
            className="text-left text-xs uppercase tracking-wide"
            style={{
              color: 'var(--color-text-subtle)',
              backgroundColor: 'var(--color-surface-muted)',
            }}
          >
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const isSelf = row.id === currentAdminId
              return (
                <tr
                  key={row.id}
                  className="border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{row.full_name}</span>
                    {isSelf && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        (you)
                      </span>
                    )}
                    {row.must_change_password && (
                      <span
                        className="ml-2 text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--color-warning, #B88400)',
                          color: '#fff',
                        }}
                      >
                        pending first login
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.role}
                      onChange={(e) => {
                        const next = e.target.value as AdminRole
                        if (next !== row.role) void changeRole(row, next)
                      }}
                      className="border rounded-md px-2 py-1 text-xs"
                      style={{
                        borderColor: roleColor(row.role),
                        color: 'var(--color-text)',
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: row.is_active
                          ? 'var(--color-success)'
                          : 'var(--color-text-muted)',
                        color: '#fff',
                      }}
                    >
                      {row.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {relativeTime(row.last_login_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSelf}
                        title={
                          isSelf
                            ? 'Cannot deactivate your own account'
                            : undefined
                        }
                        onClick={() => {
                          void toggleActive(row)
                        }}
                        className="rounded-md px-2 py-1 text-xs font-medium border disabled:opacity-40"
                        style={{
                          borderColor: 'var(--color-border-strong)',
                          color: row.is_active
                            ? 'var(--color-error)'
                            : 'var(--color-text)',
                        }}
                      >
                        {row.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button
                        type="button"
                        disabled={isSelf}
                        title={
                          isSelf
                            ? 'Use /change-password for your own account'
                            : undefined
                        }
                        onClick={() => {
                          void resetPassword(row)
                        }}
                        className="rounded-md px-2 py-1 text-xs font-medium border disabled:opacity-40"
                        style={{
                          borderColor: 'var(--color-border-strong)',
                          color: 'var(--color-error)',
                        }}
                      >
                        Reset password
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {creating && (
        <CreateAdminModal
          onCancel={() => {
            setCreating(false)
          }}
          onCreated={(row, password) => {
            setCreating(false)
            setItems((prev) => [row, ...prev])
            setTempPassword({ email: row.email, password })
          }}
        />
      )}

      {tempPassword !== null && (
        <TempPasswordModal
          email={tempPassword.email}
          password={tempPassword.password}
          onClose={() => {
            setTempPassword(null)
          }}
        />
      )}
    </div>
  )
}

function CreateAdminModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void
  onCreated: (row: AdminRow, tempPassword: string) => void
}): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<AdminRole>('support')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const nameOk = fullName.trim().length >= 2
  const disabled = submitting || !emailOk || !nameOk

  async function submit(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<{ admin: AdminRow; temp_password: string }>(
        '/admin/admins',
        {
          method: 'POST',
          body: { email, full_name: fullName, role },
        },
      )
      onCreated(data.admin, data.temp_password)
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message)
      else setError('Create failed. Retry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold">New admin</h2>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Full name</span>
          <input
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
            }}
            maxLength={100}
            className="border rounded-md px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            value={email}
            type="email"
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            maxLength={254}
            className="border rounded-md px-3 py-2 outline-none font-mono text-xs"
            style={{ borderColor: 'var(--color-border-strong)' }}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Role</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as AdminRole)
            }}
            className="border rounded-md px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
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
              void submit()
            }}
            disabled={disabled}
            className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-coral)' }}
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TempPasswordModal({
  email,
  password,
  onClose,
}: {
  email: string
  password: string
  onClose: () => void
}): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold">Temporary password</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Share this with{' '}
          <span className="font-mono text-xs">{email}</span> out-of-band
          (WhatsApp / Signal / in person). It will not be shown again.
        </p>
        <code
          className="block px-3 py-2 rounded-md font-mono text-sm break-all"
          style={{
            backgroundColor: 'var(--color-surface-muted)',
            color: 'var(--color-text)',
          }}
        >
          {password}
        </code>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              void copy()
            }}
            className="rounded-md px-3 py-2 text-sm font-medium border"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-coral)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
