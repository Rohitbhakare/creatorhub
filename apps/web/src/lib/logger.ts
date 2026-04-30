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

// Pino's transport spawns a worker_thread that requires `pino/lib/worker.js`
// at runtime. Historically Next.js bundled pino into `.next/server/vendor-
// chunks`, which placed that worker file at a path the worker thread
// couldn't resolve, throwing `Cannot find module .../lib/worker.js` on the
// first log. The fix lives in `next.config.ts` (`serverExternalPackages:
// ['pino', 'pino-pretty', 'thread-stream', 'sonic-boom']`) — it tells Next
// to leave them in node_modules so Node resolves them normally and the
// worker chunk is found. With that in place, the transport boots cleanly,
// the `sync: true` option here is no longer load-bearing, and we keep it
// only because it makes individual log lines flush in test runs (and
// `E2E_API_BASE_URL` still skips the transport entirely to avoid worker
// startup cost during E2E).
const isE2E = !!process.env.E2E_API_BASE_URL

const transport =
  isDev && !isE2E && typeof window === 'undefined'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,service,env',
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
