# E0.5 — Onboarding

## Overview
Build the 5-step onboarding flow: welcome screen → phone OTP → location capture (GPS or manual city picker) → vertical interests (≥3 of 8) → suggested creators → celebration + first feed. This is the critical first-impression experience — must complete in ≤60 seconds.

## SRS Requirements
- ONB-FR-001 (Welcome screen with 3 entry paths)
- ONB-FR-002 (Location capture: GPS or manual city search)
- ONB-FR-003 (Vertical interests: minimum 3 of 8)
- ONB-FR-004 (Follow suggested creators: skippable)
- ONB-FR-005 (Milestone celebration + first feed)
- ONB-FR-007 (Honest live creator counts per vertical)
- ONB-FR-008 (Waitlist signal on low-content verticals)
- ONB-FR-010 (All ~4000 cities equally valid)
- ONB-FR-011 (5-segment progress bar)

## Dependencies
- E0.1 (monorepo scaffold)
- E0.2 (cities table seeded, user_active_verticals, user_waitlisted_verticals tables)
- E0.3 (auth flow — OTP screen precedes onboarding)
- E0.4 (design system — all widgets used in onboarding)

## Architecture Decisions
- Onboarding state managed via Riverpod (onboarding progress provider)
- GoRouter redirect guard: if `onboarding_completed_at` is null, redirect to onboarding
- City search uses fuzzy match on `cities` table (no tier filtering per DD-009)
- Celebration animation: Lottie file, auto-dismiss after 2 seconds
- First feed after onboarding shows onboarding-tasks card

## Deliverables
1. Welcome screen (sign up / sign in / browse as guest)
2. Location capture screen (GPS permission + manual city picker)
3. City search with fuzzy matching (~4000 cities)
4. Vertical picker screen (8 verticals with live creator counts)
5. Waitlist recording for low-content verticals
6. Suggested creators screen (personalized by verticals, skippable)
7. Celebration screen (Lottie animation, auto-dismiss)
8. 5-segment progress bar component
9. Onboarding API endpoints (location, verticals, complete)
10. GoRouter guard for incomplete onboarding
