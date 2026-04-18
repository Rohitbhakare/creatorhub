# E0.4b — Design System v2 (Pure White + Coral)

## Overview
Promote the v2 visual language from the CreatorHub Redesign prototype into the Flutter codebase. The v2 direction — "Paper White + Coral" — locks coral `#E15A41` as the sole decorative accent, introduces an explicit elevation scale, formalises a selection-state pattern for all selectable tiles, and upgrades the bottom navigation with a coral-tint pill and elevated surface.

This epic covers Cut (b) of the migration:
- Token alignment + rename pass across the Flutter app.
- New shared primitives (`Card`, `SelectionTile`).
- `MainShell` BottomNav rewrite.
- Onboarding `VerticalPicker` migration to the new `SelectionTile`.

Cut (c) — the remaining five selection-tile surfaces (create sheet, discover filter, publish kind picker, KYC doc picker, booking pay-method picker) — is filed as a follow-up issue so this epic stays reviewable and does not race E1.5/E1.6.

## SRS Requirements
New clauses added to `docs/00_SRS/v1.2/srs-v1.2.md`:
- **C-25 · Sole decorative accent refinement** — coral is the only decorative colour; semantic hues only on functional states; no gradients or secondary accents.
- **C-26 · Selection state language** — rest = surface + hairlineStrong border + light shadow; selected = surface + coral border + coral-tint halo + coral icon + coral check badge.
- **C-27 · Card elevation default** — `Card` raised by default (layered shadow); flat opt-in for in-card info blocks.
- **C-28 · Bottom navigation v2** — 5 slots, coral-tint pill active indicator, 52dp coral FAB, elevated top shadow.

## Dependencies
- E0.4 Design System (tokens, typography, shared widgets) — DONE.
- E0.5 Onboarding (`VerticalPickerScreen` exists and will be migrated).

## Architecture Decisions
- **Token rename** (design-exact alignment, founder-approved):
  - `surface` (page bg) → `bg`
  - `white` (cards) → `surface`
  - `sunken` → `surfaceAlt`
  - new `surfaceSunk` (info blocks)
  - `border` → `hairline`
  - `line` → `hairlineStrong`
  - `softInk` (meta) → `inkMuted`
  - `muted` (secondary) → `inkSoft`
  - new `inkFaint` (disabled)
  - `ink` keeps name, hex shifts `#2C2823 → #16161A`
- Hex shifts: `bg #FAF7F4 → #F7F7F5`, `surfaceAlt #F2EEE8 → #F2F1EE`, `hairline #E5E0D7 → #E8E6E1`, `hairlineStrong #C9C3B6 → #D8D5CE`, `inkMuted #9C9689 → #7A7A82`, `inkSoft #6B6660 → #3A3A40`.
- **No compatibility shims.** Old token names removed in this PR — the rename is done cleanly in one pass.
- **New primitive `AppCard`** in `shared/components/card.dart` — raised default with layered shadow (`0 1 2 rgba(16,24,40,0.05), 0 1 4 rgba(16,24,40,0.04), 0 4 12 rgba(16,24,40,0.04)`), `flat` prop forces border-only.
- **New primitive `SelectionTile`** in `shared/components/selection_tile.dart` — encapsulates the SRS C-26 rest/selected language so downstream screens cannot re-invent it.
- **BottomNav** stays in `lib/app/main_shell.dart` (no file move) but is rebuilt to match C-28.
- **Input readOnly** — `AppInput` already accepts `readOnly`; Flutter's idiomatic pattern is `readOnly: onChanged == null` which the design spec's `readOnly={!onChange}` maps to. Verify and document; no new prop needed.

## Deliverables
1. `colors.dart` — token rename + hex alignment.
2. SRS v1.2 — clauses C-25, C-26, C-27, C-28.
3. Repo-wide rename of 1074 `AppColors.*` references across 77 files.
4. `shared/components/card.dart` — new `AppCard` primitive.
5. `shared/components/selection_tile.dart` — new `SelectionTile` primitive.
6. `app/main_shell.dart` — BottomNav rewrite.
7. `features/onboarding/screens/vertical_picker_screen.dart` — migrated to `SelectionTile`.
8. `app_theme.dart` — ThemeData updated to reflect new tokens (scaffold bg, card colour, divider colour).
9. Cut (c) follow-up issue filed in the epic tracking.

## Non-goals
- No new screens, routes, or IA changes.
- No migration of the five cut-(c) selection surfaces.
- No copy or illustration changes.
- No Snow / Bone / Ink Night theme implementation — Paper White only.

## Test strategy
- `flutter analyze` must pass with 0 errors and 0 warnings.
- `flutter test` must pass the existing suite (89 tests). The rename may touch test files that reference `AppColors.*`; those will be updated.
- Add widget tests for:
  - `SelectionTile` rest vs selected visual structure (border colour, shadow, check badge presence).
  - `AppCard` raised vs flat (shadow present / absent).
  - `MainShell` BottomNav — coral pill on active tab, FAB is 52dp, top shadow exists.
- Manual boot on iOS simulator: verify onboarding vertical picker renders with new tile and the app shell bottom nav renders the coral pill.

## Risks
- The rename pass is large (1074 touches). Mitigation: do it with mechanical Grep-based edits, one token at a time, and run `flutter analyze` after each step.
- Hex colour shifts are small but real — screenshot tests may drift. The project does not currently ship screenshot/golden tests, so this risk is cosmetic only.
- `AppColors.white` → `AppColors.surface` rename could be misread as a semantic change where `white` was specifically used for "on-coral text colour". Those usages remain correct because `surface = #FFFFFF` in Paper White.
