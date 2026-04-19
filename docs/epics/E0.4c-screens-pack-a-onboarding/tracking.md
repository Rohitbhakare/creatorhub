# E0.4c — Tracking

**Status:** APPROVED — ready to start T0
**Progress:** 0/11 tasks
**Branch:** `dev`
**Last Updated:** 2026-04-19

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T0 | Shared primitives gap-fill (Steps, Toggle, Chip, Button variants, AppHeader audit) | `[ ]` | Audit first, add only what's missing |
| T1 | A1 Welcome screen rewrite | `[ ]` | **Coral gradient hero** (no photo asset per Q2) |
| T2 | A2 Phone sign-in rewrite | `[ ]` | Country chip + phone + Send code + social buttons |
| T3 | A2b OTP verify rewrite | `[ ]` | 6 digit boxes + resend + **WhatsApp button disabled** (per Q4) |
| T3a | **A2c Profile bootstrap (NEW)** | `[ ]` | Step 1 of 5; username (unique) + firstName + email (optional + verify code); OAuth prefill; adds 4 fields to OnboardingProvider; router update; may add SRS clause + 2–4 API endpoints |
| T4 | A3 Location screen rewrite | `[ ]` | Search + city chips + precise-location toggle |
| T5 | A4 Verticals rewrite | `[ ]` | 2×4 SelectionTile grid + min-3 counter |
| T6 | A5 Creators rewrite | `[ ]` | Row list + Follow/Following + Skip/Continue |
| T7 | A6 Celebrate rewrite | `[ ]` | Binds firstName; **couples "Today's read" to real recommendation source** (per Q5) |
| T8 | A7 SoftAuthSheet new widget + **all 5 triggers** | `[ ]` | save / follow / book / comment / like (per Q3) |
| T9 | iOS boot + 4-step review gate + commit to dev | `[ ]` | Per pre-commit checklist |

---

## Founder decisions (resolved 2026-04-19)

| # | Question | Answer |
|---|----------|--------|
| Q1 | A6 first-name source | Add name-capture step A2c after signup; bind A6 to onboarding state |
| Q2 | A1 hero photo source | **Coral gradient placeholder** (no photo asset) |
| Q3 | A7 triggers in v1 | **All 5** guest-gated actions (save / follow / book / comment / like) |
| Q4 | WhatsApp OTP button | **Disabled for now**, add to backlog |
| Q5 | A6 "Today's read" card | **Couple now** to real recommendation source |
| Q6 | SoftAuthSheet location | `lib/features/auth/widgets/soft_auth_sheet.dart` |

---

## Review Gate (to be filled at T9)

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[ ]` | |
| Security | `[ ]` | |
| Architecture | `[ ]` | |
| Code Quality | `[ ]` | |

---

## Pre-commit checklist (per `.claude/instructions/precommit.md`)

- [ ] `flutter analyze` — 0 new issues
- [ ] `flutter test` — all green
- [ ] `pnpm test` in `apps/api` — unchanged, re-verified
- [ ] `tsc --noEmit` — depends on A2c (may touch profile PATCH if endpoint exists)
- [ ] iOS simulator cold boot — A1 → A2c → A3 → A4 → A5 → A6 completes; A7 triggers from save/follow/book/comment/like
- [ ] 4-step review gate — all four steps passed

---

## Backlog items spawned by this epic

1. **WhatsApp OTP via MSG91** — A2b button is rendered disabled. Wire real delivery when MSG91 WhatsApp template is configured.
2. **Cut-(c) SelectionTile migration** (from E0.4b) — 6 surfaces still pending.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-19 | Epic drafted. 6 open questions queued. |
| 2026-04-19 | Founder answered all 6 questions. Scope grows by one screen (A2c Name) and one feed-coupling point (A6). Tasks + plan updated. Ready to start T0. |
