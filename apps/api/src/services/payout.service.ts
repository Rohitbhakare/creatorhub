/**
 * Payout Service — Razorpay Route payout lifecycle (E2.12).
 *
 * State machine:
 *   pending    → scheduled   (booking completed, +48h timer armed)
 *   scheduled  → processing  (on_hold cleared; settlement in flight)
 *   processing → completed   (payout.processed webhook)
 *   any        → failed      (reversal / webhook failure)
 *
 * Release guard:
 *   - Booking must be `completed`
 *   - No refund must be `pending` or `processing`
 *   - `scheduled_at <= NOW()`
 */

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import * as razorpay from '../lib/razorpay.js'
import type { PayoutStatus, PayoutSummary, PayoutListResponse } from '@creatorhub/shared'
import { notifyPayoutFailed } from './payout-notifications.service.js'

type Row = Record<string, unknown>
const COMPLETION_HOLD_MS = 48 * 60 * 60 * 1000 // 48h dispute window

// ─── createPayoutOnPaymentCaptured ──────────────────────────

/**
 * Called from the payment.captured webhook. Idempotent via the UNIQUE (booking_id)
 * constraint — repeated deliveries are a no-op.
 */
export async function createPayoutOnPaymentCaptured(
  bookingId: string,
  transferId: string,
): Promise<void> {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, creator_id, creator_payout_paisa, tds_paisa')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }
  const b = booking as Row

  const { error } = await supabase.from('payouts').insert({
    booking_id: bookingId,
    creator_id: b.creator_id as string,
    amount_paisa: b.creator_payout_paisa as number,
    tds_paisa: (b.tds_paisa as number | null) ?? 0,
    status: 'pending',
    razorpay_transfer_id: transferId,
    scheduled_at: new Date().toISOString(),
  })

  // UNIQUE constraint on booking_id makes this idempotent. Supabase surfaces
  // conflicts as 23505 — callers can safely ignore.
  if (error && (error as { code?: string }).code !== '23505') {
    throw new AppError('db-error', 500, 'Failed to create payout')
  }
}

// ─── schedulePayoutOnBookingCompleted ───────────────────────

export async function schedulePayoutOnBookingCompleted(
  bookingId: string,
): Promise<void> {
  const scheduledAt = new Date(Date.now() + COMPLETION_HOLD_MS).toISOString()
  const { error } = await supabase
    .from('payouts')
    .update({ status: 'scheduled', scheduled_at: scheduledAt })
    .eq('booking_id', bookingId)
    .eq('status', 'pending')

  if (error) {
    throw new AppError('db-error', 500, 'Failed to schedule payout')
  }
}

// ─── releasePayout ──────────────────────────────────────────

export type ReleaseSkippedReason =
  | 'refund_in_flight'
  | 'booking_not_completed'
  | 'already_released'
  | 'not_due'
  | 'no_transfer_id'

export type ReleaseResult =
  | { status: 'released' }
  | { status: 'skipped'; reason: ReleaseSkippedReason }
  | { status: 'failed'; error: string }

export async function releasePayout(
  payoutId: string,
  opts: { force?: boolean } = {},
): Promise<ReleaseResult> {
  const { data: payout, error: fetchErr } = await supabase
    .from('payouts')
    .select('id, booking_id, status, razorpay_transfer_id, scheduled_at')
    .eq('id', payoutId)
    .maybeSingle()

  if (fetchErr || !payout) {
    throw new AppError('not-found', 404, 'Payout not found')
  }
  const p = payout as Row
  const status = p.status as PayoutStatus

  if (status === 'processing' || status === 'completed') {
    return { status: 'skipped', reason: 'already_released' }
  }
  if (!p.razorpay_transfer_id) {
    return { status: 'skipped', reason: 'no_transfer_id' }
  }
  // `force` lets a finance admin skip the 48h hold, but the financial
  // safety guards below (booking completed + no refund in flight) still
  // apply — those are integrity invariants, not time gates.
  if (
    !opts.force &&
    new Date(p.scheduled_at as string).getTime() > Date.now()
  ) {
    return { status: 'skipped', reason: 'not_due' }
  }

  // Booking must be completed
  const { data: booking } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', p.booking_id as string)
    .maybeSingle()
  if (!booking || (booking as Row).status !== 'completed') {
    return { status: 'skipped', reason: 'booking_not_completed' }
  }

  // No refund may be in flight
  const { data: refunds } = await supabase
    .from('refunds')
    .select('id, status')
    .eq('booking_id', p.booking_id as string)
    .in('status', ['pending', 'processing'])

  if (refunds && (refunds as Row[]).length > 0) {
    return { status: 'skipped', reason: 'refund_in_flight' }
  }

  // Tell Razorpay to release the hold
  try {
    await razorpay.editTransfer(p.razorpay_transfer_id as string, { on_hold: 0 })
  } catch (err) {
    const msg = (err as Error | undefined)?.message ?? 'release failed'
    await supabase
      .from('payouts')
      .update({ status: 'failed', failure_reason: msg })
      .eq('id', payoutId)
    // Best-effort notify — fire-and-forget.
    await notifyReleaseFailure(payoutId, msg)
    return { status: 'failed', error: msg }
  }

  const { error: updErr } = await supabase
    .from('payouts')
    .update({ status: 'processing' })
    .eq('id', payoutId)
    .eq('status', 'scheduled')

  if (updErr) {
    throw new AppError('db-error', 500, 'Failed to mark payout processing')
  }

  return { status: 'released' }
}

// ─── releasePendingPayouts (cron) ───────────────────────────

export async function releasePendingPayouts(): Promise<{
  released: number
  skipped: number
  failed: number
}> {
  const { data: rows, error } = await supabase
    .from('payouts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to query eligible payouts')
  }

  let released = 0
  let skipped = 0
  let failed = 0

  for (const row of (rows as Row[] | null) ?? []) {
    const r = await releasePayout(row.id as string)
    if (r.status === 'released') released += 1
    else if (r.status === 'skipped') skipped += 1
    else failed += 1
  }

  return { released, skipped, failed }
}

// ─── reversePayout ──────────────────────────────────────────

export async function reversePayout(
  payoutId: string,
  reason: string,
  amountPaisa?: number,
): Promise<void> {
  const { data: payout, error } = await supabase
    .from('payouts')
    .select('id, razorpay_transfer_id, status')
    .eq('id', payoutId)
    .maybeSingle()

  if (error || !payout) {
    throw new AppError('not-found', 404, 'Payout not found')
  }

  const p = payout as Row
  const transferId = p.razorpay_transfer_id as string | null

  if (transferId) {
    await razorpay.reverseTransfer(transferId, amountPaisa)
  }

  const { error: updErr } = await supabase
    .from('payouts')
    .update({ status: 'failed', failure_reason: reason })
    .eq('id', payoutId)

  if (updErr) {
    throw new AppError('db-error', 500, 'Failed to mark payout reversed')
  }
}

// ─── listPayoutsForCreator ──────────────────────────────────

type Cursor = { createdAt: string; id: string }
function encodeCursor(c: Cursor): string {
  return Buffer.from(`${c.createdAt}|${c.id}`).toString('base64url')
}
function decodeCursor(cursor: string): Cursor | null {
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|')
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

export async function listPayoutsForCreator(
  creatorId: string,
  filter: { status?: PayoutStatus },
  pagination: { cursor?: string; limit?: number },
): Promise<{ items: PayoutSummary[]; nextCursor: string | null }> {
  const limit = pagination.limit ?? 20
  const cursor = pagination.cursor ? decodeCursor(pagination.cursor) : null

  let query = supabase
    .from('payouts')
    .select(
      'id, booking_id, amount_paisa, tds_paisa, status, scheduled_at, processed_at, failure_reason, created_at',
    )
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (filter.status) {
    query = query.eq('status', filter.status)
  }
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data: rows, error } = await query
  if (error) {
    throw new AppError('db-error', 500, 'Failed to list payouts')
  }

  const all = (rows as Row[] | null) ?? []
  const hasMore = all.length > limit
  const items = hasMore ? all.slice(0, limit) : all

  // Bulk fetch booking titles
  const bookingIds = items.map((r) => r.booking_id as string)
  const bookingTitles = new Map<string, string>()
  if (bookingIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, content:content_id ( title )')
      .in('id', bookingIds)
    for (const row of (bookings ?? []) as Row[]) {
      const contentRow = row.content as { title?: string } | null
      bookingTitles.set(row.id as string, contentRow?.title ?? '')
    }
  }

  const summaries: PayoutSummary[] = items.map((r) => ({
    id: r.id as string,
    bookingId: r.booking_id as string,
    amountPaisa: r.amount_paisa as number,
    tdsPaisa: (r.tds_paisa as number | null) ?? 0,
    status: r.status as PayoutStatus,
    scheduledAt: r.scheduled_at as string,
    processedAt: (r.processed_at as string | null) ?? null,
    bookingTitle: bookingTitles.get(r.booking_id as string) ?? null,
    failureReason: (r.failure_reason as string | null) ?? null,
  }))

  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1]
    if (last) {
      nextCursor = encodeCursor({ createdAt: last.created_at as string, id: last.id as string })
    }
  }

  return { items: summaries, nextCursor }
}

// ─── getPayoutSummary (30-day rolling) ──────────────────────

export async function getPayoutSummary(creatorId: string): Promise<{
  pendingPaisa: number
  processingPaisa: number
  paidLast30dPaisa: number
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await supabase
    .from('payouts')
    .select('amount_paisa, status, processed_at')
    .eq('creator_id', creatorId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to summarize payouts')
  }

  let pending = 0
  let processing = 0
  let paid30 = 0
  for (const raw of (rows ?? []) as Row[]) {
    const amt = (raw.amount_paisa as number) ?? 0
    const status = raw.status as PayoutStatus
    if (status === 'pending' || status === 'scheduled') pending += amt
    else if (status === 'processing') processing += amt
    else if (status === 'completed') {
      const processedAt = raw.processed_at as string | null
      if (processedAt && processedAt >= thirtyDaysAgo) paid30 += amt
    }
  }

  return { pendingPaisa: pending, processingPaisa: processing, paidLast30dPaisa: paid30 }
}

// ─── getPayoutByTransferId ──────────────────────────────────
/** Used by webhook handlers for status transitions by transfer id. */
export async function updatePayoutByTransferId(
  transferId: string,
  patch: { status?: PayoutStatus; processedAt?: string; failureReason?: string; razorpayPayoutId?: string },
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.status) update['status'] = patch.status
  if (patch.processedAt) update['processed_at'] = patch.processedAt
  if (patch.failureReason) update['failure_reason'] = patch.failureReason
  if (patch.razorpayPayoutId) update['razorpay_payout_id'] = patch.razorpayPayoutId

  const { error } = await supabase
    .from('payouts')
    .update(update)
    .eq('razorpay_transfer_id', transferId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to update payout by transfer_id')
  }
}

// ─── internal: release-failure notification helper ──────────

async function notifyReleaseFailure(payoutId: string, reason: string): Promise<void> {
  try {
    const { data: row } = await supabase
      .from('payouts')
      .select('creator_id, booking_id')
      .eq('id', payoutId)
      .maybeSingle()
    if (!row) return
    const r = row as Row
    const bookingId = r.booking_id as string | null
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
    await notifyPayoutFailed(r.creator_id as string, {
      reason,
      bookingTitle,
    })
  } catch (err) {
    console.error('[payout] notifyReleaseFailure failed', payoutId, err)
  }
}

export async function getPayoutByBookingId(bookingId: string): Promise<{
  id: string
  status: PayoutStatus
  amountPaisa: number
  razorpayTransferId: string | null
} | null> {
  const { data, error } = await supabase
    .from('payouts')
    .select('id, status, amount_paisa, razorpay_transfer_id')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch payout')
  }
  if (!data) return null
  const r = data as Row
  return {
    id: r.id as string,
    status: r.status as PayoutStatus,
    amountPaisa: r.amount_paisa as number,
    razorpayTransferId: (r.razorpay_transfer_id as string | null) ?? null,
  }
}

// ─── listAdminPayouts (admin-wide queue) ────────────────────

export interface AdminPayoutRow {
  id: string
  creator_id: string
  creator_username: string | null
  booking_id: string
  booking_title: string | null
  amount_paisa: number
  tds_paisa: number
  status: PayoutStatus
  scheduled_at: string
  processed_at: string | null
  failure_reason: string | null
  created_at: string
}

export async function listAdminPayouts(options: {
  status?: PayoutStatus
  cursor?: string
  limit?: number
}): Promise<{ items: AdminPayoutRow[]; nextCursor: string | null }> {
  const limit = Math.min(options.limit ?? 25, 100)
  const cursor = options.cursor ? decodeCursor(options.cursor) : null

  let query = supabase
    .from('payouts')
    .select(
      'id, creator_id, booking_id, amount_paisa, tds_paisa, status, scheduled_at, processed_at, failure_reason, created_at',
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options.status) {
    query = query.eq('status', options.status)
  }
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) {
    throw new AppError('db-error', 500, 'Failed to list payouts')
  }

  const all = (data as Row[] | null) ?? []
  const hasMore = all.length > limit
  const rows = hasMore ? all.slice(0, limit) : all

  const bookingIds = rows.map((r) => r.booking_id as string)
  const creatorIds = Array.from(new Set(rows.map((r) => r.creator_id as string)))

  const bookingTitles = new Map<string, string>()
  if (bookingIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, content:content_id ( title )')
      .in('id', bookingIds)
    for (const row of (bookings ?? []) as Row[]) {
      const content = row.content as { title?: string } | null
      bookingTitles.set(row.id as string, content?.title ?? '')
    }
  }

  const usernames = new Map<string, string | null>()
  if (creatorIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', creatorIds)
    for (const row of (users ?? []) as Row[]) {
      usernames.set(row.id as string, (row.username as string | null) ?? null)
    }
  }

  const items: AdminPayoutRow[] = rows.map((r) => ({
    id: r.id as string,
    creator_id: r.creator_id as string,
    creator_username: usernames.get(r.creator_id as string) ?? null,
    booking_id: r.booking_id as string,
    booking_title: bookingTitles.get(r.booking_id as string) ?? null,
    amount_paisa: r.amount_paisa as number,
    tds_paisa: (r.tds_paisa as number | null) ?? 0,
    status: r.status as PayoutStatus,
    scheduled_at: r.scheduled_at as string,
    processed_at: (r.processed_at as string | null) ?? null,
    failure_reason: (r.failure_reason as string | null) ?? null,
    created_at: r.created_at as string,
  }))

  let nextCursor: string | null = null
  if (hasMore && rows.length > 0) {
    const last = rows[rows.length - 1]
    if (last) {
      nextCursor = encodeCursor({
        createdAt: last.created_at as string,
        id: last.id as string,
      })
    }
  }

  return { items, nextCursor }
}

// ─── getAdminPayoutDetail ───────────────────────────────────

export interface AdminPayoutDetail extends AdminPayoutRow {
  razorpay_transfer_id: string | null
  razorpay_payout_id: string | null
  booking_status: string | null
  refund_in_flight: boolean
}

export async function getAdminPayoutDetail(
  payoutId: string,
): Promise<AdminPayoutDetail> {
  const { data, error } = await supabase
    .from('payouts')
    .select(
      'id, creator_id, booking_id, amount_paisa, tds_paisa, status, scheduled_at, processed_at, failure_reason, created_at, razorpay_transfer_id, razorpay_payout_id',
    )
    .eq('id', payoutId)
    .maybeSingle()

  if (error) throw new AppError('db-error', 500, 'Failed to fetch payout')
  if (!data) throw new AppError('not-found', 404, 'Payout not found')
  const r = data as Row

  const bookingId = r.booking_id as string
  const creatorId = r.creator_id as string

  const [{ data: booking }, { data: user }, { data: refunds }] =
    await Promise.all([
      supabase
        .from('bookings')
        .select('status, content:content_id ( title )')
        .eq('id', bookingId)
        .maybeSingle(),
      supabase.from('users').select('username').eq('id', creatorId).maybeSingle(),
      supabase
        .from('refunds')
        .select('id')
        .eq('booking_id', bookingId)
        .in('status', ['pending', 'processing']),
    ])

  const bookingRow = (booking as Row | null) ?? null
  const content = bookingRow?.content as { title?: string } | null

  return {
    id: r.id as string,
    creator_id: creatorId,
    creator_username: (user as Row | null)?.username as string | null ?? null,
    booking_id: bookingId,
    booking_title: content?.title ?? null,
    amount_paisa: r.amount_paisa as number,
    tds_paisa: (r.tds_paisa as number | null) ?? 0,
    status: r.status as PayoutStatus,
    scheduled_at: r.scheduled_at as string,
    processed_at: (r.processed_at as string | null) ?? null,
    failure_reason: (r.failure_reason as string | null) ?? null,
    created_at: r.created_at as string,
    razorpay_transfer_id: (r.razorpay_transfer_id as string | null) ?? null,
    razorpay_payout_id: (r.razorpay_payout_id as string | null) ?? null,
    booking_status: (bookingRow?.status as string | null) ?? null,
    refund_in_flight: ((refunds as Row[] | null) ?? []).length > 0,
  }
}

// Export the type for handler convenience.
export type { PayoutSummary, PayoutListResponse }
