// Editorial collections handlers (E4.1, T9 · ADM-FR-009).
//
// Routes mounted under `/api/v1/admin/collections`. All endpoints are
// gated at the route layer by `requireAdminRole([content_moderator,
// super_admin])` — editorial curation is moderator territory.
//
// Audit actions:
//   - create_collection / update_collection / delete_collection
//   - append_collection_item / remove_collection_item

import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  listCollections,
  createCollection,
  getCollectionDetail,
  updateCollection,
  deleteCollection,
  appendCollectionItem,
  removeCollectionItem,
} from '../services/editorial.service.js'
import {
  recordAdminAudit,
  extractRequestMeta,
} from '../services/admin-audit.service.js'
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  AppendCollectionItemInput,
} from '@creatorhub/shared'

function actingAdmin(c: Context): { id: string; email: string } {
  const id = c.get('adminId') as string | undefined
  const email = c.get('adminEmail') as string | undefined
  if (!id || !email) {
    throw new AppError('internal', 500, 'Admin context missing from request')
  }
  return { id, email }
}

function routeParam(c: Context, name: string): string {
  const val = c.req.param(name)
  if (val === undefined || val.length === 0) {
    throw new AppError('validation-failed', 400, `${name} is required`)
  }
  return val
}

// ─── GET /api/v1/admin/collections ───────────────────────────

export async function handleListCollections(c: Context): Promise<Response> {
  const data = await listCollections()
  return c.json({ success: true, data })
}

// ─── POST /api/v1/admin/collections ──────────────────────────

export async function handleCreateCollection(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as CreateCollectionInput
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  const collection = await createCollection(body, acting.id)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'create_collection',
    targetType: 'editorial_collection',
    targetId: collection.id,
    details: { slug: collection.slug, title: collection.title },
    ipAddress,
    userAgent,
  })

  return c.json({ success: true, data: collection }, 201)
}

// ─── GET /api/v1/admin/collections/:id ───────────────────────

export async function handleGetCollection(c: Context): Promise<Response> {
  const id = routeParam(c, 'id')
  const data = await getCollectionDetail(id)
  return c.json({ success: true, data })
}

// ─── PATCH /api/v1/admin/collections/:id ─────────────────────

export async function handleUpdateCollection(c: Context): Promise<Response> {
  const id = routeParam(c, 'id')
  const body = c.get('validatedBody') as UpdateCollectionInput
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  const collection = await updateCollection(id, body)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'update_collection',
    targetType: 'editorial_collection',
    targetId: id,
    details: body as Record<string, unknown>,
    ipAddress,
    userAgent,
  })

  return c.json({ success: true, data: collection })
}

// ─── DELETE /api/v1/admin/collections/:id ────────────────────

export async function handleDeleteCollection(c: Context): Promise<Response> {
  const id = routeParam(c, 'id')
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  await deleteCollection(id)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'delete_collection',
    targetType: 'editorial_collection',
    targetId: id,
    ipAddress,
    userAgent,
  })

  return c.json({ success: true })
}

// ─── POST /api/v1/admin/collections/:id/items ────────────────

export async function handleAppendCollectionItem(c: Context): Promise<Response> {
  const id = routeParam(c, 'id')
  const body = c.get('validatedBody') as AppendCollectionItemInput
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  const collection = await appendCollectionItem(id, body.content_id)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'append_collection_item',
    targetType: 'editorial_collection',
    targetId: id,
    details: { content_id: body.content_id },
    ipAddress,
    userAgent,
  })

  return c.json({ success: true, data: collection })
}

// ─── DELETE /api/v1/admin/collections/:id/items/:contentId ───

export async function handleRemoveCollectionItem(c: Context): Promise<Response> {
  const id = routeParam(c, 'id')
  const contentId = routeParam(c, 'contentId')
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  const collection = await removeCollectionItem(id, contentId)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'remove_collection_item',
    targetType: 'editorial_collection',
    targetId: id,
    details: { content_id: contentId },
    ipAddress,
    userAgent,
  })

  return c.json({ success: true, data: collection })
}
