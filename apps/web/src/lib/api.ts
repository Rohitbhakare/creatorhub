const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001'

export interface CreatorProfile {
  id: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  coverUrl: string | null
  vertical: string
  followerCount: number
  contentCount: number
  averageRating: number | null
  isCreator: boolean
  content?: ContentCard[]
}

export interface ContentCard {
  id: string
  type: 'post' | 'itinerary' | 'experience' | 'event'
  title: string
  coverImageUrl: string | null
  priceInPaisa: number
  isFree: boolean
  status: string
}

export interface ContentDetail {
  id: string
  type: 'post' | 'itinerary' | 'experience' | 'event'
  title: string
  description: string | null
  body: string | null
  coverImageUrl: string | null
  priceInPaisa: number
  isFree: boolean
  startsAt: string | null
  endsAt: string | null
  creator: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    vertical: string
  }
}

interface ApiResponse<T> {
  success: boolean
  data: T | null
}

export async function fetchCreatorProfile(username: string): Promise<CreatorProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/by-username/${username}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as ApiResponse<CreatorProfile>
    return data.data ?? null
  } catch {
    return null
  }
}

export async function fetchContentDetail(contentId: string): Promise<ContentDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/${contentId}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as ApiResponse<ContentDetail>
    return data.data ?? null
  } catch {
    return null
  }
}

export function formatPrice(priceInPaisa: number, isFree: boolean): string {
  if (isFree || priceInPaisa === 0) return 'FREE'
  const rupees = priceInPaisa / 100
  return `₹${rupees.toLocaleString('en-IN')}`
}
