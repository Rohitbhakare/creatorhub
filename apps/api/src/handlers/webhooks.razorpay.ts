/**
 * Razorpay Webhook Handler (E2.12).
 *
 * Events consumed:
 *   payment.captured               — payment made; extract transfer.id, create payout row
 *   account.under_review           — linked account status flip
 *   account.needs_clarification    —  "
 *   account.activated              —  " (also triggers payout.enabled notification)
 *   account.rejected               —  "
 *   account.suspended              —  "
 *   transfer.processed             — Razorpay accepted the release instruction
 *   transfer.settled               — settlement completed → payout status 'completed'
 *   payout.processed               — UPI/IMPS confirmation → 'completed' (redundant safety)
 *   payout.reversed | payout.failed — reversal or failure → 'failed'
 *
 * Idempotency: razorpay_webhook_events.event_id UNIQUE constraint guards against
 * duplicate deliveries. Signature: HMAC-SHA256(raw_body, webhook_secret).
 */

import type { Context } from 'hono'
import crypto from 'node:crypto'
import { supabase } from '../lib/supabase.js'
import { env } from '../env.js'
import { AppError } from '../errors/AppError.js'
import {
  createPayoutOnPaymentCaptured,
  updatePayoutByTransferId,
} from '../services/payout.service.js'
import { updateLinkedAccountStatus } from '../services/linked-account.service.js'
import {
  notifyPayoutsEnabled,
  notifyPayoutProcessed,
  notifyPayoutFailed,
  notifyLinkedAccountActionRequired,
} from '../services/payout-notifications.service.js'

type Row = Record<string, unknown>

export async function handleRazorpayWebhook(c: Context): Promise<Response> {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new AppError('internal', 500, 'Webhook secret not configured')
  }

  const signature = c.req.header('x-razorpay-signature')
  if (!signature) {
    throw new AppError('forbidden', 403, 'Missing webhook signature')
  }

  // Read raw body for signature verification (must be the exact bytes Razorpay sent).
  const rawBody = await c.req.text()

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  // Constant-time comparison to dodge timing side channels.
  let ok = false
  try {
    ok =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    ok = false
  }
  if (!ok) {
    throw new AppError('forbidden', 403, 'Invalid webhook signature')
  }

  let payload: {
    event?: string
    id?: string
    payload?: Record<string, unknown>
  }
  try {
    payload = JSON.parse(rawBody) as typeof payload
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  const eventType = payload.event
  const eventId = payload.id
  if (!eventType || !eventId) {
    throw new AppError('validation-failed', 400, 'Missing event or id')
  }

  // Idempotency: insert ignoring duplicates (UNIQUE constraint on event_id).
  const { error: insertError } = await supabase.from('razorpay_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    payload: payload.payload ?? {},
    processed: false,
  })

  // 23505 = duplicate → already handled. Accept and exit.
  if (insertError && (insertError as { code?: string }).code === '23505') {
    return c.json({ success: true, data: { duplicate: true } })
  }
  if (insertError) {
    throw new AppError('db-error', 500, 'Failed to record webhook event')
  }

  try {
    await dispatchEvent(eventType, payload.payload ?? {})
  } catch (err) {
    // Mark unprocessed so ops can replay; still return 200 to Razorpay unless
    // this was our own signature/auth error (handled above). Razorpay retries
    // on non-2xx — we prefer at-least-once via our own replay rather than
    // thrashing the producer.
    console.error(`[webhook.razorpay] dispatch failed for ${eventType} ${eventId}:`, (err as Error).message)
    return c.json({ success: true, data: { deferred: true } })
  }

  await supabase
    .from('razorpay_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('event_id', eventId)

  return c.json({ success: true, data: { processed: true } })
}

// ─── Event dispatch ──────────────────────────────────────────────────────────

async function dispatchEvent(
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (eventType) {
    case 'payment.captured':
      return onPaymentCaptured(payload)

    case 'account.under_review':
      return onAccountStatusEvent(payload, 'created', eventType)
    case 'account.needs_clarification':
      return onAccountStatusEvent(payload, 'created', eventType)
    case 'account.activated':
      return onAccountActivated(payload)
    case 'account.rejected':
      return onAccountStatusEvent(payload, 'deactivated', eventType)
    case 'account.suspended':
      return onAccountStatusEvent(payload, 'suspended', eventType)

    case 'transfer.processed':
      return onTransferProcessed(payload)
    case 'transfer.settled':
      return onTransferSettled(payload)

    case 'payout.processed':
      return onPayoutProcessed(payload)
    case 'payout.reversed':
    case 'payout.failed':
      return onPayoutReversed(payload)

    default:
      // Unknown event — swallow silently. We only care about the 10 above.
      return
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * payment.captured — link the Route transfer id back to the payout.
 * Payload shape: { payment: { entity: { order_id, ... } }, order: { entity: { id, transfers: [...] } } }
 * Note: Razorpay sometimes nests transfers on the payment entity directly.
 */
async function onPaymentCaptured(payload: Record<string, unknown>): Promise<void> {
  const payment = getEntity(payload, 'payment') as Row | null
  if (!payment) return

  const orderId = payment['order_id'] as string | undefined
  if (!orderId) return

  // Find the booking by razorpay_order_id.
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('razorpay_order_id', orderId)
    .maybeSingle()

  if (!booking) return

  const bookingId = (booking as Row).id as string

  // Pull the transfer id: check order.entity.transfers first, then payment.transfers.
  const order = getEntity(payload, 'order') as Row | null
  const orderTransfers = (order?.['transfers'] as Row[] | undefined) ?? []
  const paymentTransfers = (payment['transfers'] as Row[] | undefined) ?? []
  const transfers = [...orderTransfers, ...paymentTransfers]

  const transferId = transfers[0]?.['id'] as string | undefined
  if (!transferId) {
    // Free bookings / bookings without Route transfers don't need payout rows.
    return
  }

  await createPayoutOnPaymentCaptured(bookingId, transferId)
}

async function onAccountStatusEvent(
  payload: Record<string, unknown>,
  mapped: 'created' | 'suspended' | 'deactivated',
  eventType?: string,
): Promise<void> {
  const account = getEntity(payload, 'account') as Row | null
  const accountId = account?.['id'] as string | undefined
  if (!accountId) return

  await updateLinkedAccountStatus(accountId, mapped)

  // Action-required notification only for reasons the creator can act on.
  const actionable: Record<
    string,
    'needs_clarification' | 'rejected' | 'suspended'
  > = {
    'account.needs_clarification': 'needs_clarification',
    'account.rejected': 'rejected',
    'account.suspended': 'suspended',
  }
  const reason = eventType ? actionable[eventType] : undefined
  if (!reason) return

  const userId = await userIdForAccount(accountId)
  if (userId) {
    await notifyLinkedAccountActionRequired(userId, { reason })
  }
}

async function onAccountActivated(payload: Record<string, unknown>): Promise<void> {
  const account = getEntity(payload, 'account') as Row | null
  const accountId = account?.['id'] as string | undefined
  if (!accountId) return

  const activatedAtSec = account?.['activated_at'] as number | undefined
  const activatedAt = activatedAtSec
    ? new Date(activatedAtSec * 1000).toISOString()
    : new Date().toISOString()

  await updateLinkedAccountStatus(accountId, 'activated', activatedAt)

  const userId = await userIdForAccount(accountId)
  if (userId) {
    await notifyPayoutsEnabled(userId)
  }
}

async function userIdForAccount(accountId: string): Promise<string | null> {
  const { data } = await supabase
    .from('razorpay_linked_accounts')
    .select('user_id')
    .eq('razorpay_account_id', accountId)
    .maybeSingle()
  if (!data) return null
  return (data as Row).user_id as string
}

async function payoutContextForTransfer(transferId: string): Promise<{
  creatorId: string
  amountPaisa: number
  tdsPaisa: number
  bookingTitle: string | null
} | null> {
  const { data: payout } = await supabase
    .from('payouts')
    .select('creator_id, amount_paisa, tds_paisa, booking_id')
    .eq('razorpay_transfer_id', transferId)
    .maybeSingle()
  if (!payout) return null

  const p = payout as Row
  const bookingId = p.booking_id as string
  let bookingTitle: string | null = null
  if (bookingId) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('content:content_id ( title )')
      .eq('id', bookingId)
      .maybeSingle()
    const content = (booking as Row | null)?.content as
      | { title?: string | null }
      | null
    bookingTitle = content?.title ?? null
  }
  return {
    creatorId: p.creator_id as string,
    amountPaisa: p.amount_paisa as number,
    tdsPaisa: (p.tds_paisa as number | null) ?? 0,
    bookingTitle,
  }
}

async function onTransferProcessed(payload: Record<string, unknown>): Promise<void> {
  const transfer = getEntity(payload, 'transfer') as Row | null
  const transferId = transfer?.['id'] as string | undefined
  if (!transferId) return

  // Razorpay accepted the release — move to processing (if not already completed).
  await updatePayoutByTransferId(transferId, { status: 'processing' })
}

async function onTransferSettled(payload: Record<string, unknown>): Promise<void> {
  const transfer = getEntity(payload, 'transfer') as Row | null
  const transferId = transfer?.['id'] as string | undefined
  if (!transferId) return

  await notifyCompletionIfFirst(transferId)
  await updatePayoutByTransferId(transferId, {
    status: 'completed',
    processedAt: new Date().toISOString(),
  })
}

async function onPayoutProcessed(payload: Record<string, unknown>): Promise<void> {
  const payout = getEntity(payload, 'payout') as Row | null
  const payoutId = payout?.['id'] as string | undefined
  const transferId = payout?.['transfer_id'] as string | undefined
  if (!transferId) return

  await notifyCompletionIfFirst(transferId)
  const patch: Parameters<typeof updatePayoutByTransferId>[1] = {
    status: 'completed',
    processedAt: new Date().toISOString(),
  }
  if (payoutId) patch.razorpayPayoutId = payoutId

  await updatePayoutByTransferId(transferId, patch)
}

async function onPayoutReversed(payload: Record<string, unknown>): Promise<void> {
  const payout = getEntity(payload, 'payout') as Row | null
  const transferId = payout?.['transfer_id'] as string | undefined
  if (!transferId) return

  const reason =
    (payout?.['failure_reason'] as string | undefined) ??
    (payout?.['error_description'] as string | undefined) ??
    'reversed'

  const ctx = await payoutContextForTransfer(transferId)
  await updatePayoutByTransferId(transferId, {
    status: 'failed',
    failureReason: reason,
  })
  if (ctx) {
    await notifyPayoutFailed(ctx.creatorId, {
      reason,
      bookingTitle: ctx.bookingTitle,
    })
  }
}

/**
 * Send the "payout processed" notification only the first time — transfer.settled
 * and payout.processed can both fire, and we don't want to double-notify.
 * Reads the CURRENT row before the update flips status to 'completed'.
 */
async function notifyCompletionIfFirst(transferId: string): Promise<void> {
  const { data } = await supabase
    .from('payouts')
    .select('status')
    .eq('razorpay_transfer_id', transferId)
    .maybeSingle()
  if (!data) return
  const status = (data as Row).status as string
  if (status === 'completed') return // already notified via the other event

  const ctx = await payoutContextForTransfer(transferId)
  if (!ctx) return
  await notifyPayoutProcessed(ctx.creatorId, {
    amountPaisa: ctx.amountPaisa,
    tdsPaisa: ctx.tdsPaisa,
    bookingTitle: ctx.bookingTitle,
  })
}

// ─── Payload helpers ─────────────────────────────────────────────────────────

/**
 * Razorpay wraps event entities as { payload: { <kind>: { entity: {...} } } }.
 * We receive the inner `payload` object, so `payload.<kind>.entity` is the target.
 */
function getEntity(
  payload: Record<string, unknown>,
  kind: string,
): unknown {
  const wrapper = payload[kind] as Row | undefined
  if (!wrapper) return null
  return wrapper['entity'] ?? null
}
