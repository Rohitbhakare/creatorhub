export type FieldError = {
  field: string
  message: string
  code: string
}

export class AppError extends Error {
  constructor(
    public readonly type: string,
    public readonly status: number,
    public readonly detail: string,
    public readonly errors?: FieldError[],
  ) {
    super(detail)
    this.name = 'AppError'
  }
}

// Human-readable titles for each error type (RFC 9457: title is stable per type)
export const ERROR_TITLES: Record<string, string> = {
  'validation-failed': 'Validation Failed',
  'not-found': 'Not Found',
  'unauthorized': 'Unauthorized',
  'forbidden': 'Forbidden',
  'conflict': 'Conflict',
  'unprocessable': 'Unprocessable Request',
  'rate-limited': 'Too Many Requests',
  'db-error': 'Database Error',
  'internal': 'Internal Server Error',
  'token-expired': 'Token Expired',
  'invalid-token': 'Invalid Token',
  'invalid-credentials': 'Invalid Credentials',
  'account-locked': 'Account Locked',
  'password-change-required': 'Password Change Required',
  'admin-forbidden': 'Admin Access Forbidden',
}
