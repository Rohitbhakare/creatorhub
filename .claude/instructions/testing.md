# Testing Instructions

> Read this before writing any test. Defines what to test, how to test, and what coverage is required.

## Stack

- **API tests:** Vitest + `vi.mock()` — never hit real DB except in `*.integration.test.ts` files
- **Flutter tests:** `flutter_test` (unit + widget) + Patrol (e2e on device)
- **Web tests:** Vitest (unit, pure functions only) + Playwright (E2E, SSR page-level)
- **CI:** All tests run on every PR — green required to merge (NFR-MAINT-003)

## V-Model

```
Acceptance ←→ E2E       API: —          Flutter: Patrol     Web: Playwright
System     ←→ Integr.   API: app.request() + vi.mock   Flutter: WidgetTester   Web: —
Unit       ←→ Unit      API: Vitest+vi.mock  Flutter: flutter_test  Web: Vitest (pure fn)
```

### Web testing architecture (Next.js SSR)
React Server Components cannot be tested with React Testing Library. Instead:
- **Unit (Vitest):** Only `src/lib/api.ts` pure functions (`formatPrice`, fetch helpers with mocked `fetch`)
- **E2E (Playwright):** Starts two local servers — mock API (port 4000) + Next.js (port 3001). Mock API intercepts SSR `fetch()` calls, making tests hermetic with no real Hono API required.
- Playwright projects: Desktop Chrome + iPhone 14 (mobile-first validation)

---

## 1. Testing Pyramid

```
        /  E2E  \          ← Few: critical user journeys only
       /----------\
      / Integration \      ← Moderate: API with real DB
     /----------------\
    /    Unit Tests     \   ← Many: business logic, utilities, validators
   /--------------------\
```

**Startup rule:** Don't over-test. Test what breaks and what costs money. Skip tests for trivial getters, static UI, and framework boilerplate.

---

## 2. What MUST Be Tested (70%+ Coverage)

These modules handle money, compliance, or security. Bugs here = legal risk or lost revenue.

| Module | What to Test | Type |
|--------|-------------|------|
| **Booking state machine** | All state transitions (pending → confirmed → completed → etc.), invalid transitions rejected | Unit |
| **Payment calculations** | GST (18%), platform fee, TDS (1%), creator payout, refund amounts for all 3 policies | Unit |
| **KYC validation** | PAN format, Aadhaar masking, bank IFSC lookup, name fuzzy-match, resubmission counter | Unit |
| **Tax calculations** | Paisa arithmetic, rounding, edge cases (₹1 bookings, max amounts) | Unit |
| **Auth middleware** | Valid token passes, expired token 401, missing token 401, wrong role 403 | Integration |
| **Rate limiting** | Limits enforced, 429 returned, limits reset | Integration |
| **Razorpay webhooks** | Signature verification, idempotent processing, replay attack prevention | Integration |
| **API endpoints** | Request validation, correct status codes, error shapes (RFC 9457) | Integration |

---

## 3. What Can Skip Tests (for now)

- Static UI layouts (tested by visual review of wireframe match)
- Supabase/Firebase SDK wrappers (trust the SDK)
- Configuration files
- One-off migration scripts
- Retool admin screens

---

## 4. Unit Test Rules

### Location

Colocated with source — test file next to the file it tests:

```
services/
├── booking.service.ts
├── booking.service.test.ts    ← here
├── tax.service.ts
└── tax.service.test.ts        ← here
```

### Naming

```typescript
describe('BookingService', () => {
  describe('calculateRefund', () => {
    it('returns full refund for flexible policy cancelled 48h+ before departure', () => {
      // ...
    })
    
    it('returns 50% refund for moderate policy cancelled 24-48h before departure', () => {
      // ...
    })
    
    it('returns zero refund for strict policy cancelled <24h before departure', () => {
      // ...
    })
  })
})
```

- `describe` = module or function name
- `it` = specific behavior, reads as a sentence
- No "should" — describe what happens, not what should happen

### Assertions

```typescript
// Good — specific
expect(result.refundAmountPaisa).toBe(650000)
expect(result.status).toBe('refunded')

// Bad — vague
expect(result).toBeTruthy()
expect(result).toBeDefined()
```

### Mocking

- Mock external services (Razorpay, Firebase, Google Places) — never call real APIs in unit tests
- Do NOT mock the database in integration tests — use Supabase local (or test project)
- Do NOT mock internal services — if you need to mock a service to test another, they're too coupled

---

## 5. Integration Test Rules

### Setup

```typescript
// Use a clean test database per test suite
beforeAll(async () => {
  await resetTestDatabase()
  await seedTestData()
})

afterAll(async () => {
  await cleanupTestDatabase()
})
```

### API Tests

Test the full request→response cycle through Hono:

```typescript
import { app } from '../index'

describe('POST /api/v1/itineraries', () => {
  it('creates itinerary and returns 201 with Location header', async () => {
    const res = await app.request('/api/v1/itineraries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testCreatorToken}`,
      },
      body: JSON.stringify({
        title: 'Bali in 5 Days',
        vertical: 'travel',
        // ...
      }),
    })

    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toMatch(/\/api\/v1\/itineraries\//)
    
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.title).toBe('Bali in 5 Days')
  })

  it('returns 401 without auth token', async () => {
    const res = await app.request('/api/v1/itineraries', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 with validation errors for missing required fields', async () => {
    const res = await app.request('/api/v1/itineraries', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testCreatorToken}` },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    
    const body = await res.json()
    expect(body.error.type).toContain('validation-failed')
    expect(body.error.errors).toBeInstanceOf(Array)
  })
})
```

### What Integration Tests Must Verify

For every API endpoint:
1. Happy path returns correct status code and shape
2. Missing/invalid auth returns 401/403
3. Invalid input returns 400 with RFC 9457 error shape
4. Non-existent resource returns 404
5. Business rule violation returns 422

---

## 6. Flutter Test Rules

### Widget Tests

Test that widgets render correctly with given data:

```dart
testWidgets('ContentCard displays title and price', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: ContentCard(
        title: 'Bali in 5 Days',
        pricePaisa: 650000,
        type: ContentType.itinerary,
      ),
    ),
  );

  expect(find.text('Bali in 5 Days'), findsOneWidget);
  expect(find.text('₹6,500'), findsOneWidget);
});
```

### What to Test in Flutter

- Components render correctly with different data states (full, empty, error)
- Navigation works (tap → correct screen)
- Form validation shows errors
- Loading states show skeleton (not spinner)
- Empty states show illustration + CTA

### What NOT to Test in Flutter

- Exact pixel positions (too brittle)
- Animation timing (tested visually)
- Third-party widget internals

---

## 7. E2E Tests (Milestone Gates Only)

Run at milestone gates (M0, M1, M2), not per-epic:

### M0 Gate

```
✓ User signs up with phone OTP
✓ User completes 5-step onboarding
✓ Guest browses content without auth
✓ Guest hits soft auth wall on save action
✓ Health endpoints return 200
```

### M1 Gate

```
✓ Creator creates a post with images
✓ Creator creates an itinerary with spots (Places API)
✓ Creator creates an event
✓ User views home feed with sections
✓ User follows a creator
✓ User saves content to a list
✓ User shares content via WhatsApp
✓ Push notification received on follow
```

### M2 Gate

```
✓ Creator completes KYC (PAN + Aadhaar + bank + selfie)
✓ Creator creates paid scheduled experience
✓ User books experience (Razorpay sandbox)
✓ Payment confirmed, booking created
✓ Booking completed, payout triggered
✓ User leaves blind review
✓ Review revealed after 14 days
✓ User requests refund (flexible policy)
✓ User reports content, appears in moderation queue
✓ User deletes account (soft delete)
```

---

## 8. Test Data

### Fixtures

Create reusable test fixtures in `tests/fixtures/`:

```typescript
export const testCreator = {
  id: 'test-creator-001',
  phone: '+919999999901',
  name: 'Test Creator',
  is_creator: true,
  kyc_status: 'approved',
}

export const testFollower = {
  id: 'test-follower-001',
  phone: '+919999999902',
  name: 'Test Follower',
  is_creator: false,
}

export const testItinerary = {
  title: 'Bali in 5 Days',
  vertical: 'travel',
  type: 'self_paced_itinerary',
  price_paisa: 0,
  // ...
}
```

### Amounts

Always use specific paisa values in tests — never "random" amounts:
- Free: `0`
- Cheap: `50000` (₹500)
- Standard: `650000` (₹6,500)
- Expensive: `2500000` (₹25,000)
- Edge: `100` (₹1 — minimum), `10000000` (₹1,00,000 — high value)

---

## 9. CI Pipeline

```yaml
# Runs on every PR
test:
  steps:
    - lint (ESLint + Dart analyze)
    - typecheck (tsc --noEmit)
    - unit tests (Vitest + flutter test)
    - integration tests (Vitest with test DB)
    - coverage check (fail if critical modules < 70%)
```

- All tests must pass before merge — no exceptions
- Flaky tests are bugs — fix them, don't skip them
- Test timeout: 30s per test, 5min per suite
