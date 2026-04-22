// Firebase Identity Toolkit REST wrapper.
//
// The Firebase Admin SDK does NOT expose a server-side
// `signInWithEmailAndPassword` method — by design, password
// verification is a client concern. For the admin panel we must
// verify a typed password server-side, so we call the documented
// Identity Toolkit REST endpoint with our web API key.
//
// Docs: https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password
//
// All calls are POST-only, run over TLS, and the web API key is
// server-held (env var, never shipped to clients).

import { env } from '../env.js'
import { AppError } from '../errors/AppError.js'

const IDENTITY_TOOLKIT_BASE =
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? `http://${process.env['FIREBASE_AUTH_EMULATOR_HOST']}/identitytoolkit.googleapis.com/v1`
    : 'https://identitytoolkit.googleapis.com/v1'

interface SignInResponse {
  localId: string // firebase_uid
  email: string
  idToken: string
  refreshToken: string
  expiresIn: string
}

interface IdentityToolkitError {
  error?: {
    code?: number
    message?: string
    errors?: Array<{ message: string; domain?: string; reason?: string }>
  }
}

/**
 * Verify an admin's password by calling the Identity Toolkit.
 *
 * Returns the Firebase UID and email on success.
 * Throws AppError('invalid-credentials', 401) on any auth failure —
 * we deliberately collapse all failure modes (wrong password, unknown
 * email, disabled user) to a single 401 to avoid enumeration.
 *
 * Throws AppError('internal', 500) on network / configuration errors.
 */
export async function verifyAdminPassword(
  email: string,
  password: string,
): Promise<{ uid: string; email: string }> {
  const apiKey = env.FIREBASE_WEB_API_KEY
  if (!apiKey) {
    // Config issue — log but return a generic 500.
    console.error('[admin-auth] FIREBASE_WEB_API_KEY not configured')
    throw new AppError(
      'internal',
      500,
      'Admin authentication is not configured on this server',
    )
  }

  const url = `${IDENTITY_TOOLKIT_BASE}/accounts:signInWithPassword?key=${apiKey}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    })
  } catch (err) {
    console.error('[admin-auth] Identity Toolkit network error:', (err as Error).message)
    throw new AppError('internal', 500, 'Unable to reach authentication service')
  }

  if (!res.ok) {
    // Read the body for telemetry but NEVER surface it to the client
    // — it can contain enumeration-friendly codes like EMAIL_NOT_FOUND.
    let telemetry = ''
    try {
      const body = (await res.json()) as IdentityToolkitError
      telemetry = body.error?.message ?? `http_${res.status.toString()}`
    } catch {
      telemetry = `http_${res.status.toString()}`
    }
    console.warn(`[admin-auth] Identity Toolkit rejected login: ${telemetry}`)
    throw new AppError('invalid-credentials', 401, 'Invalid email or password')
  }

  const data = (await res.json()) as SignInResponse
  return { uid: data.localId, email: data.email }
}
