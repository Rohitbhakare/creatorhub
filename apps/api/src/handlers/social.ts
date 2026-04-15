import type { Context } from 'hono'
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  likeContent,
  unlikeContent,
  recordShare,
} from '../services/social.service.js'
import {
  addComment,
  editComment,
  deleteComment,
  listComments,
} from '../services/comment.service.js'
import {
  getUserLists,
  createList,
  renameList,
  deleteList,
  getListItems,
  saveToLists,
  removeFromLists,
  getSaveStatus,
} from '../services/saved.service.js'
import { AppError } from '../errors/AppError.js'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateUUID(id: string, label: string) {
  if (!UUID_REGEX.test(id)) {
    throw new AppError('validation-failed', 400, `Invalid ${label} format`)
  }
}

// ─── Follow / Unfollow ────────────────────────────────────────

export async function handleFollow(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const targetId = c.req.param('userId')!
  validateUUID(targetId, 'user ID')

  const result = await followUser(userId, targetId)
  return c.json({ success: true, data: result })
}

export async function handleUnfollow(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const targetId = c.req.param('userId')!
  validateUUID(targetId, 'user ID')

  await unfollowUser(userId, targetId)
  return c.body(null, 204)
}

export async function handleGetFollowers(c: Context): Promise<Response> {
  const targetId = c.req.param('userId')!
  validateUUID(targetId, 'user ID')

  const cursor = c.req.query('cursor') ?? null
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)

  const result = await getFollowers(targetId, cursor, limit)
  return c.json({ success: true, data: result })
}

export async function handleGetFollowing(c: Context): Promise<Response> {
  const targetId = c.req.param('userId')!
  validateUUID(targetId, 'user ID')

  const cursor = c.req.query('cursor') ?? null
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)

  const result = await getFollowing(targetId, cursor, limit)
  return c.json({ success: true, data: result })
}

// ─── Like / Unlike ───────────────────────────────────────────

export async function handleLike(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  const result = await likeContent(userId, contentId)
  return c.json({ success: true, data: result })
}

export async function handleUnlike(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  await unlikeContent(userId, contentId)
  return c.body(null, 204)
}

// ─── Comments ────────────────────────────────────────────────

export async function handleAddComment(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  const body = c.get('validatedBody')
  const comment = await addComment(userId, contentId, body.body, body.parent_id)
  return c.json({ success: true, data: comment }, 201)
}

export async function handleEditComment(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const commentId = c.req.param('commentId')!
  validateUUID(commentId, 'comment ID')

  const body = c.get('validatedBody')
  const updated = await editComment(userId, commentId, body.body)
  return c.json({ success: true, data: updated })
}

export async function handleDeleteComment(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const commentId = c.req.param('commentId')!
  validateUUID(commentId, 'comment ID')

  await deleteComment(userId, commentId)
  return c.body(null, 204)
}

export async function handleListComments(c: Context): Promise<Response> {
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  const cursor = c.req.query('cursor') ?? null
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)

  const result = await listComments(contentId, cursor, limit)
  return c.json({ success: true, data: result })
}

// ─── Saved Lists ─────────────────────────────────────────────

export async function handleGetLists(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const lists = await getUserLists(userId)
  return c.json({ success: true, data: lists })
}

export async function handleCreateList(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody')
  const list = await createList(userId, body.name)
  return c.json({ success: true, data: list }, 201)
}

export async function handleRenameList(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const listId = c.req.param('listId')!
  validateUUID(listId, 'list ID')

  const body = c.get('validatedBody')
  const updated = await renameList(userId, listId, body.name)
  return c.json({ success: true, data: updated })
}

export async function handleDeleteList(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const listId = c.req.param('listId')!
  validateUUID(listId, 'list ID')

  await deleteList(userId, listId)
  return c.body(null, 204)
}

export async function handleGetListItems(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const listId = c.req.param('listId')!
  validateUUID(listId, 'list ID')

  const query = c.get('validatedQuery')
  const result = await getListItems(userId, listId, query.sort, query.type ?? null, query.cursor ?? null, query.limit)
  return c.json({ success: true, data: result })
}

// ─── Save / Unsave Content ──────────────────────────────────

export async function handleSaveContent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  const body = c.get('validatedBody')
  const result = await saveToLists(userId, contentId, body.list_ids)
  return c.json({ success: true, data: result })
}

export async function handleUnsaveContent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  const body = c.get('validatedBody')
  await removeFromLists(userId, contentId, body.list_ids)
  return c.body(null, 204)
}

export async function handleGetSaveStatus(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  const status = await getSaveStatus(userId, contentId)
  return c.json({ success: true, data: status })
}

// ─── Share ───────────────────────────────────────────────────

export async function handleRecordShare(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const contentId = c.req.param('contentId')!
  validateUUID(contentId, 'content ID')

  const body = c.get('validatedBody')
  await recordShare(userId, contentId, body.platform)
  return c.json({ success: true })
}
