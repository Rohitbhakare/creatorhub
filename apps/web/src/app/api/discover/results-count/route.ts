import { NextResponse } from 'next/server'
import { fetchDiscoverResultsCount } from '@/lib/api/discover'
import { paramsToFilters } from '@/lib/discover-filters-url'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cheap count-only proxy used by the filter sheet's footer counter. Reads
 * the same query-string the page would render, calls the backend with
 * count_only=1, and returns `{ count }`. Failures degrade to `{ count: null }`
 * so the footer falls back to "Show results".
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const sp: Record<string, string> = {}
  for (const [k, v] of url.searchParams.entries()) {
    sp[k] = v
  }
  const filters = paramsToFilters(sp)
  const count = await fetchDiscoverResultsCount(filters)
  return NextResponse.json({ count })
}
