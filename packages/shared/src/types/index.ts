import type { Vertical, ContentType, ContentStatus } from '../constants/index.js'

// ─── City ────────────────────────────────────────────────────
export type City = {
  id: string          // stable slug: 'in.mh.pune'
  name: string
  state: string
  country: string
  lat?: number
  lng?: number
}

// ─── User ────────────────────────────────────────────────────
export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired'

export type UserProfile = {
  id: string
  phone: string
  display_name: string | null
  username: string | null
  bio: string | null
  email: string | null
  avatar_url: string | null
  is_creator: boolean
  kyc_status: KycStatus
  current_city: City | null
  active_verticals: Vertical[]
  onboarding_completed_at: string | null
  username_changed_at: string | null
  follower_count: number
  following_count: number
  content_count: number
  created_at: string
}

export type PublicProfile = {
  id: string
  display_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  is_creator: boolean
  current_city: City | null
  active_verticals: Vertical[]
  featured: boolean
  follower_count: number
  following_count: number
  content_count: number
  is_following: boolean | null    // null for guests
  created_at: string
}

// ─── Content ─────────────────────────────────────────────────
export type PricingModel = 'free' | 'paid'
export type Visibility = 'public' | 'unlisted' | 'private'

export type ContentBase = {
  id: string
  user_id: string
  type: ContentType
  vertical: Vertical
  status: ContentStatus
  visibility: Visibility
  pricing_model: PricingModel
  title: string
  description: string | null
  cover_image_url: string | null
  starting_city: City | null
  tags: string[]
  like_count: number
  comment_count: number
  save_count: number
  view_count: number
  created_at: string
  published_at: string | null
}

// ─── API Responses ───────────────────────────────────────────
export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiSuccessWithMeta<T> = {
  success: true
  data: T
  meta: {
    next_cursor: string | null
    has_more: boolean
    per_page: number
  }
}

export type ApiError = {
  success: false
  error: {
    type: string
    title: string
    status: number
    detail: string
    instance: string
    errors?: Array<{ field: string; message: string; code: string }>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Auth ────────────────────────────────────────────────────
export type TokenPair = {
  access_token: string
  refresh_token: string
  expires_in: number
}

export type AuthResult = {
  user: UserProfile
  tokens: TokenPair
  is_new_user: boolean
}
