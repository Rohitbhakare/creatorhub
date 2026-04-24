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
} from '../services/discover.service.js'
import { getCategoryBrowse } from '../services/feed.service.js'

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

export default discoverRoutes
