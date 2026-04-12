import type { Context } from 'hono'
import { AppError, ERROR_TITLES } from '../errors/AppError.js'

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          type: `https://creatorhub.in/errors/${err.type}`,
          title: ERROR_TITLES[err.type] ?? err.type,
          status: err.status,
          detail: err.detail,
          instance: c.req.path,
          ...(err.errors != null && { errors: err.errors }),
        },
      },
      err.status as Parameters<typeof c.json>[1],
    )
  }

  // Unexpected error — never expose internals
  console.error('[unhandled]', err)
  return c.json(
    {
      success: false,
      error: {
        type: 'https://creatorhub.in/errors/internal',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: c.req.path,
      },
    },
    500,
  )
}
