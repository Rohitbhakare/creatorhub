// Admin-app view types. Mirrors the shapes the Hono API returns for
// the admin auth/me endpoint and its friends. Re-exported from the
// `@creatorhub/shared` types where possible so the contract is one
// source of truth.

import type { AdminRole } from '@creatorhub/shared'

export type { AdminRole }

export interface AdminProfile {
  id: string
  email: string
  full_name: string
  role: AdminRole
  is_active: boolean
  must_change_password: boolean
  last_login_at: string | null
}

/** Standard envelope used by the Hono API. */
export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success?: false
  error: {
    type: string
    title: string
    status: number
    detail: string
    instance?: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
