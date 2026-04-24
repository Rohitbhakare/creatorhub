import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { createDraft } from './content.service.js'
import { publish } from './content-state.service.js'

// ─── Types ───────────────────────────────────────────────────────

type Row = Record<string, unknown>

export type MeetingPointData = {
  publicAreaName: string
  lat: number
  lng: number
  privateExactName?: string
  privateLat?: number
  privateLng?: number
  revealHoursBefore?: number
}

export type UpdateExperienceData = {
  title?: string
  description?: string
  pricePaisa?: number
  coverImageUrl?: string
  locationName?: string
  tags?: string[]
  subCategoryId?: string
  visibility?: string
  verticalData?: Record<string, unknown>
  facets?: Record<string, unknown>
}

type SpotSummary = {
  id: string
  name: string
  spot_order: number
  category: string | null
  creator_note: string | null
  duration_minutes: number | null
  stop_type: string | null
  lat: number | null
  lng: number | null
  thumbnail_url: string | null
}

type DaySummary = {
  id: string
  day_number: number
  title: string | null
  spots: SpotSummary[]
}

type ScheduledDateSummary = {
  id: string
  startDate: string
  endDate: string
  capacity: number
  spotsBooked: number
  spotsLeft: number
  isSoldOut: boolean
}

type MeetingPointResult = {
  publicAreaName: string
  lat: number
  lng: number
  privateExact?: { name: string; lat: number; lng: number } | null
} | null

export type ExperienceDetail = {
  id: string
  title: string | null
  description: string | null
  pricePaisa: number
  coverImageUrl: string | null
  locationName: string | null
  status: string
  vertical: string | null
  pricingModel: string | null
  creator: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    username: string | null
    followerCount: number
  }
  days: DaySummary[]
  scheduledDates: ScheduledDateSummary[]
  meetingPoint: MeetingPointResult
  likeCount: number
  commentCount: number
  saveCount: number
  isLiked?: boolean
  isSaved?: boolean
}

// ─── Ownership helper ─────────────────────────────────────────────

async function verifyExperienceOwnership(
  contentId: string,
  userId: string,
): Promise<Row> {
  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .eq('type', 'scheduled_experience')
    .is('deleted_at', null)
    .single()

  if (error || !content) {
    throw new AppError('not-found', 404, 'Experience not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this experience')
  }

  return content
}

// ─── createExperienceDraft ────────────────────────────────────────

export async function createExperienceDraft(
  userId: string,
  vertical: string,
): Promise<{ id: string }> {
  const content = await createDraft(userId, {
    type: 'scheduled_experience',
    vertical: vertical as 'travel' | 'stories' | 'food' | 'fitness' | 'education' | 'photography' | 'music' | 'wellness',
  })

  return { id: content.id as string }
}

// ─── getExperienceDetail ──────────────────────────────────────────

export async function getExperienceDetail(
  contentId: string,
  userId?: string | null,
): Promise<ExperienceDetail> {
  // Fetch content row
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .eq('type', 'scheduled_experience')
    .is('deleted_at', null)
    .single()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Experience not found')
  }

  // Visibility: non-owners only see published
  const isOwner = userId != null && content.user_id === userId
  if (!isOwner && content.status !== 'published') {
    throw new AppError('not-found', 404, 'Experience not found')
  }

  // Fetch days, scheduled_dates, creator, meeting_point, social in parallel
  const [
    { data: daysData },
    { data: datesData },
    { data: creator },
    { data: meetingPtData },
    likeResult,
    saveResult,
  ] = await Promise.all([
    supabase
      .from('itinerary_days')
      .select('id, day_number, title')
      .eq('content_id', contentId)
      .order('day_number', { ascending: true }),

    supabase
      .from('scheduled_dates')
      .select('id, start_date, end_date, capacity, spots_booked')
      .eq('content_id', contentId)
      .eq('is_active', true)
      .order('start_date', { ascending: true }),

    supabase
      .from('users')
      .select('id, display_name, username, avatar_url, follower_count')
      .eq('id', content.user_id as string)
      .single(),

    supabase
      .from('meeting_points')
      .select('*')
      .eq('content_id', contentId)
      .maybeSingle(),

    // like count (already denormalised on content row)
    Promise.resolve(null),
    // save count (already denormalised on content row)
    Promise.resolve(null),
  ])

  if (!creator) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  // Fetch spots for all days
  const allDays = daysData ?? []
  const dayIds = allDays.map((d) => d.id as string)

  let spotsData: Row[] = []
  if (dayIds.length > 0) {
    const { data: spots } = await supabase
      .from('itinerary_spots')
      .select('id, itinerary_day_id, name, spot_order, category, creator_note, duration_minutes, stop_type, thumbnail_url')
      .in('itinerary_day_id', dayIds)
      .order('spot_order', { ascending: true })

    spotsData = spots ?? []
  }

  // Group spots by day
  const spotsByDay = new Map<string, SpotSummary[]>()
  for (const spot of spotsData) {
    const dayId = spot.itinerary_day_id as string
    const existing = spotsByDay.get(dayId) ?? []
    existing.push({
      id: spot.id as string,
      name: spot.name as string,
      spot_order: spot.spot_order as number,
      category: (spot.category as string) || null,
      creator_note: (spot.creator_note as string) || null,
      duration_minutes: (spot.duration_minutes as number) || null,
      stop_type: (spot.stop_type as string) || null,
      lat: null,
      lng: null,
      thumbnail_url: (spot.thumbnail_url as string) || null,
    })
    spotsByDay.set(dayId, existing)
  }

  const days: DaySummary[] = allDays.map((day) => ({
    id: day.id as string,
    day_number: day.day_number as number,
    title: (day.title as string) || null,
    spots: spotsByDay.get(day.id as string) ?? [],
  }))

  // Build scheduled dates summary
  const scheduledDates: ScheduledDateSummary[] = (datesData ?? []).map((d) => {
    const capacity = d.capacity as number
    const spotsBooked = d.spots_booked as number
    const spotsLeft = Math.max(0, capacity - spotsBooked)
    return {
      id: d.id as string,
      startDate: d.start_date as string,
      endDate: d.end_date as string,
      capacity,
      spotsBooked,
      spotsLeft,
      isSoldOut: spotsLeft === 0,
    }
  })

  // Build meeting point — apply T-24h private reveal rule
  let meetingPoint: MeetingPointResult = null
  if (meetingPtData) {
    const mp = meetingPtData as Row
    const revealHours = (mp.reveal_hours_before as number) ?? 24

    // Determine if private exact location should be revealed:
    // Only if requester is owner OR start_date <= NOW + revealHours
    let privateExact: { name: string; lat: number; lng: number } | null = null

    if (isOwner) {
      // Owner always sees private details
      if (mp.private_exact_name && mp.private_lat != null && mp.private_lng != null) {
        privateExact = {
          name: mp.private_exact_name as string,
          lat: mp.private_lat as number,
          lng: mp.private_lng as number,
        }
      }
    } else if (scheduledDates.length > 0) {
      // For non-owners: check if earliest future date is within reveal window
      const revealCutoff = new Date(Date.now() + revealHours * 60 * 60 * 1000)
      const earliestDate = scheduledDates[0]
      if (earliestDate) {
        const startDate = new Date(earliestDate.startDate)
        if (startDate <= revealCutoff) {
          if (mp.private_exact_name && mp.private_lat != null && mp.private_lng != null) {
            privateExact = {
              name: mp.private_exact_name as string,
              lat: mp.private_lat as number,
              lng: mp.private_lng as number,
            }
          }
        }
      }
    }

    meetingPoint = {
      publicAreaName: mp.public_area_name as string,
      lat: mp.lat as number,
      lng: mp.lng as number,
      ...(privateExact != null ? { privateExact } : {}),
    }
  }

  // Fetch per-requester social signals if authenticated
  let isLiked: boolean | undefined
  let isSaved: boolean | undefined

  if (userId) {
    const [likeCheck, saveCheck] = await Promise.all([
      supabase
        .from('likes')
        .select('id')
        .eq('content_id', contentId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('saves')
        .select('id')
        .eq('content_id', contentId)
        .eq('user_id', userId)
        .maybeSingle(),
    ])
    isLiked = likeCheck.data != null
    isSaved = saveCheck.data != null
  }

  void likeResult
  void saveResult

  return {
    id: contentId,
    title: (content.title as string) || null,
    description: (content.description as string) || null,
    pricePaisa: (content.price_paisa as number) ?? 0,
    coverImageUrl: (content.cover_image_url as string) || null,
    locationName: (content.location_name as string) || null,
    status: content.status as string,
    vertical: (content.vertical as string) || null,
    pricingModel: (content.pricing_model as string) || null,
    creator: {
      id: creator.id as string,
      displayName: (creator.display_name as string) || null,
      avatarUrl: (creator.avatar_url as string) || null,
      username: (creator.username as string) || null,
      followerCount: (creator.follower_count as number) ?? 0,
    },
    days,
    scheduledDates,
    meetingPoint,
    likeCount: (content.like_count as number) ?? 0,
    commentCount: (content.comment_count as number) ?? 0,
    saveCount: (content.save_count as number) ?? 0,
    ...(isLiked !== undefined ? { isLiked } : {}),
    ...(isSaved !== undefined ? { isSaved } : {}),
  }
}

// ─── updateExperience ─────────────────────────────────────────────

export async function updateExperience(
  contentId: string,
  userId: string,
  data: UpdateExperienceData,
): Promise<void> {
  await verifyExperienceOwnership(contentId, userId)

  const updates: Record<string, unknown> = {}

  if (data.title !== undefined) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description
  if (data.pricePaisa !== undefined) {
    updates.price_paisa = data.pricePaisa
    updates.pricing_model = data.pricePaisa > 0 ? 'paid' : 'free'
  }
  if (data.coverImageUrl !== undefined) updates.cover_image_url = data.coverImageUrl
  if (data.locationName !== undefined) updates.location_name = data.locationName
  if (data.tags !== undefined) updates.tags = data.tags
  if (data.subCategoryId !== undefined) updates.sub_category_id = data.subCategoryId
  if (data.visibility !== undefined) updates.visibility = data.visibility
  if (data.verticalData !== undefined) updates.vertical_data = data.verticalData
  if (data.facets !== undefined) updates.facets = data.facets

  if (Object.keys(updates).length === 0) {
    return
  }

  const { error } = await supabase
    .from('content')
    .update(updates)
    .eq('id', contentId)
    .eq('user_id', userId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to update experience')
  }
}

// ─── setMeetingPoint ──────────────────────────────────────────────

export async function setMeetingPoint(
  contentId: string,
  userId: string,
  data: MeetingPointData,
): Promise<void> {
  await verifyExperienceOwnership(contentId, userId)

  const row: Record<string, unknown> = {
    content_id: contentId,
    public_area_name: data.publicAreaName,
    lat: data.lat,
    lng: data.lng,
    reveal_hours_before: data.revealHoursBefore ?? 24,
  }

  if (data.privateExactName !== undefined) row.private_exact_name = data.privateExactName
  if (data.privateLat !== undefined) row.private_lat = data.privateLat
  if (data.privateLng !== undefined) row.private_lng = data.privateLng

  const { error } = await supabase
    .from('meeting_points')
    .upsert(row, { onConflict: 'content_id' })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to set meeting point')
  }
}

// ─── publishExperience ────────────────────────────────────────────

export async function publishExperience(
  contentId: string,
  userId: string,
  tncAccepted: boolean,
): Promise<void> {
  const content = await verifyExperienceOwnership(contentId, userId)

  if (content.status !== 'draft') {
    throw new AppError('unprocessable', 422, 'Only draft experiences can be published')
  }

  const pricePaisa = (content.price_paisa as number) ?? 0
  const isPaid = pricePaisa > 0

  // KYC check for paid experiences
  if (isPaid) {
    const { data: user } = await supabase
      .from('users')
      .select('kyc_status')
      .eq('id', userId)
      .single()

    if (user?.kyc_status !== 'verified') {
      throw new AppError('forbidden', 403, 'KYC verification required to publish paid experiences')
    }
  }

  // Must have cover image
  if (!content.cover_image_url) {
    throw new AppError('validation-failed', 400, 'A cover image is required to publish', [
      { field: 'cover_image_url', message: 'Cover image is required', code: 'required' },
    ])
  }

  // Must have at least 1 active future scheduled date
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const { data: futureDates, error: datesError } = await supabase
    .from('scheduled_dates')
    .select('id')
    .eq('content_id', contentId)
    .eq('is_active', true)
    .gte('start_date', today)
    .limit(1)

  if (datesError) {
    throw new AppError('db-error', 500, 'Failed to validate scheduled dates')
  }

  if (!futureDates || futureDates.length === 0) {
    throw new AppError('validation-failed', 400, 'At least one future scheduled date is required', [
      { field: 'scheduled_dates', message: 'Add at least one future scheduled date before publishing', code: 'required' },
    ])
  }

  // Delegate to state machine
  await publish(contentId, userId, tncAccepted)
}
