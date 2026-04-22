// Editorial collections routes (E4.1, T9 · ADM-FR-009).
//
// Mounted at `/api/v1/admin/collections`. All endpoints require a
// content_moderator or super_admin session — editorial curation is a
// pure session flow (no legacy secret bypass).

import { Hono } from 'hono'
import { requireAdminRole } from '../middleware/requireAdminRole.js'
import { validateBody } from '../middleware/validate.js'
import {
  createCollectionSchema,
  updateCollectionSchema,
  appendCollectionItemSchema,
} from '@creatorhub/shared'
import {
  handleListCollections,
  handleCreateCollection,
  handleGetCollection,
  handleUpdateCollection,
  handleDeleteCollection,
  handleAppendCollectionItem,
  handleRemoveCollectionItem,
} from '../handlers/editorial.js'

const editorialRoutes = new Hono()

const editorialRoles = requireAdminRole(['content_moderator', 'super_admin'])

editorialRoutes.get('/', editorialRoles, handleListCollections)
editorialRoutes.post(
  '/',
  editorialRoles,
  validateBody(createCollectionSchema),
  handleCreateCollection,
)
editorialRoutes.get('/:id', editorialRoles, handleGetCollection)
editorialRoutes.patch(
  '/:id',
  editorialRoles,
  validateBody(updateCollectionSchema),
  handleUpdateCollection,
)
editorialRoutes.delete('/:id', editorialRoles, handleDeleteCollection)
editorialRoutes.post(
  '/:id/items',
  editorialRoles,
  validateBody(appendCollectionItemSchema),
  handleAppendCollectionItem,
)
editorialRoutes.delete(
  '/:id/items/:contentId',
  editorialRoles,
  handleRemoveCollectionItem,
)

export default editorialRoutes
