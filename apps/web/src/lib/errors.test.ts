import { describe, expect, it } from 'vitest'
import { AppError, friendlyMessage, isAppError, toAppError } from './errors'

describe('AppError', () => {
  it('captures all RFC 9457 fields', () => {
    const err = new AppError({
      type: 'rate-limited',
      status: 429,
      detail: 'Too many requests',
      instance: '/api/save',
    })
    expect(err.status).toBe(429)
    expect(err.type).toBe('rate-limited')
    expect(err.toJSON()).toEqual({
      type: 'rate-limited',
      status: 429,
      detail: 'Too many requests',
      instance: '/api/save',
    })
  })

  it('exposes named factories with sensible defaults', () => {
    expect(AppError.notFound().status).toBe(404)
    expect(AppError.unauthorized().status).toBe(401)
    expect(AppError.forbidden().status).toBe(403)
    expect(AppError.conflict('seat taken').detail).toBe('seat taken')
    expect(AppError.rateLimited().status).toBe(429)
    expect(AppError.upstream().status).toBe(503)
    expect(AppError.internal().status).toBe(500)
  })

  it('isAppError narrows correctly', () => {
    expect(isAppError(AppError.notFound())).toBe(true)
    expect(isAppError(new Error('x'))).toBe(false)
    expect(isAppError('boom')).toBe(false)
  })

  it('toAppError wraps unknown errors without leaking', () => {
    const wrapped = toAppError('random thing')
    expect(wrapped.status).toBe(500)
    expect(wrapped.detail).toBe('Unknown error')

    const fromErr = toAppError(new Error('disk full'))
    expect(fromErr.status).toBe(500)
    expect(fromErr.detail).toBe('disk full')

    const passthrough = toAppError(AppError.notFound('x'))
    expect(passthrough.status).toBe(404)
  })

  it('friendlyMessage replaces server-side details with safe copy', () => {
    expect(friendlyMessage(AppError.internal('stack trace details'))).toBe(
      'Something went wrong on our end',
    )
    expect(friendlyMessage(AppError.unauthorized())).toBe('Sign in to continue')
    expect(friendlyMessage(AppError.rateLimited())).toBe(
      'Slow down — please try again in a moment',
    )
  })
})
