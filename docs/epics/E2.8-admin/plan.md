# E2.8 — Admin Panel (Retool)

> **SRS refs:** ADM-FR-001–005, ADM-FR-008, ADM-FR-011
> **Depends on:** E2.2 (KYC review), E2.3 (payouts), E2.7 (moderation queue)
> **Platform:** Retool (no custom UI in MVP — ADM-FR-006/007 are V2)

---

## Market Research — Admin Panel Patterns

### Retool (our chosen tool)
- **Rapid build:** Drag-and-drop UI connected directly to Supabase. SQL queries as data sources.
- **Auth:** Retool's built-in RBAC. No need to build our own admin auth for MVP.
- **Pattern:** Each module is a Retool "app" — user search, KYC review, moderation, payouts.

### CreatorHub Approach
- **No custom admin UI in MVP.** All admin operations via Retool apps connected to Supabase.
- **API endpoints:** Some admin operations need API endpoints (approve KYC, trigger payout) — these are built in their respective epics (E2.2, E2.3). Retool calls these endpoints.
- **Audit logging:** Every admin action writes to `audit_log` table via API.

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Admin auth middleware (requireAdmin role check) | API | ~4 |
| T2 | Admin user search endpoint (by phone/email/username, view profile + KYC + bookings) | API | ~6 |
| T3 | Content takedown endpoint (soft-delete with reason + audit log) | API | ~5 |
| T4 | Feature/unfeature endpoint (users.featured, content.featured toggle) | API | ~4 |
| T5 | Audit log service (write, query by actor/action/target) | API | ~5 |
| T6 | Retool app: User Search & View | Retool | — |
| T7 | Retool app: KYC Review Queue (approve/reject with reasons) | Retool | — |
| T8 | Retool app: Moderation Queue (reports, takedown actions) | Retool | — |
| T9 | Retool app: Payout Run (trigger pending payouts) | Retool | — |
| T10 | Retool app: Manual Refund | Retool | — |
| T11 | API tests | API | ~24 total |

**Estimated total: ~24 API tests**

## Definition of Done

- [ ] Admin endpoints: user search, takedown, feature/unfeature, audit log
- [ ] requireAdmin middleware
- [ ] 5 Retool apps connected and working
- [ ] All admin actions audit-logged
- [ ] ~24 API tests passing
