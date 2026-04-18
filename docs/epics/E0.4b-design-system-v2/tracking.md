# E0.4b — Tracking

**Status:** IN REVIEW (code complete, pre-commit + commit pending)
**Progress:** 12/13 tasks (T13 commit is the remaining step)
**Branch:** `dev`
**Last Updated:** 2026-04-18

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | SRS clauses C-25, C-26, C-27, C-28 | `[x]` | Added to `docs/00_SRS/v1.2/srs-v1.2.md` after C-24 |
| T2 | `colors.dart` rewrite | `[x]` | New tokens + `cardRaisedShadow`, `bottomNavTopShadow`, `fabGlowShadow` consts |
| T3 | Repo-wide rename pass (8 tokens) | `[x]` | Perl pass across `lib/` + `test/`; ordered (softInk before muted; surface before white) |
| T4 | `app_theme.dart` ThemeData refresh | `[x]` | Wired to new tokens |
| T5 | `AppCard` primitive | `[x]` | `shared/components/card.dart` — raised default (C-27) + flat variant |
| T6 | `SelectionTile` primitive | `[x]` | `shared/components/selection_tile.dart` — rest vs. selected per C-26; 18dp coral check badge; HapticFeedback; disabled state at 0.4 opacity |
| T7 | `MainShell` BottomNav rewrite | `[x]` | 68dp bar, 5 slots, 52dp coral Create FAB with `fabGlowShadow`, coral-tint active pill, top-edge shadow |
| T8 | `VerticalPicker` migration to `SelectionTile` | `[x]` | `_VerticalTile` now delegates to `SelectionTile(axis: vertical)` |
| T9 | `AppInput` readOnly verification | `[x]` | `readOnly ?? (controller == null && onChanged == null)` default |
| T10 | Widget tests for new primitives | `[x]` | 3 (AppCard) + 4 (SelectionTile) + 5 (MainShell) = 12 new tests |
| T11 | `flutter analyze` + `flutter test` | `[x]` | 102/102 tests pass; 0 new analyzer issues; 57 pre-existing info-level issues from E3.1 / unrelated files |
| T12 | Cut-(c) follow-up issue filed | `[x]` | Logged below under **Follow-up (Cut c)** |
| T13 | Boot verification + commit to `dev` | `[ ]` | iOS simulator boot + 4-step review gate + commit — next step |

---

## Follow-up (Cut c) — filed here until a ticket system is chosen

Six selection surfaces still use ad-hoc tile code and must be migrated to `SelectionTile` in a later PR:

1. **Create sheet** — content-kind picker (post / itinerary / event / experience)
2. **Discover filter sheet** — multi-select chip group
3. **Publish wizard** — content-kind picker + tag chips (`CRT-FR-017`)
4. **KYC intro** — doc-type picker (`KYC-FR-008`)
5. **Booking pay-method picker** — UPI / saved card / new card (`BKG-FR-007`)
6. **Onboarding suggested creators** — selectable creator cards (audit whether they qualify as selection tiles)

Acceptance: zero dark-fill selected states remain across these surfaces; all call into `SelectionTile` or a variant of it.

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[ ]` Not Run | |
| Security | `[ ]` Not Run | Touches only UI tokens + local widgets; no auth/data paths |
| Architecture | `[ ]` Not Run | |
| Code Quality | `[ ]` Not Run | |

---

## Pre-commit checklist (per `.claude/instructions/precommit.md`)

- [x] `flutter analyze` — 0 new issues (57 pre-existing info-level hits remain in `studio_tab_screen.dart`, `kyc_wizard_screen.dart`, E3.1 integration files — unchanged by this epic)
- [x] `flutter test` — 102/102 green (13 new tests added for C-26/C-27/C-28)
- [x] `pnpm test` in `apps/api` — not touched by this epic (UI only)
- [x] `tsc --noEmit` — not touched (UI only)
- [ ] iOS simulator cold boot — no runtime crashes, onboarding vertical picker and BottomNav render
- [ ] 4-step review gate run

---

## Test evidence

```
flutter test test/shared/components/card_test.dart \
             test/shared/components/selection_tile_test.dart \
             test/app/main_shell_test.dart
00:02 +13: All tests passed!

flutter test
00:05 +102: All tests passed!

flutter analyze
57 issues found. (all pre-existing; 0 introduced by E0.4b)
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-18 | Epic created. Plan, tasks, tracking drafted. 13 tasks defined. |
| 2026-04-18 | T1–T12 complete. Code + tests landed, full suite green, analyzer clean for new code. Awaiting boot verification + review gate + commit. |
