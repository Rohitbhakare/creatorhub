import type { Context } from 'hono'
import { AppError, ERROR_TITLES } from '../errors/AppError.js'
import { env } from '../env.js'

const isDev = env.NODE_ENV === 'development'

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof AppError) {
    if (isDev) {
      console.error(`⚠️  AppError [${err.status}] ${err.type}: ${err.detail}`)
    }
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

  // Unexpected error — log full detail in dev, redact in prod
  console.error(`❌ Unhandled error on ${c.req.method} ${c.req.path}:`)
  console.error(`   Message: ${err.message}`)
  if (isDev && err.stack) {
    console.error(`   Stack: ${err.stack}`)
  }

  return c.json(
    {
      success: false,
      error: {
        type: 'https://creatorhub.in/errors/internal',
        title: 'Internal Server Error',
        status: 500,
        detail: isDev ? err.message : 'An unexpected error occurred.',
        instance: c.req.path,
      },
    },
    500,
  )
}
