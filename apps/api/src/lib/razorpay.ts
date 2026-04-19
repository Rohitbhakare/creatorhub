/**
 * Razorpay client — typed thin wrappers for Route (linked accounts + transfers)
 * and Payouts fetch. Uses direct fetch with Basic auth to keep SDK coupling low.
 *
 * Error policy:
 *   - 4xx  → AppError('external_service', 502, description) with razorpayCode in detail
 *   - 5xx  → AppError('external_service', 502, 'Razorpay temporarily unavailable') + retryable hint
 *   - Net  → same 5xx shape
 *   - Razorpay key is NEVER included in AppError.detail or logs.
 */

import { env } from '../env.js'
import { AppError } from '../errors/AppError.js'

const BASE_URL = 'https://api.razorpay.com'
const TIMEOUT_MS = 15_000

// ─── Types ──────────────────────────────────────────────────

export type RzpLinkedAccountStatus =
  | 'created'
  | 'activated'
  | 'suspended'
  | 'needs_clarification'
  | 'rejected'
  | 'under_review'
  | 'deactivated'

export type RzpLinkedAccount = {
  id: string
  status: string
  email?: string
  type?: 'route' | 'standard'
  business_type?: string
  reference_id?: string
  phone?: string
  activated_at?: number
  [key: string]: unknown
}

export type CreateLinkedAccountParams = {
  email: string
  phone: string
  legal_business_name: string
  business_type: string
  contact_name: string
  profile: {
    category: string
    subcategory: string
    addresses: {
      registered: {
        street1: string
        street2?: string
        city: string
        state: string
        postal_code: string
        country: string
      }
    }
  }
  legal_info?: { pan?: string; gst?: string }
  reference_id?: string
}

export type RzpTransfer = {
  id: string
  status: string
  amount: number
  currency: string
  recipient: string
  on_hold: boolean
  on_hold_until?: number | null
  [key: string]: unknown
}

export type EditTransferParams = {
  on_hold?: 0 | 1
  on_hold_until?: number | null
}

export type RzpPayout = {
  id: string
  status: string
  amount: number
  fees?: number
  tax?: number
  [key: string]: unknown
}

// ─── HTTP helper ────────────────────────────────────────────

type RzpErrorBody = {
  error?: { code?: string; description?: string; field?: string }
}

function assertCreds(): { keyId: string; keySecret: string } {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('internal', 500, 'Razorpay credentials not configured')
  }
  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET }
}

function authHeader(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const { keyId, keySecret } = assertCreds()
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, TIMEOUT_MS)

  let response: Response
  try {
    const init: RequestInit = {
      method,
      headers: {
        Authorization: authHeader(keyId, keySecret),
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }
    if (body) init.body = JSON.stringify(body)
    response = await fetch(`${BASE_URL}${path}`, init)
  } catch (err) {
    clearTimeout(timeout)
    const msg =
      err instanceof Error && err.name === 'AbortError'
        ? 'Razorpay request timed out'
        : 'Razorpay request failed'
    throw new AppError('external_service', 502, msg)
  }
  clearTimeout(timeout)

  const rawText = await response.text()
  let parsed: unknown = null
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText)
    } catch {
      parsed = null
    }
  }

  if (response.ok) {
    return parsed as T
  }

  const rzpErr = (parsed as RzpErrorBody | null)?.error
  const description = rzpErr?.description ?? 'Razorpay request failed'
  const code = rzpErr?.code ?? `HTTP_${String(response.status)}`

  if (response.status >= 500) {
    throw new AppError(
      'external_service',
      502,
      'Razorpay temporarily unavailable',
    )
  }
  throw new AppError(
    'external_service',
    502,
    `${description} (razorpay:${code})`,
  )
}

// ─── Linked accounts (Route v2) ─────────────────────────────

export async function createLinkedAccount(
  params: CreateLinkedAccountParams,
): Promise<RzpLinkedAccount> {
  return request<RzpLinkedAccount>('POST', '/v2/accounts', { ...params, type: 'route' })
}

export async function fetchLinkedAccount(
  accountId: string,
): Promise<RzpLinkedAccount> {
  return request<RzpLinkedAccount>('GET', `/v2/accounts/${encodeURIComponent(accountId)}`)
}

// ─── Transfers (Route v1) ───────────────────────────────────

export async function editTransfer(
  transferId: string,
  params: EditTransferParams,
): Promise<RzpTransfer> {
  return request<RzpTransfer>('PATCH', `/v1/transfers/${encodeURIComponent(transferId)}`, params as Record<string, unknown>)
}

export async function reverseTransfer(
  transferId: string,
  amountPaisa?: number,
): Promise<{ id: string; status: string; transfer_id: string; amount: number }> {
  const body: Record<string, unknown> = {}
  if (amountPaisa !== undefined) body['amount'] = amountPaisa
  return request('POST', `/v1/transfers/${encodeURIComponent(transferId)}/reversals`, body)
}

// ─── Payouts ────────────────────────────────────────────────

export async function fetchPayout(payoutId: string): Promise<RzpPayout> {
  return request<RzpPayout>('GET', `/v1/payouts/${encodeURIComponent(payoutId)}`)
}
