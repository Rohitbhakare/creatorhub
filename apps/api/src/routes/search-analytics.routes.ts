// Search analytics routes (E4.1, T10 · ADM-FR-010).
//
// Mounted at `/api/v1/admin/analytics/search`. Read access for all
// five admin roles — analytics is informational. No mutations live
// here yet; any future write path (e.g. editing suggested queries)
// should be role-scoped separately.

import { Hono } from 'hono'
import { requireAdminRole } from '../middleware/requireAdminRole.js'
import { validateQuery } from '../middleware/validate.js'
import { analyticsWindowSchema } from '@creatorhub/shared'
import {
  handleTopQueries,
  handleZeroResultQueries,
  handleClickThroughRate,
} from '../handlers/search-analytics.js'

const searchAnalyticsRoutes = new Hono()

const anyAdmin = requireAdminRole([
  'super_admin',
  'content_moderator',
  'support',
  'finance',
  'operations',
])

searchAnalyticsRoutes.get(
  '/top',
  anyAdmin,
  validateQuery(analyticsWindowSchema),
  handleTopQueries,
)
searchAnalyticsRoutes.get(
  '/zero-results',
  anyAdmin,
  validateQuery(analyticsWindowSchema),
  handleZeroResultQueries,
)
searchAnalyticsRoutes.get(
  '/ctr',
  anyAdmin,
  validateQuery(analyticsWindowSchema),
  handleClickThroughRate,
)

export default searchAnalyticsRoutes
