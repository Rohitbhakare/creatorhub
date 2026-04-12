# CLAUDE.md — CreatorHub

> Claude Code reads this file automatically. It is the entry point for all AI sessions.

---

## What This Project Is

CreatorHub is a **travel social platform + experience marketplace** for India.
Four content types: Posts (free) | Self-paced Itineraries (free/paid) | Scheduled Experiences (paid) | Events (free/paid).
Users can be both travelers and creators (unified model). Launch verticals: **Travel + Stories**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Flutter 3.22+ (Dart) |
| Web (MVP minimal) | Next.js 14+ App Router (TypeScript) — SSR pages only |
| API | Hono (TypeScript) on Fly.io |
| Database | Supabase Postgres + PostGIS (direct SQL, no ORM) |
| Auth | Firebase Phone OTP + Google/Apple OAuth |
| Storage | Firebase Storage |
| Payments | Razorpay (UPI-first) + Route (escrow) |
| Search | Postgres `tsvector` (MVP) |
| Notifications | FCM + WhatsApp Business + SendGrid |
| Maps | Google Maps SDK + Places API (server-side proxy only) |
| Analytics | PostHog + Sentry |
| Monorepo | pnpm workspaces |

## Monorepo Structure

```
creatorhub/
├── .claude/
│   ├── instructions/     # API, UI/UX, Testing, InfoSec, Documentation rules
│   ├── agents/           # Agent prompts: master-epic, backend, mobile, web
│   └── commands/         # Slash commands: /plan-epic, /build-epic, /review-*, /epic-status
├── apps/
│   ├── api/              # Hono API server
│   ├── mobile/           # Flutter app
│   └── web/              # Next.js (minimal MVP — SSR pages only)
├── packages/
│   └── shared/           # TypeScript types, Zod schemas, constants
└── docs/
    ├── 00_SRS/           # SRS v1.2 (single source of truth)
    ├── 01_wireframes/    # 21 wireframes + interactive prototype
    ├── engineering/      # HLD, OpenAPI spec
    └── epics/            # Epic plans, tasks, tracking
```

## Instruction Files (MUST read before coding)

| File | When to Read |
|------|-------------|
| `.claude/instructions/api.md` | Before writing any API code |
| `.claude/instructions/ui-ux.md` | Before writing any Flutter or Next.js UI code |
| `.claude/instructions/testing.md` | Before writing any test |
| `.claude/instructions/infosec.md` | Before touching auth, payments, user data, or external services |
| `.claude/instructions/documentation.md` | Before creating docs, ADRs, or commit messages |

## Key Document References

| What you need | Read this |
|---------------|-----------|
| Any feature requirement | `docs/00_SRS/v1.2/srs-v1.2.md` |
| Screen layout/design | `docs/01_wireframes/v1/wireframes_html/` |
| Interaction flows | `docs/01_wireframes/v1/prototype.jsx` |
| System architecture | `docs/engineering/HLD.md` |
| API endpoint contracts | `docs/engineering/openapi.yaml` |
| Epic plans & progress | `docs/epics/TRACKING.md` |

## Coding Standards

- **File naming:** `kebab-case.ts` for files, `PascalCase` for components/widgets
- **API pattern:** route → handler (thin) → service (logic) → SQL query
- **Validation:** Zod schemas in `packages/shared/src/schemas/`
- **API response:** `{ success: true, data: T }` or RFC 9457 error
- **Amounts:** Always in **paisa** (integer), never rupees (float)
- **Auth:** `authenticate` (required) or `optionalAuthenticate` (guests)
- **Creator check:** `requireCreator` middleware
- **KYC check:** `requireKYC` middleware (for paid content publishing)
- **Errors:** AppError class with type, status, detail (RFC 9457)
- **Tests:** Colocated (`*.test.ts`), 70%+ coverage on critical modules
- **Git:** Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- **PRs:** One per epic, 4-step review gate before merge

## Business Rules

- Platform fee: 17% on paid bookings
- GST: 18% on base price (collected from buyer)
- TDS: 1% on creator payout (Sec 194-O)
- Payout: After completion + 48h dispute window
- UPI: Always default payment method
- KYC: Required to publish paid content (even free experiences)
- Posts: Free, no KYC needed
- Coral accent (`#E15A41`): Used in exactly 8 contexts only (see ui-ux.md)
- Max 5 images per post, 10 per experience
- Blind reviews: 14-day reveal deadline

## Development Process

```
/plan-epic <id>     → Creates epic folder with plan + tasks + tracking
/build-epic <id>    → Orchestrates: types → parallel agents → integrate → 4-step review
/review-security    → OWASP checklist on current diff
/review-architecture → HLD adherence check
/review-edge-cases  → Missing error states check
/epic-status [id]   → Show progress
/update-tracking    → Update task/epic progress
```

## Current Sprint

**Phase:** M0 Complete — Starting M1 (Private Alpha)
**Done:** E0.1 Repo, E0.2 Schema, E0.3 Auth, E0.4 Design System, E0.5 Onboarding
**Next:** E1.1 Content Framework → E1.2 Posts → E1.3 Itineraries
**Tracking:** `docs/epics/TRACKING.md`
