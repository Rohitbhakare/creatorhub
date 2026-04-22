// Admin-user management routes (E4.1, T6).
//
// All routes gated by `requireAdminRole(['super_admin'])`. No dual-auth
// secret bypass here — super_admin is a pure session role and should
// not be reachable via Retool (even during the T5 rollout window).

import { Hono } from 'hono'
import { requireAdminRole } from '../middleware/requireAdminRole.js'
import { validateBody } from '../middleware/validate.js'
import {
  createAdminSchema,
  updateAdminSchema,
} from '@creatorhub/shared'
import {
  handleCreateAdmin,
  handleListAdmins,
  handleUpdateAdmin,
  handleResetAdminPassword,
} from '../handlers/admins.js'

const adminsRoutes = new Hono()

const superAdminOnly = requireAdminRole(['super_admin'])

adminsRoutes.get('/', superAdminOnly, handleListAdmins)
adminsRoutes.post('/', superAdminOnly, validateBody(createAdminSchema), handleCreateAdmin)
adminsRoutes.patch('/:id', superAdminOnly, validateBody(updateAdminSchema), handleUpdateAdmin)
adminsRoutes.post('/:id/reset-password', superAdminOnly, handleResetAdminPassword)

export default adminsRoutes
