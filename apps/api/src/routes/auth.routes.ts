import { Hono } from 'hono'
import { handleRegister, handleRefresh, handleSignOut } from '../handlers/auth.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { authRateLimit } from '../middleware/rateLimit.js'
import { registerSchema, refreshSchema } from '@creatorhub/shared'

const auth = new Hono()

// All auth endpoints are rate limited: 10 req/min
auth.use('*', authRateLimit)

// POST /api/v1/auth/register
auth.post('/register', validateBody(registerSchema), handleRegister)

// POST /api/v1/auth/refresh
auth.post('/refresh', validateBody(refreshSchema), handleRefresh)

// POST /api/v1/auth/sign-out (requires auth)
auth.post('/sign-out', authenticate, handleSignOut)

export default auth
