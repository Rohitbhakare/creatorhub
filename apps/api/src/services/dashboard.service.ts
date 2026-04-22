// Admin dashboard summary service (E4.1, T14).
//
// Backs `GET /api/v1/admin/dashboard/summary`. One round-trip produces
// every counter the admin home screen needs plus the most recent audit
// entries. Each count is a fast indexed lookup (all source tables have
// a filtered index on their status column — see migrations 007/008/009
// and 017). Queries run in parallel; a single failure is logged and
// surfaced as null for that tile rather than failing the whole response
// (the dashboard stays useful if one sub-query blips).

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

export interface DashboardActivity {
  id: string
  admin_email: string | null
  action: string
  target_type: string | null
  target_id: string | null
  created_at: string
}

export interface DashboardSummary {
  pending_kyc: number | null
  open_reports: number | null
  takedowns_today: number | null
  payouts_queued: number | null
  recent_activity: DashboardActivity[]
  generated_at: string
}

async function countPendingKyc(): Promise<number | null> {
  const { count, error } = await supabase
    .from('kyc_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) {
    console.error('[dashboard.kyc] count error:', error.message)
    return null
  }
  return count ?? 0
}

async function countOpenReports(): Promise<number | null> {
  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'in_review'])

  if (error) {
    console.error('[dashboard.reports] count error:', error.message)
    return null
  }
  return count ?? 0
}

async function countTakedownsToday(): Promise<number | null> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('admin_audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'takedown_content')
    .gte('created_at', startOfDay.toISOString())

  if (error) {
    console.error('[dashboard.takedowns] count error:', error.message)
    return null
  }
  return count ?? 0
}

async function countPayoutsQueued(): Promise<number | null> {
  const { count, error } = await supabase
    .from('payouts')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'scheduled'])

  if (error) {
    console.error('[dashboard.payouts] count error:', error.message)
    return null
  }
  return count ?? 0
}

async function recentActivity(): Promise<DashboardActivity[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, admin_email, action, target_type, target_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[dashboard.activity] query error:', error.message)
    throw new AppError('db-error', 500, 'Failed to load recent activity')
  }
  return (data as DashboardActivity[] | null) ?? []
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [pendingKyc, openReports, takedownsToday, payoutsQueued, activity] =
    await Promise.all([
      countPendingKyc(),
      countOpenReports(),
      countTakedownsToday(),
      countPayoutsQueued(),
      recentActivity(),
    ])

  return {
    pending_kyc: pendingKyc,
    open_reports: openReports,
    takedowns_today: takedownsToday,
    payouts_queued: payoutsQueued,
    recent_activity: activity,
    generated_at: new Date().toISOString(),
  }
}
