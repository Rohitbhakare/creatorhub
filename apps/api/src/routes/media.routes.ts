import { Hono } from 'hono'
import {
  handleSignedUrl,
  handleAddMedia,
  handleRemoveMedia,
  handleReorderMedia,
} from '../handlers/media.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { signedUrlSchema, addMediaSchema, reorderMediaSchema } from '@creatorhub/shared'

const mediaRoutes = new Hono()

// All media endpoints require auth
mediaRoutes.use('*', authenticate)

// POST /api/v1/media/signed-url
mediaRoutes.post('/signed-url', validateBody(signedUrlSchema), handleSignedUrl)

// POST /api/v1/media/content/:contentId
mediaRoutes.post('/content/:contentId', validateBody(addMediaSchema), handleAddMedia)

// DELETE /api/v1/media/:mediaId
mediaRoutes.delete('/:mediaId', handleRemoveMedia)

// PUT /api/v1/media/content/:contentId/reorder
mediaRoutes.put('/content/:contentId/reorder', validateBody(reorderMediaSchema), handleReorderMedia)

export default mediaRoutes
