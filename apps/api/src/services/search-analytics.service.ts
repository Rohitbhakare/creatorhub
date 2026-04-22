// Search analytics aggregates (E4.1, T10 · ADM-FR-010).
//
// Backs `/api/v1/admin/analytics/search/*`. All three endpoints are
// thin wrappers around parameterized Postgres RPCs defined in
// migration 019. Windows are server-enforced — Zod validates `7d` or
// `30d` and this service translates into the integer day count the
// RPCs expect.

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

export type AnalyticsWindow = '7d' | '30d'

export interface TopQueryRow {
  query: string
  search_count: number
  unique_users: number
  zero_result_count: number
}

export interface ZeroResultRow {
  query: string
  hits: number
  last_seen: string
}

export interface ClickThroughRow {
  query: string
  searches: number
  clicks: number
  ctr_pct: number
}

function daysFor(window: AnalyticsWindow): number {
  return window === '30d' ? 30 : 7
}

// ─── Top queries ───────────────────────────────────────────────

export async function getTopQueries(
  window: AnalyticsWindow,
  limit: number,
): Promise<TopQueryRow[]> {
  const { data, error } = await supabase.rpc('search_top_queries', {
    p_days: daysFor(window),
    p_limit: limit,
  })

  if (error) {
    console.error('[search-analytics.top] rpc error:', error.message)
    throw new AppError('db-error', 500, 'Failed to load top queries')
  }

  return ((data as TopQueryRow[] | null) ?? []).map((r) => ({
    query: r.query,
    search_count: Number(r.search_count),
    unique_users: Number(r.unique_users),
    zero_result_count: Number(r.zero_result_count),
  }))
}

// ─── Zero-result queries ───────────────────────────────────────

export async function getZeroResultQueries(
  window: AnalyticsWindow,
  limit: number,
): Promise<ZeroResultRow[]> {
  const { data, error } = await supabase.rpc('search_zero_results', {
    p_days: daysFor(window),
    p_limit: limit,
  })

  if (error) {
    console.error('[search-analytics.zero] rpc error:', error.message)
    throw new AppError('db-error', 500, 'Failed to load zero-result queries')
  }

  return ((data as ZeroResultRow[] | null) ?? []).map((r) => ({
    query: r.query,
    hits: Number(r.hits),
    last_seen: r.last_seen,
  }))
}

// ─── Click-through rate ───────────────────────────────────────

export async function getClickThroughRate(
  window: AnalyticsWindow,
  limit: number,
): Promise<ClickThroughRow[]> {
  const { data, error } = await supabase.rpc('search_click_through', {
    p_days: daysFor(window),
    p_limit: limit,
  })

  if (error) {
    console.error('[search-analytics.ctr] rpc error:', error.message)
    throw new AppError('db-error', 500, 'Failed to load click-through rate')
  }

  return ((data as ClickThroughRow[] | null) ?? []).map((r) => ({
    query: r.query,
    searches: Number(r.searches),
    clicks: Number(r.clicks),
    ctr_pct: Number(r.ctr_pct),
  }))
}
