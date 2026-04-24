// Server-side admin session loader.
//
// Wraps `GET /api/v1/admin/auth/me` into a convenience that returns
// the admin profile or `null` when the session is missing/expired.
// Server components call this to get the current admin without the
// ceremony of try/catch on 401.

import { serverFetch, ApiRequestError } from './server-api'
import type { AdminProfile } from './types'

export async function getCurrentAdmin(): Promise<AdminProfile | null> {
  try {
    const data = await serverFetch<AdminProfile>('/api/v1/admin/auth/me')
    return data
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      return null
    }
    throw err
  }
}
