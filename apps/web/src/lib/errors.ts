/**
 * AppError — RFC 9457 Problem Details, mirrors the API's error contract so we
 * can surface server-side failures consistently across SSR + client.
 */
export class AppError extends Error {
  readonly type: string
  readonly status: number
  readonly detail: string
  readonly instance: string | undefined
  override readonly cause: unknown

  constructor(opts: {
    type: string
    status: number
    detail: string
    instance?: string
    cause?: unknown
  }) {
    super(opts.detail)
    this.name = 'AppError'
    this.type = opts.type
    this.status = opts.status
    this.detail = opts.detail
    this.instance = opts.instance
    this.cause = opts.cause
  }

  toJSON() {
    return {
      type: this.type,
      status: this.status,
      detail: this.detail,
      instance: this.instance,
    }
  }

  static notFound(detail = 'Resource not found') {
    return new AppError({ type: 'not-found', status: 404, detail })
  }

  static unauthorized(detail = 'Sign in to continue') {
    return new AppError({ type: 'unauthorized', status: 401, detail })
  }

  static forbidden(detail = 'You do not have access to this resource') {
    return new AppError({ type: 'forbidden', status: 403, detail })
  }

  static badRequest(detail: string) {
    return new AppError({ type: 'bad-request', status: 400, detail })
  }

  static conflict(detail: string) {
    return new AppError({ type: 'conflict', status: 409, detail })
  }

  static rateLimited(detail = 'Too many requests, please slow down') {
    return new AppError({ type: 'rate-limited', status: 429, detail })
  }

  static upstream(detail = 'A dependency is unavailable, please retry') {
    return new AppError({ type: 'upstream-failure', status: 503, detail })
  }

  static internal(detail = 'Something went wrong on our end') {
    return new AppError({ type: 'internal', status: 500, detail })
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

/** Map any thrown value into an AppError without leaking internals. */
export function toAppError(err: unknown): AppError {
  if (isAppError(err)) return err
  if (err instanceof Error) {
    return AppError.internal(err.message)
  }
  return AppError.internal('Unknown error')
}

/** Friendly user-facing copy per error type. */
export function friendlyMessage(err: AppError): string {
  switch (err.status) {
    case 401:
      return 'Sign in to continue'
    case 403:
      return "You don't have access to this"
    case 404:
      return "We couldn't find what you were looking for"
    case 409:
      return 'That conflicts with something — please try again'
    case 422:
      return err.detail
    case 429:
      return 'Slow down — please try again in a moment'
    case 503:
      return 'A service is temporarily unavailable — try again shortly'
    default:
      return err.status >= 500 ? 'Something went wrong on our end' : err.detail
  }
}
