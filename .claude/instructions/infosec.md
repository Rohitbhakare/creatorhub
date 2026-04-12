# InfoSec Instructions

> Read this before writing any code that touches auth, payments, user data, or external services. These are non-negotiable security rules.

## Threat Model — What We're Protecting

| Asset | Threat | Impact |
|-------|--------|--------|
| User phone numbers | Data breach, scraping | Privacy violation, DPDPA penalty |
| KYC documents (PAN, Aadhaar) | Data breach | Identity theft, legal liability |
| Bank account details | Data breach | Financial fraud |
| Payment data | MITM, replay | Financial loss |
| OAuth tokens (Instagram/YouTube) | Token theft | Account takeover on 3rd party |
| Creator content | Unauthorized access | IP theft |
| API keys (Places, Firebase) | Key exposure | Billing abuse, service compromise |

---

## 1. Authentication & Authorization

### Rules

- **Passwordless only** — Firebase Phone OTP. No passwords stored, ever.
- **JWT verification server-side** — `firebase-admin.auth().verifyIdToken(token)` on every request. Never trust client-decoded tokens.
- **Token in Authorization header** — `Bearer <token>`. Never in URL query params (logged by proxies).
- **Web sessions:** `HttpOnly; Secure; SameSite=Lax` cookies. Never `localStorage`.
- **Mobile tokens:** Flutter Secure Storage (backed by Keychain/Keystore). Never SharedPreferences.
- **Token expiry:** 1 hour access token, 30-day refresh token. Refresh token rotation on use.

### Authorization Checks

Every endpoint MUST check authorization — not just authentication:

```typescript
// Is the user who they say they are? (authentication)
authenticate(c)

// Can they do this action? (authorization)
if (content.user_id !== c.get('userId')) {
  throw new AppError('forbidden', 403, 'You can only edit your own content')
}
```

Common authorization checks:
- **Own resource:** User can only edit/delete their own content, bookings, profile
- **Creator role:** `requireCreator` middleware for publish, studio, earnings endpoints
- **KYC approved:** `requireKYC` middleware for publishing paid content
- **Booking ownership:** Users can only view/cancel their own bookings
- **Admin role:** Admin-only endpoints behind `requireAdmin` (Retool uses service role key)

### IDOR Prevention

Never trust client-provided IDs for authorization:

```typescript
// Bad — trusts client's userId
const booking = await getBooking(req.body.bookingId)

// Good — scopes to authenticated user
const booking = await getBookingForUser(req.body.bookingId, c.get('userId'))
// Query: WHERE id = $1 AND user_id = $2
```

---

## 2. Input Validation

### Validate Everything at the Boundary

```typescript
// Every request body validated with Zod
const schema = z.object({
  title: z.string().min(3).max(200),
  price_paisa: z.number().int().min(0).max(10000000),
  vertical: z.enum(['travel', 'stories']),
})

// Path params too
const idSchema = z.string().uuid()

// Query params too
const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})
```

### SQL Injection Prevention

- **Always parameterized queries** — no string concatenation, no template literals in SQL
- Supabase client handles parameterization automatically
- For raw SQL (via `supabase.rpc` or direct), use `$1, $2` placeholders

```typescript
// Good
const { data } = await supabase
  .from('content')
  .select('*')
  .eq('id', contentId)
  .eq('user_id', userId)

// Good (raw SQL)
await supabase.rpc('search_content', { query_text: searchQuery })

// BAD — SQL injection vulnerability
// await supabase.rpc('execute', { sql: `SELECT * FROM content WHERE id = '${contentId}'` })
// ^^^ NEVER DO THIS
```

### XSS Prevention

- Sanitize user-generated HTML content with DOMPurify before storage (if rich text is allowed)
- React/Next.js auto-escapes by default — never render raw unsanitized HTML
- Flutter doesn't have XSS risk in native views, but sanitize for WebView if used
- CSP headers on web: no `unsafe-inline`, no `unsafe-eval`

---

## 3. Data Protection

### Encryption at Rest

| Data | Method | Key Management |
|------|--------|---------------|
| All DB data | Supabase default (AES-256 disk encryption) | Supabase-managed |
| KYC documents (PAN, Aadhaar images) | Envelope encryption before upload to Firebase Storage | App-managed KMS key |
| OAuth tokens (`access_token_enc`) | AES-256-GCM envelope encryption | App-managed KMS key |
| Bank account details | AES-256-GCM | App-managed KMS key |
| PAN number | SHA-256 hash (for dedup) — never stored in plaintext | N/A (one-way hash) |
| Aadhaar number | SHA-256 hash (for dedup) — never stored in plaintext | N/A (one-way hash) |

### Encryption in Transit

- TLS 1.2+ on all connections — no exceptions
- HSTS header on web with preload
- Certificate pinning on mobile (Flutter: `SecurityContext`)

### PII Handling Rules

- **Never log:** phone numbers, PAN, Aadhaar, bank details, OAuth tokens, passwords
- **Never return in API responses:** full PAN (mask as `XXXX1234`), full Aadhaar (mask as `XXXX XXXX 1234`), full bank account number (mask last 4)
- **Never expose in error messages:** internal IDs, SQL queries, stack traces
- **Never in URLs:** PII in query params gets logged by proxies and browsers

---

## 4. Secrets Management

### Rules

- **No secrets in code** — not in `.env` files committed to git, not in constants, not in comments
- **Secrets manager:** Doppler, Supabase Vault, or environment variables set in deployment platform (Fly.io secrets)
- `.env` files are `.gitignore`d — always
- `.env.example` has placeholder values, never real keys

### Required Secrets

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Never expose to client
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=          # Service account — server only
GOOGLE_PLACES_API_KEY=         # Server-side proxy only — never in client
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=           # Server only
RAZORPAY_WEBHOOK_SECRET=       # Webhook signature verification
SENTRY_DSN=
POSTOG_API_KEY=
```

### Google Places API Key

This key MUST never reach the client:
- All Places calls go through `/api/v1/places/*` proxy
- Key is in server environment only
- Rate limit: 100 req/creator/hour to prevent abuse

---

## 5. Payment Security

### Razorpay Integration

- **Never process payments server-side** — Razorpay checkout handles PCI compliance
- **Always verify webhook signatures** before processing payment events:

```typescript
const isValid = Razorpay.validateWebhookSignature(
  rawBody,
  signature,
  webhookSecret
)
if (!isValid) throw new AppError('invalid-signature', 400, 'Invalid webhook signature')
```

- **Idempotent webhook processing** — store `razorpay_payment_id`, skip if already processed
- **Never store card numbers, CVV, or UPI PIN** — Razorpay handles this
- Amounts always in paisa (integer), verified server-side against the order amount

### Escrow Rules

- Platform never holds customer funds directly — Razorpay Route holds escrow
- Payout to creator only after: experience completed + 48h dispute window
- Refund amounts calculated server-side, never from client input

---

## 6. Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Auth (OTP request) | 5 | per phone per 15min |
| Auth (OTP verify) | 10 | per phone per 15min |
| General API (authenticated) | 100 | per user per minute |
| General API (unauthenticated) | 30 | per IP per minute |
| Content creation | 10 | per user per hour |
| File upload | 20 | per user per hour |
| Places proxy | 100 | per creator per hour |
| Webhook endpoints | 1000 | per IP per minute |

Return `429 Too Many Requests` with `Retry-After` header.

---

## 7. Row-Level Security (Supabase RLS)

All tables MUST have RLS policies enabled. Default: deny all.

```sql
-- Users can only read their own data
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Content is publicly readable (for feed/discovery)
CREATE POLICY "content_select_public" ON content
  FOR SELECT USING (status = 'published');

-- Only owner can update their content
CREATE POLICY "content_update_own" ON content
  FOR UPDATE USING (auth.uid() = user_id);

-- Bookings visible only to booker and creator
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM content WHERE id = content_id)
  );
```

- Service role key bypasses RLS — use only in trusted server contexts (admin operations, webhooks)
- Anon key respects RLS — used for client-side Supabase calls (if any)

---

## 8. Content Security

### Moderation

- **Text:** Google Perspective API for toxicity scoring (pre-publish check)
- **Images:** Google Cloud Vision SafeSearch (pre-publish check)
- **First 3 publishes:** Manual review queue for new creators (SEC-FR-001)
- **Takedown SLA:** 48h for reported content, 4h for severe (CSAM, violence)

### File Uploads

- Validate MIME type server-side (don't trust `Content-Type` header)
- Max file sizes: image 10MB, video 100MB (if applicable)
- Scan for malware if possible (Cloud Storage has built-in scanning)
- Store in Firebase Storage with security rules — not publicly accessible by default
- Generate signed URLs with expiry for client access

---

## 9. DPDPA Compliance (Data Protection)

- **Consent before collection** — explicit purpose-bound consent at registration
- **Data export** — user can request JSON download of all their data (72h delivery)
- **Account deletion** — soft-delete with 30-day retention, then hard delete
- **Search history** — 90-day rolling retention, guest searches never logged server-side
- **Children < 18** — parental consent required, no behavioral tracking
- **Breach notification** — 72h to DPA (Data Protection Authority)

---

## 10. Security Review Checklist (Per Epic)

Before merging any epic, verify:

- [ ] All endpoints use `authenticate` or `optionalAuthenticate`
- [ ] Authorization checks prevent IDOR (scoped to user)
- [ ] All input validated with Zod (body, params, query)
- [ ] SQL queries are parameterized (no string concatenation)
- [ ] No secrets in code or logs
- [ ] PII not logged or exposed in errors
- [ ] Rate limiting applied
- [ ] RLS policies cover new tables
- [ ] File uploads validated (type, size)
- [ ] Webhook signatures verified
- [ ] Error responses use RFC 9457 format (no stack traces)
