# Documentation Instructions

> Rules for what to document, where, and how. Startup-lean — document what helps the next person (or future-you) ship faster. Skip everything else.

---

## 1. What MUST Be Documented

| Document | Why | Where | When Updated |
|----------|-----|-------|-------------|
| **CLAUDE.md** (root) | AI agent context — stack, conventions, active sprint | Project root | Every sprint |
| **Per-app CLAUDE.md** | App-specific patterns for AI agents | `apps/api/CLAUDE.md`, `apps/mobile/CLAUDE.md` | When patterns change |
| **OpenAPI spec** | API contract — mobile and web code against this | `docs/engineering/openapi.yaml` | Before implementing any endpoint |
| **HLD** | System architecture, data flows, deployment | `docs/engineering/HLD.md` | Major architecture changes |
| **ADRs** | Why we chose X over Y (decisions that future-you will question) | `docs/adr/` | When making non-obvious technical decisions |
| **Epic task breakdowns** | Tasks, edge cases, acceptance criteria per epic | `docs/epics/` | Before starting each epic |
| **API changelog** | What changed in the API | `apps/api/CHANGELOG.md` | Every API change |
| **README** | How to set up and run the project | Project root | Initial setup, then as infra changes |

---

## 2. What NOT to Document

- **Code comments explaining what** — the code should be readable on its own. Only comment *why* when the reason isn't obvious.
- **Function-level JSDoc/dartdoc** — don't add docstrings to every function. Add them only to public APIs and non-obvious business logic.
- **Meeting notes, brainstorms, decision logs** — that's what the SRS, ADRs, and memory system are for.
- **How to use standard tools** — don't document "how to run `pnpm install`". Do document project-specific setup steps.
- **Tutorials for your own code** — if someone needs a tutorial to use your module, the API is too complex. Simplify it.

---

## 3. CLAUDE.md (Root)

This is the most important doc — every AI session reads it. Keep it under 200 lines.

**Must contain:**
- Tech stack (confirmed versions)
- Monorepo structure (directories and what's in them)
- Key conventions (file naming, API pattern, response format, money in paisa)
- Pointer to instruction files (`docs/instructions/*.md`)
- Pointer to SRS (`docs/00_SRS/v1.2/srs-v1.2.md`)
- Current sprint and active epics (update weekly)
- Business rules that affect code (platform fee, GST, TDS, KYC, payout timing)

**Must NOT contain:**
- Full API specs (that's OpenAPI)
- Full design system (that's `docs/instructions/ui-ux.md`)
- Historical decisions (that's ADRs)
- Detailed requirements (that's SRS)

---

## 4. ADRs (Architecture Decision Records)

### When to Write One

Write an ADR when you make a decision that:
- Has multiple viable options (not obvious)
- Is expensive to reverse later
- Future-you will wonder "why did we do it this way?"

### Template

```markdown
# ADR-NNN: Title

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded by ADR-NNN

## Context
What problem are we solving? What constraints do we have?

## Decision
What did we decide? Be specific.

## Alternatives Considered
What else did we consider and why did we reject it? (2-3 sentences each)

## Consequences
What are the trade-offs? What becomes easier? What becomes harder?
```

### File Location

```
docs/adr/
├── 001-flutter-over-react-native.md
├── 002-supabase-direct-sql-no-orm.md
├── 003-hono-over-express.md
└── ...
```

### Examples of ADR-Worthy Decisions

- State management choice (Riverpod vs Bloc vs Provider)
- Navigation library (GoRouter vs auto_route)
- Image caching strategy
- Cursor vs offset pagination
- Search approach (tsvector now, Meilisearch later)

### Examples of NOT ADR-Worthy

- Variable naming (that's conventions)
- Which lint rules to enable (that's config)
- File structure (that's CLAUDE.md)

---

## 5. OpenAPI Spec

### Format

OpenAPI 3.1.0, single file at `docs/engineering/openapi.yaml`.

### Rules

- **Every endpoint in the spec before it's coded** — this is the contract
- Include: path, method, summary, request body schema, response schemas (200, 400, 401, 404, 422), auth requirement
- Use `$ref` for shared schemas (avoid duplication)
- Tag endpoints by resource (`itineraries`, `bookings`, `auth`, etc.)
- Include examples for request and response bodies

### Skeleton

```yaml
openapi: 3.1.0
info:
  title: CreatorHub API
  version: 1.0.0
  description: Travel social platform + experience marketplace API

servers:
  - url: https://api.creatorhub.in/api/v1
    description: Production
  - url: http://localhost:3000/api/v1
    description: Local development

paths:
  /itineraries:
    post:
      summary: Create a new itinerary
      tags: [Itineraries]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateItineraryRequest'
      responses:
        '201':
          description: Itinerary created
          headers:
            Location:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
          const: true
        data:
          type: object

    ProblemDetail:
      type: object
      description: RFC 9457 Problem Details
      properties:
        success:
          type: boolean
          const: false
        error:
          type: object
          properties:
            type:
              type: string
              format: uri
            title:
              type: string
            status:
              type: integer
            detail:
              type: string
            instance:
              type: string
```

---

## 6. Epic Task Breakdowns

### Location

One file per epic in `docs/epics/`:

```
docs/epics/
├── E0.1-repo-infra.md
├── E0.2-database-schema.md
├── E0.3-authentication.md
└── ...
```

### Template

```markdown
# E0.3 — Authentication

## SRS Requirements
- IAM-FR-001: Phone OTP sign-up/sign-in
- IAM-FR-002: Session management
- IAM-FR-005: Google/Apple OAuth
- IAM-FR-010: Guest browsing
- IAM-FR-011: Soft auth wall

## Tasks

### T1: Firebase Admin SDK setup
- **Files:** `apps/api/src/config/firebase.ts`
- **Acceptance:** `verifyIdToken` works with test token

### T2: Auth middleware
- **Files:** `apps/api/src/middleware/authenticate.ts`
- **Acceptance:** Valid token → userId in context, expired → 401, missing → 401

### T3: OTP request/verify endpoints
- **Files:** `apps/api/src/routes/auth.routes.ts`, `apps/api/src/handlers/auth.ts`
- **API:** `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`
- **Acceptance:** Returns JWT on successful verify

(... etc)

## Edge Cases
- OTP expired (> 5 min) → clear error, allow resend
- Phone number already registered → sign in, not duplicate account
- Rate limit exceeded (> 5 OTP requests in 15 min) → 429 with retry-after
- Firebase service down → graceful error, not 500 with stack trace
- Token refresh during active session → seamless, no re-login
- Guest user triggers auth wall → after auth, original action completes

## Test Cases
- (reference testing.md for patterns)
```

---

## 7. README.md

### Rules

- **One screen of text** — if someone can't set up the project after reading one screen, the setup is too complex
- **No badges, shields, or decoration** — this is a private startup repo
- **Tested instructions** — run them yourself before committing

### Template

```markdown
# CreatorHub

Travel social platform + experience marketplace for India.

## Setup

Prerequisites: Node 20+, pnpm 9+, Flutter 3.22+, Docker (for local Supabase)

\`\`\`bash
git clone <repo>
cd creatorhub
pnpm install
cp .env.example .env  # fill in your keys
pnpm dev              # starts API + web
\`\`\`

For mobile:
\`\`\`bash
cd apps/mobile
flutter pub get
flutter run
\`\`\`

## Project Structure

See CLAUDE.md for full details.

## Docs

- SRS: docs/00_SRS/v1.2/srs-v1.2.md
- Instructions: docs/instructions/
- API Spec: docs/engineering/openapi.yaml
- Architecture: docs/engineering/HLD.md
\`\`\`
```

---

## 8. Commit Messages

Conventional commits — enforced by CI:

```
feat: add itinerary creation with spot-based day builder
fix: correct GST calculation rounding for amounts under ₹100
docs: add ADR for Riverpod state management
test: add booking state machine unit tests
refactor: extract Places proxy into shared middleware
chore: upgrade Flutter to 3.24
```

- **Subject:** imperative mood, lowercase, no period, under 72 chars
- **Body:** optional, explain *why* not *what* (the diff shows what)
- **Footer:** `Closes #123` to link issues

---

## 9. Code Comments

### When to Comment

- **Business rules** that aren't obvious from the code:
  ```typescript
  // Platform fee: 17% of base price. GST (18%) is on top of base, not on fee.
  // Creator receives: base - platform_fee. Buyer pays: base + GST.
  ```

- **Workarounds** with context:
  ```typescript
  // Razorpay Route doesn't support partial refunds on UPI payments (as of 2026-04).
  // Full refund only. Track partial refunds as platform credit instead.
  ```

- **Non-obvious performance decisions:**
  ```typescript
  // Using cursor-based pagination instead of offset because the content table
  // receives frequent inserts, which causes offset-based queries to skip/duplicate rows.
  ```

### When NOT to Comment

```typescript
// Bad — explains what (obvious from code)
// Get the user by ID
const user = await getUserById(id)

// Bad — restates the function name
// Calculate the total price
function calculateTotalPrice() { }

// Bad — changelog in comments
// Added by Rohit on 2026-04-12
// Modified: changed from rupees to paisa
```

---

## 10. Versioning

- **SRS:** Semantic versioning (v1.2.1) — already established
- **API:** Path versioning (`/api/v1/`) — see api.md
- **Mobile app:** Semantic versioning (1.0.0 for MVP launch)
- **Database:** Sequential migration numbers managed by Supabase
