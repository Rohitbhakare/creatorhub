// Centralized env access for the admin app.
//
// `API_INTERNAL_URL` is the server-side URL used by Next.js route
// handlers + server components to reach the Hono API. In prod this is
// the internal Fly.io 6PN address; in dev it's localhost:3001.

export const API_INTERNAL_URL =
  process.env['API_INTERNAL_URL'] ?? 'http://localhost:3001'

// Admin session cookie name — must match `ADMIN_SESSION_COOKIE` in
// [apps/api/src/utils/admin-session.ts](apps/api/src/utils/admin-session.ts).
// Centralized here so middleware + proxy routes can reference it
// without cross-package import.
export const ADMIN_SESSION_COOKIE = 'ch_admin_session'
