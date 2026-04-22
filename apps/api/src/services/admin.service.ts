import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Types ────────────────────────────────────────────────────

export interface UserSearchResult {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  is_suspended: boolean
  is_creator: boolean
  kyc_status: string | null
  created_at: string
}

export interface UserDetail {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  is_suspended: boolean
  is_creator: boolean
  kyc_status: string | null
  follower_count: number
  following_count: number
  created_at: string
  updated_at: string
}

export interface ContentModerationDetail {
  id: string
  type: string
  title: string | null
  status: string
  creator_id: string
  creator_username: string | null
  reports_count: number
  created_at: string
  updated_at: string
}

export interface KycQueueItem {
  user_id: string
  username: string | null
  display_name: string | null
  submitted_at: string
  pan_name: string
}

export interface KycSubmission {
  user_id: string
  status: string
  pan_number: string
  pan_name: string
  aadhaar_last4: string
  bank_account: string
  bank_ifsc: string
  bank_name: string
  selfie_url: string
  pan_doc_url: string
  aadhaar_doc_url: string | null
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface AuditEntry {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  created_at: string
}

// ─── Admin Audit Logging ──────────────────────────────────────

async function writeAdminAuditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Fire-and-forget — audit log must not interrupt main flow
    console.error('[admin] failed to write audit log:', action, targetType, targetId)
  }
}

// ─── searchUsers ──────────────────────────────────────────────

export async function searchUsers(query: string, limit: number): Promise<UserSearchResult[]> {
  const safeLimit = Math.min(limit, 100)
  const likePattern = `%${query}%`

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, email, phone, is_suspended, is_creator, kyc_status, created_at')
    .or(`username.ilike.${likePattern},email.ilike.${likePattern},phone.ilike.${likePattern}`)
    .limit(safeLimit)

  if (error) throw new AppError('db-error', 500, 'Failed to search users')

  return (data ?? []).map((row) => ({
    id: row.id as string,
    username: (row.username as string | null) ?? null,
    display_name: (row.display_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    is_suspended: (row.is_suspended as boolean) ?? false,
    is_creator: (row.is_creator as boolean) ?? false,
    kyc_status: (row.kyc_status as string | null) ?? null,
    created_at: row.created_at as string,
  }))
}

// ─── getUserDetail ────────────────────────────────────────────

export async function getUserDetail(userId: string): Promise<UserDetail> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, email, phone, is_suspended, is_creator, kyc_status, follower_count, following_count, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new AppError('db-error', 500, 'Failed to fetch user detail')
  if (!data) throw new AppError('not-found', 404, 'User not found')

  return {
    id: data.id as string,
    username: (data.username as string | null) ?? null,
    display_name: (data.display_name as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    is_suspended: (data.is_suspended as boolean) ?? false,
    is_creator: (data.is_creator as boolean) ?? false,
    kyc_status: (data.kyc_status as string | null) ?? null,
    follower_count: (data.follower_count as number) ?? 0,
    following_count: (data.following_count as number) ?? 0,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

// ─── suspendUser ──────────────────────────────────────────────

export async function suspendUser(userId: string, adminId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_suspended: true, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new AppError('db-error', 500, 'Failed to suspend user')

  await writeAdminAuditLog(adminId, 'suspend_user', 'user', userId, { reason })
}

// ─── unsuspendUser ────────────────────────────────────────────

export async function unsuspendUser(userId: string, adminId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_suspended: false, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new AppError('db-error', 500, 'Failed to unsuspend user')

  await writeAdminAuditLog(adminId, 'unsuspend_user', 'user', userId)
}

// ─── takedownContent ──────────────────────────────────────────

export async function takedownContent(contentId: string, adminId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('content')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', contentId)

  if (error) throw new AppError('db-error', 500, 'Failed to take down content')

  await writeAdminAuditLog(adminId, 'takedown_content', 'content', contentId, { reason })
}

// ─── getContentForModeration ──────────────────────────────────

export async function getContentForModeration(contentId: string): Promise<ContentModerationDetail> {
  const { data, error } = await supabase
    .from('content')
    .select('id, type, title, status, user_id, created_at, updated_at')
    .eq('id', contentId)
    .maybeSingle()

  if (error) throw new AppError('db-error', 500, 'Failed to fetch content')
  if (!data) throw new AppError('not-found', 404, 'Content not found')

  // Fetch creator username
  const { data: creator } = await supabase
    .from('users')
    .select('username')
    .eq('id', data.user_id as string)
    .maybeSingle()

  // Count reports
  const { count: reportsCount } = await supabase
    .from('content_reports')
    .select('id', { count: 'exact', head: true })
    .eq('content_id', contentId)

  return {
    id: data.id as string,
    type: data.type as string,
    title: (data.title as string | null) ?? null,
    status: data.status as string,
    creator_id: data.user_id as string,
    creator_username: (creator?.username as string | null) ?? null,
    reports_count: reportsCount ?? 0,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

// ─── listPendingKyc ───────────────────────────────────────────

export async function listPendingKyc(options: {
  cursor?: string
  limit?: number
}): Promise<{ items: KycQueueItem[]; nextCursor: string | null }> {
  const limit = Math.min(options.limit ?? 20, 100)

  let q = supabase
    .from('kyc_submissions')
    .select('user_id, pan_name, submitted_at, users!inner(username, display_name)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
    .limit(limit + 1)

  if (options.cursor) {
    try {
      const decoded = Buffer.from(options.cursor, 'base64url').toString('utf-8')
      const cursorTs = JSON.parse(decoded) as { submitted_at: string }
      q = q.gt('submitted_at', cursorTs.submitted_at)
    } catch {
      throw new AppError('validation-failed', 400, 'Invalid cursor')
    }
  }

  const { data, error } = await q

  if (error) throw new AppError('db-error', 500, 'Failed to list pending KYC submissions')

  const rows = data ?? []
  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  let nextCursor: string | null = null
  if (hasMore && rows.length > 0) {
    const last = rows[rows.length - 1]!
    nextCursor = Buffer.from(
      JSON.stringify({ submitted_at: last.submitted_at }),
    ).toString('base64url')
  }

  const items: KycQueueItem[] = rows.map((row) => {
    const user = (row.users as unknown) as { username: string | null; display_name: string | null } | null
    return {
      user_id: row.user_id as string,
      username: user?.username ?? null,
      display_name: user?.display_name ?? null,
      submitted_at: row.submitted_at as string,
      pan_name: row.pan_name as string,
    }
  })

  return { items, nextCursor }
}

// ─── getKycSubmission ─────────────────────────────────────────

export async function getKycSubmission(userId: string): Promise<KycSubmission> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select(
      'user_id, status, pan_number, pan_name, aadhaar_last4, bank_account, bank_ifsc, bank_name, selfie_url, pan_doc_url, aadhaar_doc_url, rejection_reason, submitted_at, reviewed_at, reviewed_by',
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new AppError('db-error', 500, 'Failed to fetch KYC submission')
  if (!data) throw new AppError('not-found', 404, 'KYC submission not found for this user')

  return {
    user_id: data.user_id as string,
    status: data.status as string,
    pan_number: data.pan_number as string,
    pan_name: data.pan_name as string,
    aadhaar_last4: data.aadhaar_last4 as string,
    bank_account: data.bank_account as string,
    bank_ifsc: data.bank_ifsc as string,
    bank_name: data.bank_name as string,
    selfie_url: data.selfie_url as string,
    pan_doc_url: data.pan_doc_url as string,
    aadhaar_doc_url: (data.aadhaar_doc_url as string | null) ?? null,
    rejection_reason: (data.rejection_reason as string | null) ?? null,
    submitted_at: data.submitted_at as string,
    reviewed_at: (data.reviewed_at as string | null) ?? null,
    reviewed_by: (data.reviewed_by as string | null) ?? null,
  }
}

// ─── processRefund ────────────────────────────────────────────

export async function processRefund(bookingId: string, adminId: string, reason: string): Promise<void> {
  // Fetch booking and Razorpay payment ID
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, razorpay_payment_id, total_paisa')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError) throw new AppError('db-error', 500, 'Failed to fetch booking')
  if (!booking) throw new AppError('not-found', 404, 'Booking not found')

  const paymentId = booking.razorpay_payment_id as string | null
  if (!paymentId) {
    throw new AppError('unprocessable', 422, 'Booking has no associated Razorpay payment ID')
  }

  const totalPaisa = booking.total_paisa as number
  const status = booking.status as string

  if (status === 'refunded') {
    throw new AppError('conflict', 409, 'Booking has already been refunded')
  }

  // Call Razorpay refund API
  const razorpayKeyId = process.env['RAZORPAY_KEY_ID']
  const razorpayKeySecret = process.env['RAZORPAY_KEY_SECRET']

  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new AppError('internal', 500, 'Razorpay credentials not configured')
  }

  const credentials = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')

  const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: totalPaisa,
      notes: { reason, admin_id: adminId, booking_id: bookingId },
    }),
  })

  if (!refundRes.ok) {
    const body = await refundRes.text()
    throw new AppError('internal', 500, `Razorpay refund failed: ${body}`)
  }

  const refundData = await refundRes.json() as { id?: string }

  // Update booking status to refunded
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'refunded',
      razorpay_refund_id: refundData.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (updateError) throw new AppError('db-error', 500, 'Refund processed but failed to update booking status')

  await writeAdminAuditLog(adminId, 'process_refund', 'booking', bookingId, { reason, razorpay_refund_id: refundData.id })
}

// ─── getAdminBookingDetail ────────────────────────────────────

export interface AdminBookingDetail {
  id: string
  status: string
  total_paisa: number
  creator_payout_paisa: number | null
  buyer_id: string
  buyer_username: string | null
  creator_id: string
  creator_username: string | null
  content_id: string | null
  content_title: string | null
  razorpay_payment_id: string | null
  razorpay_refund_id: string | null
  refund_in_flight: boolean
  created_at: string
  updated_at: string
}

export async function getAdminBookingDetail(
  bookingId: string,
): Promise<AdminBookingDetail> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, status, total_paisa, creator_payout_paisa, buyer_id, creator_id, content_id, razorpay_payment_id, razorpay_refund_id, created_at, updated_at, content:content_id ( title )',
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (error) throw new AppError('db-error', 500, 'Failed to fetch booking')
  if (!data) throw new AppError('not-found', 404, 'Booking not found')

  const buyerId = data.buyer_id as string
  const creatorId = data.creator_id as string

  const [{ data: users }, { data: refunds }] = await Promise.all([
    supabase.from('users').select('id, username').in('id', [buyerId, creatorId]),
    supabase
      .from('refunds')
      .select('id')
      .eq('booking_id', bookingId)
      .in('status', ['pending', 'processing']),
  ])

  const usernames = new Map<string, string | null>()
  for (const u of (users ?? []) as Array<{ id: string; username: string | null }>) {
    usernames.set(u.id, u.username)
  }

  const content = data.content as { title?: string } | null

  return {
    id: data.id as string,
    status: data.status as string,
    total_paisa: data.total_paisa as number,
    creator_payout_paisa: (data.creator_payout_paisa as number | null) ?? null,
    buyer_id: buyerId,
    buyer_username: usernames.get(buyerId) ?? null,
    creator_id: creatorId,
    creator_username: usernames.get(creatorId) ?? null,
    content_id: (data.content_id as string | null) ?? null,
    content_title: content?.title ?? null,
    razorpay_payment_id: (data.razorpay_payment_id as string | null) ?? null,
    razorpay_refund_id: (data.razorpay_refund_id as string | null) ?? null,
    refund_in_flight: ((refunds as Array<{ id: string }> | null) ?? []).length > 0,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

// ─── getAuditLog ──────────────────────────────────────────────

export async function getAuditLog(options: {
  cursor?: string
  limit?: number
  adminId?: string
}): Promise<{ items: AuditEntry[]; nextCursor: string | null }> {
  const limit = Math.min(options.limit ?? 20, 100)

  let q = supabase
    .from('admin_audit_log')
    .select('id, admin_id, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (options.adminId) {
    q = q.eq('admin_id', options.adminId)
  }

  if (options.cursor) {
    try {
      const decoded = Buffer.from(options.cursor, 'base64url').toString('utf-8')
      const cursorData = JSON.parse(decoded) as { created_at: string }
      q = q.lt('created_at', cursorData.created_at)
    } catch {
      throw new AppError('validation-failed', 400, 'Invalid cursor')
    }
  }

  const { data, error } = await q

  if (error) throw new AppError('db-error', 500, 'Failed to fetch audit log')

  const rows = data ?? []
  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  let nextCursor: string | null = null
  if (hasMore && rows.length > 0) {
    const last = rows[rows.length - 1]!
    nextCursor = Buffer.from(
      JSON.stringify({ created_at: last.created_at }),
    ).toString('base64url')
  }

  const items: AuditEntry[] = rows.map((row) => ({
    id: row.id as string,
    admin_id: row.admin_id as string,
    action: row.action as string,
    target_type: row.target_type as string,
    target_id: row.target_id as string,
    details: (row.details as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  }))

  return { items, nextCursor }
}
