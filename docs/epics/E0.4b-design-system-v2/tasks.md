# E0.4b — Tasks

| ID | Task | Owner | Estimate |
|----|------|-------|----------|
| T1 | Add SRS clauses C-25, C-26, C-27, C-28 to `docs/00_SRS/v1.2/srs-v1.2.md` | claude | S |
| T2 | Rewrite `shared/theme/colors.dart` with new token names and hex values | claude | S |
| T3 | Rename-propagation pass across `lib/` and `test/` for all 8 renamed tokens | claude | M |
| T4 | Update `shared/theme/app_theme.dart` ThemeData to new tokens | claude | S |
| T5 | Create `shared/components/card.dart` — `AppCard` with raised/flat variants | claude | S |
| T6 | Create `shared/components/selection_tile.dart` — SRS C-26 compliant tile | claude | M |
| T7 | Rewrite `app/main_shell.dart` BottomNav per SRS C-28 | claude | S |
| T8 | Migrate `features/onboarding/screens/vertical_picker_screen.dart` to `SelectionTile` | claude | S |
| T9 | Verify/document `AppInput` readOnly-when-no-onChange behaviour | claude | XS |
| T10 | Widget tests: `AppCard`, `SelectionTile`, `MainShell` BottomNav | claude | M |
| T11 | Run `flutter analyze` (must be clean) + `flutter test` (must pass) | claude | XS |
| T12 | File cut-(c) follow-up issue (6 surfaces: create sheet, filter sheet, publish kind picker, publish tag chips, KYC doc picker, booking pay picker) | claude | XS |
| T13 | Update `docs/epics/TRACKING.md` with E0.4b line | claude | XS |

**Total:** 13 tasks. Estimate keys — XS: <30 min, S: 30–60 min, M: 60–120 min.

## Pre-commit checklist (per `.claude/instructions/precommit.md`)
- [ ] `flutter analyze` — 0 issues
- [ ] `flutter test` — all green (existing 89 + new widget tests)
- [ ] `pnpm test` in `apps/api` — unaffected by this PR, should remain green
- [ ] `tsc --noEmit` — unaffected by this PR
- [ ] iOS simulator boot — no runtime crashes, onboarding vertical picker renders, BottomNav renders
- [ ] 4-step review gate — edge cases → security → architecture → code quality
- [ ] `TRACKING.md` updated
