import type {
  BudgetBucket,
  DiscoverResultsFilters,
  DiscoverSort,
  DurationBucket,
  TimeWindow,
} from '@/lib/api/discover'

const DURATIONS: readonly DurationBucket[] = ['day_trip', 'weekend', 'short', 'long']
const BUDGETS: readonly BudgetBucket[] = ['free', 'lt2k', '2to5k', '5to15k', 'gt15k']
const TIME_WINDOWS: readonly TimeWindow[] = [
  'today',
  'this_weekend',
  'next_7d',
  'this_month',
  'custom',
]
const SORTS: readonly DiscoverSort[] = ['recent', 'trending', 'price_asc', 'price_desc']
const TYPES = ['post', 'self_paced_itinerary', 'scheduled_experience', 'event'] as const
const VERTICALS = ['travel', 'stories'] as const
const DISTANCES = [25, 50, 100, 250] as const

function csv<T extends string>(value: string | undefined, allowed: readonly T[]): T[] | undefined {
  if (!value) return undefined
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s): s is T => (allowed as readonly string[]).includes(s))
  return parts.length > 0 ? parts : undefined
}

function pickEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

/**
 * Read URL search params into a DiscoverResultsFilters object. Drops any
 * value that doesn't match the schema so a stray `?type=garbage` URL fails
 * shut (no filter applied) rather than 500-ing the API.
 */
export function paramsToFilters(sp: Record<string, string | undefined>): DiscoverResultsFilters {
  const filters: DiscoverResultsFilters = {}
  const vertical = pickEnum(sp.vertical, VERTICALS)
  if (vertical) filters.vertical = vertical
  if (sp.sub_category_id) filters.subCategoryId = sp.sub_category_id
  if (sp.leaf_type) filters.leafType = sp.leaf_type
  const type = pickEnum(sp.type, TYPES)
  if (type) filters.type = type
  const tw = pickEnum(sp.time_window, TIME_WINDOWS)
  if (tw) filters.timeWindow = tw
  const durations = csv<DurationBucket>(sp.duration_buckets, DURATIONS)
  if (durations) filters.durationBuckets = durations
  const budgets = csv<BudgetBucket>(sp.budget_buckets, BUDGETS)
  if (budgets) filters.budgetBuckets = budgets
  const seasons = csv(sp.seasons, [
    'spring',
    'summer',
    'monsoon',
    'autumn',
    'winter',
  ] as const)
  if (seasons) filters.seasons = [...seasons]
  const difficulties = csv(sp.difficulties, [
    'easy',
    'moderate',
    'challenging',
    'expert',
  ] as const)
  if (difficulties) filters.difficulties = [...difficulties]
  const groups = csv(sp.group_sizes, ['solo', 'couple', 'small', 'large'] as const)
  if (groups) filters.groupSizes = [...groups]
  if (sp.destination_city_id) filters.destinationCityId = sp.destination_city_id
  if (sp.starting_city_id) filters.startingCityId = sp.starting_city_id
  const dist = sp.distance_km ? parseInt(sp.distance_km, 10) : NaN
  if ((DISTANCES as readonly number[]).includes(dist)) {
    filters.distanceKm = dist as 25 | 50 | 100 | 250
  }
  if (sp.user_lat) {
    const n = parseFloat(sp.user_lat)
    if (!Number.isNaN(n)) filters.userLat = n
  }
  if (sp.user_lng) {
    const n = parseFloat(sp.user_lng)
    if (!Number.isNaN(n)) filters.userLng = n
  }
  if (sp.q) filters.q = sp.q
  const sort = pickEnum(sp.sort, SORTS)
  if (sort) filters.sort = sort
  if (sp.cursor) filters.cursor = sp.cursor
  if (sp.limit) {
    const n = parseInt(sp.limit, 10)
    if (!Number.isNaN(n) && n > 0 && n <= 60) filters.limit = n
  }
  return filters
}

/**
 * Serialise a filter object back to a query-string. The reverse of
 * `paramsToFilters` — used when toggling filters from the client so the URL
 * is the single source of truth and back/forward navigation works.
 */
export function filtersToParams(filters: DiscoverResultsFilters): URLSearchParams {
  const search = new URLSearchParams()
  const set = (key: string, value: string | number | undefined): void => {
    if (value === undefined || value === '') return
    search.set(key, String(value))
  }
  set('vertical', filters.vertical)
  set('sub_category_id', filters.subCategoryId)
  set('leaf_type', filters.leafType)
  set('type', filters.type)
  set('time_window', filters.timeWindow)
  if (filters.durationBuckets?.length)
    search.set('duration_buckets', filters.durationBuckets.join(','))
  if (filters.budgetBuckets?.length) search.set('budget_buckets', filters.budgetBuckets.join(','))
  if (filters.seasons?.length) search.set('seasons', filters.seasons.join(','))
  if (filters.difficulties?.length) search.set('difficulties', filters.difficulties.join(','))
  if (filters.groupSizes?.length) search.set('group_sizes', filters.groupSizes.join(','))
  set('destination_city_id', filters.destinationCityId)
  set('starting_city_id', filters.startingCityId)
  set('distance_km', filters.distanceKm)
  set('user_lat', filters.userLat)
  set('user_lng', filters.userLng)
  set('q', filters.q)
  set('sort', filters.sort)
  return search
}

/** Number of distinct filter axes the user has set. */
export function activeFilterCount(filters: DiscoverResultsFilters): number {
  let n = 0
  if (filters.subCategoryId) n++
  if (filters.type) n++
  if (filters.timeWindow) n++
  if (filters.durationBuckets?.length) n++
  if (filters.budgetBuckets?.length) n++
  if (filters.seasons?.length) n++
  if (filters.difficulties?.length) n++
  if (filters.groupSizes?.length) n++
  if (filters.distanceKm) n++
  if (filters.startingCityId) n++
  if (filters.destinationCityId) n++
  return n
}
