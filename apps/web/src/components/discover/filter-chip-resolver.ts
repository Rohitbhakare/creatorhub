/**
 * Resolves URL params into the chip list shown above the grid (E5.2 T6).
 *
 * Pure / testable — the page passes its searchParams in and mounts
 * `<FilterChipBar>` with the returned list. Decoupled from React so
 * the chip set can be shared between `/discover` and `/discover/results`.
 *
 * The vibe `tag` is a free-text label so we can't validate it; we just
 * trust the sidebar wrote it and quote it back.
 */
export interface ChipDef {
  key: string
  label: string
  /** For multi-select CSV fields, the specific value to peel out. */
  value?: string
}

const TYPE_LABELS: Record<string, string> = {
  post: 'Stories',
  self_paced_itinerary: 'Itineraries',
  scheduled_experience: 'Experiences',
  event: 'Events',
}

const SORT_LABELS: Record<string, string> = {
  trending: 'Trending',
  recent: 'Recent',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
}

export function resolveFilterChips(params: Record<string, string>): ChipDef[] {
  const chips: ChipDef[] = []

  if (params.type) {
    const label = TYPE_LABELS[params.type]
    if (label) chips.push({ key: 'type', label })
  }

  if (params.vibe) {
    chips.push({ key: 'vibe', label: params.vibe })
  }

  if (params.distance_km) {
    const km = parseInt(params.distance_km, 10)
    if ([25, 50, 100, 250].includes(km)) {
      chips.push({ key: 'distance_km', label: `Within ${String(km)} km` })
    }
  }

  if (params.starting_city_id) {
    // Display the city_id as-is for now; the page can pass a resolved name
    // by overriding the chip after this resolver runs.
    chips.push({ key: 'starting_city_id', label: prettyCity(params.starting_city_id) })
  }

  if (params.q) {
    chips.push({ key: 'q', label: `"${params.q}"` })
  }

  if (params.sort && params.sort !== 'trending') {
    const label = SORT_LABELS[params.sort]
    if (label) chips.push({ key: 'sort', label })
  }

  // CSV-multi: duration_buckets, budget_buckets, seasons, difficulties, group_sizes
  pushCsv(chips, params, 'duration_buckets', 'Duration')
  pushCsv(chips, params, 'budget_buckets', 'Budget')
  pushCsv(chips, params, 'seasons', 'Season')
  pushCsv(chips, params, 'difficulties', 'Difficulty')
  pushCsv(chips, params, 'group_sizes', 'Group')

  return chips
}

function pushCsv(
  chips: ChipDef[],
  params: Record<string, string>,
  key: string,
  prefix: string,
): void {
  const raw = params[key]
  if (!raw) return
  const values = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const value of values) {
    chips.push({ key, label: `${prefix}: ${prettyEnum(value)}`, value })
  }
}

function prettyEnum(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function prettyCity(id: string): string {
  // "in.mh.mumbai" → "Mumbai"
  const parts = id.split('.')
  const slug = parts[parts.length - 1] ?? id
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
