import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { optionalAuthenticate, authenticate } from '../middleware/authenticate.js'
import { validateQuery, validateBody } from '../middleware/validate.js'
import {
  getDiscoverThemes,
  getDiscoverCreators,
  getDiscoverExperiences,
  getSearchSuggestions,
  logSearchQuery,
  getSubCategories,
  searchDiscover,
  resolveDestination,
  getPopularSearches,
  getHandpickedCollections,
  getActiveCities,
} from '../services/discover.service.js'
import { getCategoryBrowse } from '../services/feed.service.js'
import { supabase } from '../lib/supabase.js'
import {
  discoverFiltersQuerySchema,
  resolveDestinationSchema,
  popularSearchesQuerySchema,
  handpickedCollectionsQuerySchema,
  discoverCitiesQuerySchema,
} from '@creatorhub/shared'

const discoverRoutes = new Hono()

// ── Schemas ───────────────────────────────────────────────────────────────────

const categoryQuerySchema = z.object({
  vertical: z.enum(['travel', 'stories']),
  sub_category_id: z.string().min(1).optional(),
  leaf_type: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
  cursor: z.string().optional(),
})

const creatorsQuerySchema = z.object({
  city_id: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(8),
})

const experiencesQuerySchema = z.object({
  city_id: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
})

const searchQuerySchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5),
})

const searchLogSchema = z.object({
  query: z.string().min(2).max(100),
  result_count: z.number().int().min(0),
})

const subCategoriesQuerySchema = z.object({
  vertical: z.enum(['travel', 'stories']),
})

// ── Handlers ──────────────────────────────────────────────────────────────────

// DISC-FR-003: Category browse — vertical → sub-category → leaf type.
async function handleGetCategoryBrowse(c: Context): Promise<Response> {
  const { vertical, sub_category_id, leaf_type, limit, cursor } =
    c.get('validatedQuery') as z.infer<typeof categoryQuerySchema>
  const result = await getCategoryBrowse({
    vertical,
    ...(sub_category_id !== undefined && { sub_category_id }),
    ...(leaf_type !== undefined && { leaf_type }),
    limit,
    ...(cursor !== undefined && { cursor }),
  })
  return c.json({ success: true, data: result })
}

async function handleGetThemes(c: Context): Promise<Response> {
  const result = await getDiscoverThemes()
  return c.json({ success: true, data: result })
}

async function handleGetCreators(c: Context): Promise<Response> {
  const { city_id, limit } = c.get('validatedQuery') as z.infer<typeof creatorsQuerySchema>
  const result = await getDiscoverCreators(city_id ?? null, limit)
  return c.json({ success: true, data: result })
}

async function handleGetExperiences(c: Context): Promise<Response> {
  const { city_id, limit } = c.get('validatedQuery') as z.infer<typeof experiencesQuerySchema>
  const result = await getDiscoverExperiences(city_id ?? null, limit)
  return c.json({ success: true, data: result })
}

async function handleSearch(c: Context): Promise<Response> {
  const { q, limit } = c.get('validatedQuery') as z.infer<typeof searchQuerySchema>
  const result = await getSearchSuggestions(q, limit)
  return c.json({ success: true, data: result })
}

// DISC-FR-003: Sub-category list for a vertical — powers taxonomy navigation.
async function handleGetSubCategories(c: Context): Promise<Response> {
  const { vertical } = c.get('validatedQuery') as z.infer<typeof subCategoriesQuerySchema>
  const result = await getSubCategories(vertical)
  return c.json({ success: true, data: result })
}

async function handleLogSearch(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const { query, result_count } = c.get('validatedBody') as z.infer<typeof searchLogSchema>
  await logSearchQuery(userId, query, result_count)
  return c.json({ success: true })
}

// ── Routes ────────────────────────────────────────────────────────────────────

discoverRoutes.get(
  '/category',
  optionalAuthenticate,
  validateQuery(categoryQuerySchema),
  handleGetCategoryBrowse,
)

discoverRoutes.get('/themes', optionalAuthenticate, handleGetThemes)

discoverRoutes.get(
  '/sub-categories',
  optionalAuthenticate,
  validateQuery(subCategoriesQuerySchema),
  handleGetSubCategories,
)

discoverRoutes.get(
  '/creators',
  optionalAuthenticate,
  validateQuery(creatorsQuerySchema),
  handleGetCreators,
)

discoverRoutes.get(
  '/experiences',
  optionalAuthenticate,
  validateQuery(experiencesQuerySchema),
  handleGetExperiences,
)

discoverRoutes.get(
  '/search',
  optionalAuthenticate,
  validateQuery(searchQuerySchema),
  handleSearch,
)

// POST /api/v1/discover/search/log — authenticated only (DISC-FR-036, DD-015)
discoverRoutes.post(
  '/search/log',
  authenticate,
  validateBody(searchLogSchema),
  handleLogSearch,
)

// ── Travel-redesign: 13-filter results + Places destination resolve ──

async function handleDiscoverResults(c: Context): Promise<Response> {
  const filters = c.get('validatedQuery') as z.infer<typeof discoverFiltersQuerySchema>

  // Distance filter resolves an anchor in this priority: user_lat/lng →
  // starting_city_id → viewer's home city. Only fetch the third tier when
  // we'll actually need it — keeps non-distance queries free of the lookup.
  let viewerCityId: string | null = null
  const userId = c.get('userId') as string | undefined
  if (userId && filters.distance_km && !filters.starting_city_id && filters.user_lat === undefined) {
    const { data } = await supabase
      .from('users')
      .select('current_city_id')
      .eq('id', userId)
      .maybeSingle()
    viewerCityId = (data?.current_city_id as string | null) ?? null
  }

  const result = await searchDiscover(filters, { viewerCityId })
  return c.json({ success: true, data: result })
}

async function handleResolveDestination(c: Context): Promise<Response> {
  const { place_id } = c.get('validatedBody') as z.infer<typeof resolveDestinationSchema>
  const result = await resolveDestination(place_id)
  return c.json({ success: true, data: result })
}

discoverRoutes.get(
  '/results',
  optionalAuthenticate,
  validateQuery(discoverFiltersQuerySchema),
  handleDiscoverResults,
)

discoverRoutes.post(
  '/destinations/resolve',
  optionalAuthenticate,
  validateBody(resolveDestinationSchema),
  handleResolveDestination,
)

// ── Discover home surface (DD-014, DD-015) ───────────────────────────

async function handlePopularSearches(c: Context): Promise<Response> {
  const { limit } = c.get('validatedQuery') as z.infer<typeof popularSearchesQuerySchema>
  const result = await getPopularSearches(limit)
  return c.json({ success: true, data: { queries: result } })
}

async function handleHandpickedCollections(c: Context): Promise<Response> {
  const { city_id, limit } = c.get('validatedQuery') as z.infer<
    typeof handpickedCollectionsQuerySchema
  >
  const result = await getHandpickedCollections(city_id ?? null, limit)
  return c.json({ success: true, data: { collections: result } })
}

async function handleActiveCities(c: Context): Promise<Response> {
  const { limit } = c.get('validatedQuery') as z.infer<typeof discoverCitiesQuerySchema>
  const result = await getActiveCities(limit)
  return c.json({ success: true, data: { cities: result } })
}

discoverRoutes.get(
  '/search/popular',
  optionalAuthenticate,
  validateQuery(popularSearchesQuerySchema),
  handlePopularSearches,
)

discoverRoutes.get(
  '/collections',
  optionalAuthenticate,
  validateQuery(handpickedCollectionsQuerySchema),
  handleHandpickedCollections,
)

discoverRoutes.get(
  '/cities',
  optionalAuthenticate,
  validateQuery(discoverCitiesQuerySchema),
  handleActiveCities,
)

export default discoverRoutes
