// E4.1 admin panel types.

export const ADMIN_ROLES = [
  'super_admin',
  'content_moderator',
  'support',
  'finance',
  'operations',
] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export interface AdminProfile {
  id: string
  email: string
  full_name: string
  role: AdminRole
  is_active: boolean
  must_change_password: boolean
  last_login_at: string | null
  created_at: string
}

export interface AdminAuditEntry {
  id: string
  admin_id: string | null
  admin_email: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface EditorialCollectionSummary {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_image_url: string | null
  is_active: boolean
  priority: number
  source: 'algorithmic' | 'manual'
  content_count: number
  refreshed_at: string
  created_at: string
}

export interface EditorialCollectionDetail extends EditorialCollectionSummary {
  content_ids: string[]
}

export interface SearchTopQuery {
  query: string
  hits: number
  unique_users: number
}

export interface SearchZeroResultQuery {
  query: string
  hits: number
  last_seen_at: string
}

export interface SearchCtrRow {
  query: string
  searches: number
  clicks: number
  ctr: number
}
