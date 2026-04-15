import { Hono } from 'hono'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import {
  addCommentSchema,
  editCommentSchema,
  createListSchema,
  renameListSchema,
  saveContentSchema,
  unsaveContentSchema,
  recordShareSchema,
  listItemsQuerySchema,
} from '@creatorhub/shared'
import {
  handleFollow,
  handleUnfollow,
  handleGetFollowers,
  handleGetFollowing,
  handleLike,
  handleUnlike,
  handleAddComment,
  handleEditComment,
  handleDeleteComment,
  handleListComments,
  handleGetLists,
  handleCreateList,
  handleRenameList,
  handleDeleteList,
  handleGetListItems,
  handleSaveContent,
  handleUnsaveContent,
  handleGetSaveStatus,
  handleRecordShare,
} from '../handlers/social.js'

const socialRoutes = new Hono()

// ─── Follow / Unfollow ──────────────────────────────────────
socialRoutes.post('/users/:userId/follow', authenticate, handleFollow)
socialRoutes.delete('/users/:userId/follow', authenticate, handleUnfollow)
socialRoutes.get('/users/:userId/followers', optionalAuthenticate, handleGetFollowers)
socialRoutes.get('/users/:userId/following', optionalAuthenticate, handleGetFollowing)

// ─── Like / Unlike ──────────────────────────────────────────
socialRoutes.post('/content/:contentId/like', authenticate, handleLike)
socialRoutes.delete('/content/:contentId/like', authenticate, handleUnlike)

// ─── Comments ───────────────────────────────────────────────
socialRoutes.get('/content/:contentId/comments', optionalAuthenticate, handleListComments)
socialRoutes.post('/content/:contentId/comments', authenticate, validateBody(addCommentSchema), handleAddComment)
socialRoutes.put('/comments/:commentId', authenticate, validateBody(editCommentSchema), handleEditComment)
socialRoutes.delete('/comments/:commentId', authenticate, handleDeleteComment)

// ─── Saved Lists ────────────────────────────────────────────
socialRoutes.get('/saved-lists', authenticate, handleGetLists)
socialRoutes.post('/saved-lists', authenticate, validateBody(createListSchema), handleCreateList)
socialRoutes.put('/saved-lists/:listId', authenticate, validateBody(renameListSchema), handleRenameList)
socialRoutes.delete('/saved-lists/:listId', authenticate, handleDeleteList)
socialRoutes.get('/saved-lists/:listId/items', authenticate, validateQuery(listItemsQuerySchema), handleGetListItems)

// ─── Save / Unsave Content ─────────────────────────────────
socialRoutes.post('/content/:contentId/save', authenticate, validateBody(saveContentSchema), handleSaveContent)
socialRoutes.delete('/content/:contentId/save', authenticate, validateBody(unsaveContentSchema), handleUnsaveContent)
socialRoutes.get('/content/:contentId/save-status', authenticate, handleGetSaveStatus)

// ─── Share ──────────────────────────────────────────────────
socialRoutes.post('/content/:contentId/share', optionalAuthenticate, validateBody(recordShareSchema), handleRecordShare)

export default socialRoutes
