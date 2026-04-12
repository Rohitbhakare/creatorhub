import type { Context, Next } from 'hono'
import type { z } from 'zod'
import { AppError } from '../errors/AppError.js'

/**
 * Zod validation middleware factory.
 * Validates the request JSON body against the provided schema.
 * Parsed data is stored on context as 'validatedBody'.
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    const body = await c.req.json().catch(() => {
      throw new AppError('validation-failed', 400, 'Invalid JSON body')
    })

    const result = schema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
      throw new AppError('validation-failed', 400, 'Request validation failed', errors)
    }

    c.set('validatedBody', result.data as z.infer<T>)
    await next()
  }
}

/**
 * Validates query parameters against a Zod schema.
 * Parsed data is stored on context as 'validatedQuery'.
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    const query = c.req.query()
    const result = schema.safeParse(query)

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
      throw new AppError('validation-failed', 400, 'Query parameter validation failed', errors)
    }

    c.set('validatedQuery', result.data as z.infer<T>)
    await next()
  }
}
