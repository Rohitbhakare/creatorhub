import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReportReason =
  | 'spam'
  | 'nudity'
  | 'violence'
  | 'harassment'
  | 'misinformation'
  | 'other'

export type ReportedType = 'content' | 'user' | 'comment' | 'review'

type Row = Record<string, unknown>

export type Report = {
  id: string
  reporter_id: string | null
  reported_type: ReportedType
  reported_id: string
  reason: ReportReason
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
  actioned_by: string | null
  actioned_at: string | null
  action_taken: string | null
  created_at: string
}

export type Strike = {
  id: string
  user_id: string
  reason: string
  given_by: string
  strike_count: number
  created_at: string
}

// ─── Cursor helpers ──────────────────────────────────────────────────────────

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString('base64url')
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
    const [createdAt, id] = decoded.split('|')
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

// ─── submitReport ────────────────────────────────────────────────────────────

/**
 * Submit a user report.
 * Rate limit: max 10 reports per user per hour (checked in DB).
 * Duplicate check: same reporter + reported_id + reason within 24h → 409.
 */
export async function submitReport(
  reporterId: string,
  reportedType: ReportedType,
  reportedId: string,
  reason: ReportReason,
  details?: string,
): Promise<{ id: string }> {
  // Rate limit: count reports in the last hour for this reporter
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error: countError } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_id', reporterId)
    .gte('created_at', oneHourAgo)

  if (countError) {
    throw new AppError('db-error', 500, 'Failed to check report rate limit')
  }

  if ((count ?? 0) >= 10) {
    throw new AppError(
      'rate-limited',
      429,
      'You have submitted too many reports. Please try again later.',
    )
  }

  // Duplicate check: same reporter + reported_id + reason within last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing, error: dupError } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', reporterId)
    .eq('reported_id', reportedId)
    .eq('reason', reason)
    .gte('created_at', oneDayAgo)
    .limit(1)
    .maybeSingle()

  if (dupError) {
    throw new AppError('db-error', 500, 'Failed to check duplicate report')
  }

  if (existing) {
    throw new AppError(
      'conflict',
      409,
      'You have already reported this content for the same reason recently.',
    )
  }

  // Build insert — only include details if provided (exactOptionalPropertyTypes compliance)
  const insertPayload: Record<string, unknown> = {
    reporter_id: reporterId,
    reported_type: reportedType,
    reported_id: reportedId,
    reason,
    status: 'pending',
  }

  if (details !== undefined) {
    insertPayload.details = details
  }

  const { data, error } = await supabase
    .from('reports')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to submit report')
  }

  return { id: data.id as string }
}

// ─── checkToxicity ───────────────────────────────────────────────────────────

/**
 * Check text toxicity using the Perspective API.
 * Returns score 0–1. Returns 0 if API unavailable (fail-open).
 * Never throws — any failure is logged and returns 0.
 */
export async function checkToxicity(text: string): Promise<number> {
  const apiKey = process.env['PERSPECTIVE_API_KEY']

  if (!apiKey) {
    console.warn('[trust] PERSPECTIVE_API_KEY not set — toxicity check skipped (fail-open)')
    return 0
  }

  try {
    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text },
        requestedAttributes: { TOXICITY: {} },
        languages: ['en', 'hi'],
      }),
    })

    if (!res.ok) {
      console.error(
        `[trust] Perspective API error: ${res.status.toString()} ${res.statusText}`,
      )
      return 0
    }

    const json = (await res.json()) as Record<string, unknown>
    const attributeScores = json['attributeScores'] as Record<string, unknown> | undefined
    const toxicity = attributeScores?.['TOXICITY'] as Record<string, unknown> | undefined
    const summaryScore = toxicity?.['summaryScore'] as Record<string, unknown> | undefined
    const score = summaryScore?.['value']

    if (typeof score !== 'number') {
      console.error('[trust] Perspective API returned unexpected shape:', json)
      return 0
    }

    return score
  } catch (err) {
    console.error('[trust] Perspective API call failed:', err)
    return 0
  }
}

// ─── moderateText ────────────────────────────────────────────────────────────

/**
 * Check text toxicity and auto-flag in moderation queue if score >= 0.8.
 * Creates a system report (reporter_id = null) for toxic content.
 */
export async function moderateText(
  contentId: string,
  text: string,
  contentType: string,
): Promise<{ isToxic: boolean; score: number }> {
  const score = await checkToxicity(text)
  const isToxic = score >= 0.8

  if (isToxic) {
    // Auto-flag: insert system report with reporter_id = null
    const { error } = await supabase.from('reports').insert({
      reporter_id: null,
      reported_type: contentType as ReportedType,
      reported_id: contentId,
      reason: 'other' as ReportReason,
      details: `Auto-flagged by toxicity check. Score: ${score.toFixed(4)}`,
      status: 'pending',
    })

    if (error) {
      // Log but don't throw — toxicity auto-flag is non-blocking
      console.error('[trust] Failed to insert auto-flag report:', error)
    }
  }

  return { isToxic, score }
}

// ─── getPendingReports ────────────────────────────────────────────────────────

export type GetPendingReportsOptions = {
  cursor?: string
  limit?: number
  reportedType?: ReportedType
}

/**
 * Get pending reports (admin). Cursor-paginated by created_at DESC.
 */
export async function getPendingReports(
  options: GetPendingReportsOptions,
): Promise<{ items: Report[]; nextCursor: string | null }> {
  const limit = options.limit ?? 20
  const decodedCursor = options.cursor ? decodeCursor(options.cursor) : null

  let query = supabase
    .from('reports')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (options.reportedType !== undefined) {
    query = query.eq('reported_type', options.reportedType)
  }

  if (decodedCursor) {
    query = query.or(
      `created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`,
    )
  }

  query = query.limit(limit + 1)

  const { data, error } = await query

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch pending reports')
  }

  const rows = (data ?? []) as Row[]
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows

  let nextCursor: string | null = null
  if (hasMore) {
    const last = items[items.length - 1]!
    nextCursor = encodeCursor(last['created_at'] as string, last['id'] as string)
  }

  return {
    items: items as unknown as Report[],
    nextCursor,
  }
}

// ─── actionReport ────────────────────────────────────────────────────────────

/**
 * Admin: action a report. Marks it as reviewed + records action taken.
 */
export async function actionReport(
  reportId: string,
  adminId: string,
  action: 'content_removed' | 'user_suspended' | 'dismissed',
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('reports')
    .select('id, status')
    .eq('id', reportId)
    .maybeSingle()

  if (fetchError) {
    throw new AppError('db-error', 500, 'Failed to fetch report')
  }

  if (!existing) {
    throw new AppError('not-found', 404, 'Report not found')
  }

  const newStatus = action === 'dismissed' ? 'dismissed' : 'actioned'

  const { error } = await supabase
    .from('reports')
    .update({
      status: newStatus,
      actioned_by: adminId,
      actioned_at: new Date().toISOString(),
      action_taken: action,
    })
    .eq('id', reportId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to action report')
  }
}

// ─── giveStrike ──────────────────────────────────────────────────────────────

/**
 * Admin: give a user a strike. Increments strike_count by 1.
 */
export async function giveStrike(
  userId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  // Verify user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    throw new AppError('db-error', 500, 'Failed to verify user')
  }

  if (!user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  const { error } = await supabase.from('user_strikes').insert({
    user_id: userId,
    reason,
    given_by: adminId,
    strike_count: 1,
  })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to record strike')
  }
}

// ─── getUserStrikes ──────────────────────────────────────────────────────────

/**
 * Admin: get a user's strike history and total count.
 */
export async function getUserStrikes(
  userId: string,
): Promise<{ count: number; strikes: Strike[] }> {
  const { data, error } = await supabase
    .from('user_strikes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch user strikes')
  }

  const strikes = (data ?? []) as unknown as Strike[]

  // Total is the sum of strike_count on each row (each row may represent multiple strikes)
  const total = strikes.reduce((sum, s) => sum + (s.strike_count ?? 1), 0)

  return { count: total, strikes }
}
