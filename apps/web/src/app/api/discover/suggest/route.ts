import { type NextRequest, NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

interface SuggestionResponse {
  contents: { id: string; title: string; type: string; creatorName: string | null }[]
  creators: { id: string; username: string; displayName: string; vertical: string }[]
  cities: { name: string; count: number }[]
}

export async function GET(req: NextRequest) {
  const log = logger.child({ route: 'api/discover/suggest' })
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    return NextResponse.json({ contents: [], creators: [], cities: [] })
  }
  try {
    const data = await apiFetch<SuggestionResponse>(
      `/api/v1/discover/suggest?q=${encodeURIComponent(q)}`,
      { skipAuth: true, retries: 0, timeoutMs: 2_500 },
    )
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AppError && err.status === 404) {
      return NextResponse.json({ contents: [], creators: [], cities: [] })
    }
    log.warn({ err: err instanceof AppError ? err.toJSON() : String(err) }, 'suggest:failed')
    return NextResponse.json({ contents: [], creators: [], cities: [] })
  }
}
