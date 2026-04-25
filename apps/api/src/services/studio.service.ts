import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Types ───────────────────────────────────────────────────────

export interface StudioAlert {
  id: string
  alertType: string
  priority: number
  title: string
  body: string
  ctaTarget: string
}

export interface StudioStats {
  followers: number
  contentCount: number
  views: number
  saves: number
  bookings: number
}

export interface StudioContentItem {
  id: string
  title: string
  content_type: string
  status: string
  cover_image_url: string | null
  price_paisa: number | null
  like_count: number
  comment_count: number
  save_count: number
  updated_at: string
}

// ─── Quiet-state synthetic alert ─────────────────────────────────

const QUIET_STATE_ALERT: StudioAlert = {
  id: 'quiet',
  alertType: 'quiet_state',
  priority: 0,
  title: 'Start your first piece',
  body: 'Post a short write-up or put together your first itinerary.',
  ctaTarget: '/content/create',
}

// ─── getTopAlert ─────────────────────────────────────────────────

export async function getTopAlert(userId: string): Promise<StudioAlert> {
  const { data, error } = await supabase
    .from('studio_alerts')
    .select('id, alert_type, priority, payload')
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('priority', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new AppError('db-error', 500, 'Failed to fetch studio alert')

  if (!data) return QUIET_STATE_ALERT

  const payload = (data.payload ?? {}) as { title?: string; body?: string; cta_target?: string }

  return {
    id: data.id as string,
    alertType: data.alert_type as string,
    priority: data.priority as number,
    title: (payload.title ?? '') as string,
    body: (payload.body ?? '') as string,
    ctaTarget: (payload.cta_target ?? '') as string,
  }
}

// ─── dismissAlert ────────────────────────────────────────────────

export async function dismissAlert(userId: string, alertId: string): Promise<void> {
  const { data, error } = await supabase
    .from('studio_alerts')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select('id')

  if (error) throw new AppError('db-error', 500, 'Failed to dismiss alert')

  if (!data || data.length === 0) {
    throw new AppError('not-found', 404, 'Alert not found')
  }
}

// ─── getCreatorStats ─────────────────────────────────────────────

export async function getCreatorStats(userId: string): Promise<StudioStats> {
  const [userResult, contentResult] = await Promise.all([
    supabase
      .from('users')
      .select('follower_count, content_count')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('content')
      .select('save_count, like_count')
      .eq('user_id', userId)
      .eq('status', 'published'),
  ])

  if (userResult.error) throw new AppError('db-error', 500, 'Failed to fetch user stats')
  if (contentResult.error) throw new AppError('db-error', 500, 'Failed to fetch content stats')

  const user = userResult.data
  const contentRows = contentResult.data ?? []

  const totalSaves = contentRows.reduce((sum, row) => sum + (row.save_count ?? 0), 0)
  const totalViews = contentRows.reduce((sum, row) => sum + (row.like_count ?? 0), 0)

  return {
    followers: user?.follower_count ?? 0,
    contentCount: user?.content_count ?? 0,
    views: totalViews,
    saves: totalSaves,
    bookings: 0, // M1: payments not yet active
  }
}

// ─── getContentCounts ────────────────────────────────────────────

export interface ContentCounts {
  all: number
  draft: number
  published: number
  archived: number
}

export async function getContentCounts(userId: string): Promise<ContentCounts> {
  const { data, error } = await supabase
    .from('content')
    .select('status')
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) throw new AppError('db-error', 500, 'Failed to fetch content counts')

  const rows = (data ?? []) as Array<{ status: string }>
  return {
    all: rows.length,
    draft: rows.filter((r) => r.status === 'draft').length,
    published: rows.filter((r) => r.status === 'published').length,
    archived: rows.filter((r) => r.status === 'archived').length,
  }
}

// ─── listCreatorContent ──────────────────────────────────────────

export async function listCreatorContent(
  userId: string,
  options: { status?: string; type?: string; cursor?: string; limit?: number },
): Promise<{ items: StudioContentItem[]; next_cursor: string | null }> {
  const limit = Math.min(options.limit ?? 20, 50)

  let query = supabase
    .from('content')
    .select(
      'id, title, type, status, cover_image_url, price_paisa, like_count, comment_count, save_count, updated_at',
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.type) {
    query = query.eq('type', options.type)
  }

  // Cursor: encode as "updated_at::id" base64-encoded string
  if (options.cursor) {
    try {
      const decoded = Buffer.from(options.cursor, 'base64').toString('utf8')
      const [updatedAt, id] = decoded.split('::')
      if (updatedAt && id) {
        // Items before this cursor: updated_at < cursor_updated_at, OR same updated_at with id < cursor_id
        query = query.or(
          `updated_at.lt.${updatedAt},and(updated_at.eq.${updatedAt},id.lt.${id})`,
        )
      }
    } catch {
      // Ignore malformed cursors — return from start
    }
  }

  const { data, error } = await query

  if (error) throw new AppError('db-error', 500, 'Failed to fetch content')

  const rows = data ?? []
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows

  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1]!
    nextCursor = Buffer.from(`${last.updated_at}::${last.id}`).toString('base64')
  }

  return {
    items: items.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      content_type: row.type as string,
      status: row.status as string,
      cover_image_url: (row.cover_image_url ?? null) as string | null,
      price_paisa: (row.price_paisa ?? null) as number | null,
      like_count: (row.like_count ?? 0) as number,
      comment_count: (row.comment_count ?? 0) as number,
      save_count: (row.save_count ?? 0) as number,
      updated_at: row.updated_at as string,
    })),
    next_cursor: nextCursor,
  }
}
