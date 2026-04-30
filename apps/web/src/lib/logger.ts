import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

const baseConfig: pino.LoggerOptions = {
  level: process.env['LOG_LEVEL'] || (isDev ? 'debug' : 'info'),
  base: {
    service: 'creatorhub-web',
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.refresh_token',
      '*.access_token',
      '*.firebase_token',
      '*.idempotency_key',
      'body.password',
      'body.token',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}

// Pino's pino-pretty transport spawns a worker_thread. Next.js bundles the
// app for dev and that worker file ends up missing from .next/server/
// vendor-chunks, which throws "Cannot find module .../lib/worker.js" the
// first time we log — and the throw cascades through every server action
// (api-client → page render → falsey content → notFound()). To keep the
// console readable in dev *without* the worker, we use the synchronous
// pretty path, and skip pretty entirely when the test harness sets
// E2E_API_BASE_URL (where readable output isn't worth the stability cost).
const isE2E = !!process.env.E2E_API_BASE_URL

const transport =
  isDev && !isE2E && typeof window === 'undefined'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,service,env',
          // Sync mode — no worker_thread, so Next's dev bundler doesn't
          // need to ship a separate worker.js chunk.
          sync: true,
        },
      })
    : undefined

export const logger = transport ? pino(baseConfig, transport) : pino(baseConfig)

export type Logger = typeof logger

export function childLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings)
}

export function logRequest(opts: {
  method: string
  path: string
  requestId: string
  userId?: string | null
}): Logger {
  return logger.child({
    requestId: opts.requestId,
    method: opts.method,
    path: opts.path,
    userId: opts.userId ?? null,
  })
}
