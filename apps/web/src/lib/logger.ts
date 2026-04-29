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

const transport =
  isDev && typeof window === 'undefined'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,service,env',
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
