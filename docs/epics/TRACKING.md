# CreatorHub — Epic Tracking

> Master tracking file. Updated after every epic task completion.
> Last updated: 2026-04-12

---

## Current Sprint

**Sprint:** M0 Complete — Moving to M1 (Private Alpha)
**Focus:** E1.1 Content Framework → E1.2 Posts → E1.3 Itineraries

---

## M0 — Foundations (Weeks 1-2)

| Epic | Name | Status | Progress | Blocked By |
|------|------|--------|----------|------------|
| E0.1 | Repo & Infra | `DONE` | 9/9 | — |
| E0.2 | Database Schema | `DONE` | 12/12 | E0.1 |
| E0.3 | Authentication | `DONE` | 10/10 | E0.1, E0.2 |
| E0.4 | Design System | `DONE` | 12/12 | E0.1 |
| E0.5 | Onboarding | `DONE` | 10/10 | E0.3, E0.4 |

## M1 — Private Alpha (Weeks 3-6)

| Epic | Name | Status | Progress | Blocked By |
|------|------|--------|----------|------------|
| E1.1 | Content Framework | `NOT STARTED` | 0/0 | E0.2, E0.4 |
| E1.2 | Posts | `NOT STARTED` | 0/0 | E1.1 |
| E1.3 | Itineraries | `NOT STARTED` | 0/0 | E1.1 |
| E1.4 | Events | `NOT STARTED` | 0/0 | E1.1 |
| E1.5 | Home Feed | `NOT STARTED` | 0/0 | E0.2, E0.4 |
| E1.6 | Profiles | `NOT STARTED` | 0/0 | E0.3, E0.4 |
| E1.7 | Social | `NOT STARTED` | 0/0 | E0.3 |
| E1.8 | Studio Tab | `NOT STARTED` | 0/0 | E1.1, E0.4 |
| E1.9 | Notifications | `NOT STARTED` | 0/0 | E0.3 |

## M2 — Public MVP (Weeks 7-12)

| Epic | Name | Status | Progress | Blocked By |
|------|------|--------|----------|------------|
| E2.1 | Scheduled Experiences | `NOT STARTED` | 0/0 | E1.1 |
| E2.2 | KYC Flow | `NOT STARTED` | 0/0 | E0.3, E0.4 |
| E2.3 | Payments & Booking | `NOT STARTED` | 0/0 | E2.1, E2.2 |
| E2.4 | Refunds & Cancellations | `NOT STARTED` | 0/0 | E2.3 |
| E2.5 | Reviews | `NOT STARTED` | 0/0 | E2.3 |
| E2.6 | Tax Compliance | `NOT STARTED` | 0/0 | E2.3 |
| E2.7 | Trust & Safety | `NOT STARTED` | 0/0 | E0.3 |
| E2.8 | Admin Panel (Next.js /admin) | `NOT STARTED` | 0/0 | E2.2, E2.3 |
| E2.9 | Notifications (full) | `NOT STARTED` | 0/0 | E1.9 |
| E2.10 | Web (minimal) | `NOT STARTED` | 0/0 | E1.6, E1.2 |
| E2.11 | DPDPA & Legal | `NOT STARTED` | 0/0 | E0.3 |

---

## Pre-Coding Deliverables

| Deliverable | Status | File |
|-------------|--------|------|
| CLAUDE.md (root) | `DONE` | `CLAUDE.md` |
| HLD | `DONE` | `docs/engineering/HLD.md` |
| OpenAPI Spec (M0) | `DONE` | `docs/engineering/openapi.yaml` |
| E0.1 Task Breakdown | `DONE` | `docs/epics/E0.1-repo-infra/tasks.md` |
| E0.2 Task Breakdown | `DONE` | `docs/epics/E0.2-database-schema/tasks.md` |
| E0.3 Task Breakdown | `DONE` | `docs/epics/E0.3-authentication/tasks.md` |
| E0.4 Task Breakdown | `DONE` | `docs/epics/E0.4-design-system/tasks.md` |
| E0.5 Task Breakdown | `DONE` | `docs/epics/E0.5-onboarding/tasks.md` |

---

## Milestone Gates

### M0 Gate (Week 2)
- [ ] `pnpm dev` boots all apps
- [ ] CI passes (lint + typecheck + test)
- [ ] Phone OTP sign-up works e2e
- [ ] Guest browsing + soft auth wall works
- [ ] Schema deployed, cities seeded (~4000)
- [ ] Design system components render
- [ ] Onboarding completes in < 60s

### M1 Gate (Week 6)
- [ ] All 4 content types creatable (free)
- [ ] Home feed shows real content (section-based)
- [ ] Studio tab, profiles, social features work
- [ ] Push notifications fire
- [ ] p95 API read < 400ms
- [ ] Alpha builds on TestFlight + internal APK

### M2 Gate (Week 12)
- [ ] Paid booking e2e: create → book → pay → complete → payout
- [ ] KYC flow complete with admin review
- [ ] GST + TDS calculated correctly
- [ ] Refund flow works (3 policies)
- [ ] Reviews: blind, 14-day reveal
- [ ] Trust & safety: report + moderation queue
- [ ] Account deletion + data export
- [ ] Web SEO pages live
- [ ] App Store/Play Store submitted
