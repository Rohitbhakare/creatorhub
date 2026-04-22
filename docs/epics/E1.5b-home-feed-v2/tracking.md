# E1.5b — Home Feed v2 (Tracking)

> Canonical plan: [plan.md](plan.md). Wireframe diff this resolves: [E1.5 wireframe-diff.md](../E1.5-home-feed/wireframe-diff.md).
> Start: 2026-04-22.

## Tasks

| ID  | Task                                                                 | Status      | Notes |
|-----|----------------------------------------------------------------------|-------------|-------|
| T1  | `GET /api/v1/feed/for-you` handler + route                           | `[x]` Done  | [feed.routes.ts](../../../apps/api/src/routes/feed.routes.ts), `authenticate` middleware |
| T2  | `GET /api/v1/feed/following` handler + route                         | `[x]` Done  | same file |
| T3  | `GET /api/v1/feed/hero?tab=…` handler + route                        | `[x]` Done  | validates tab against `HeroTab` union |
| T4  | Service fns: `getForYouSection`, `getFollowingSection`, `getHeroForTab` | `[x]` Done | [feed.service.ts](../../../apps/api/src/services/feed.service.ts). Extended `FeedContentItem` with `comment_count`, `duration_minutes`, `published_at`. |
| T5  | Unit tests for new service fns                                       | `[x]` Done  | 9 new tests in `feed.service.test.ts` (26 total, 850 passing) |
| T6  | `ContentCard` widget (rail + vertical variants)                      | `[x]` Done  | [content_card.dart](../../../apps/mobile/lib/features/feed/widgets/content_card.dart). No border, 1:1 rail / 3:2 vertical, scale+haptic on press. |
| T7  | `HeroCard` widget (220h photo overlay)                               | `[x]` Done  | [hero_card.dart](../../../apps/mobile/lib/features/feed/widgets/hero_card.dart). Coral eyebrow, bottom-scrim title, Fraunces 22 white. |
| T8  | `SegmentedTabs` component                                            | `[x]` Done  | [segmented_tabs.dart](../../../apps/mobile/lib/features/feed/widgets/segmented_tabs.dart). 3-up pill track, ink-filled active. |
| T9  | Rewrite `home_feed_screen.dart`                                      | `[x]` Done  | Location chip + bell top bar, segmented tabs, tab-aware hero + body. |
| T10 | Providers: `forYouProvider`, `followingProvider`, `heroProvider`     | `[x]` Done  | All 3 under `features/feed/providers/`. |
| T11 | `timeAgo(DateTime)` formatter                                        | `[x]` Done  | Already existed as `formatTimeAgo` in `shared/utils/format.dart`. |
| T12 | Deprecate old `feed_content_card.dart`                               | `[ ]` Partial | `FeedRailCard` still used by `near_you_section.dart` + `vertical_section.dart`; migrating those to `ContentCard.rail` is left for a follow-up to keep this epic scoped. `DiscoverCreatorCard` stays (different component). |
| T13 | Empty states for Following + For-you                                 | `[x]` Done  | `_EmptyState` widget in `home_feed_screen.dart`; Following tab shows "Your follows live here" with subtitle. |
| T14 | Widget tests for new components                                      | `[x]` Partial | `home_feed_screen_test.dart` rewritten for new design (10 tests covering tab switching, hero, empty states, section rendering). Individual `ContentCard` / `HeroCard` / `SegmentedTabs` widget tests left for a hardening pass. |
| T15 | Integration test — navigate through tabs                             | `[ ]` Deferred | Patrol E2E addition pending next screenshot-parity session. |
| T16 | Screenshot parity captures                                           | `[ ]` Deferred | Awaiting Xcode/simulator pass — run manually via `scripts/take_screenshots.sh`. |
| T17 | Update `docs/engineering/openapi.yaml`                               | `[ ]` Deferred | Existing feed endpoints are not yet in the spec; handle the three new endpoints together in a feed-spec-sync pass. |
| T18 | Fill this tracking file                                              | `[x]` Done  | this document |
| T19 | Mark E1.5 wireframe-diff P0.1–P0.4 resolved                          | `[x]` Done  | See update below in [wireframe-diff.md](../E1.5-home-feed/wireframe-diff.md). |

## Risks observed during build

- **R1 (confirmed)** — Supabase-JS `select(…, follows!inner(…))` types don't always expose the index signature TS needs. Resolved with `as unknown as Array<…>` casts in `getForYouSection` / `getFollowingSection`. Tests cover the happy + empty + error paths.
- **R2** — Hero endpoint fires a full section query per tab switch. Acceptable for MVP (3 tabs, 20-item limit) but we'll want a small in-memory TTL if taps get chatty under real traffic.
- **R3** — `duration_minutes` is optional across content types (posts don't have it). Cards omit the chip when null.

## Pre-Commit Checklist

| Check                                | Status | Notes |
|--------------------------------------|--------|-------|
| API unit tests pass                  | `[x]`  | `pnpm test` → 850 passed |
| TypeScript 0 errors                  | `[x]`  | `pnpm typecheck` clean |
| Flutter tests pass                   | `[x]`  | `flutter test` → 223 passed |
| Dart analyze (feed module)           | `[x]`  | `flutter analyze lib/features/feed` → 0 issues |
| Dart analyze (repo-wide)             | `[~]`  | 53 pre-existing infos in studio/* — none introduced by this epic |
| Edge case review                     | `[x]`  | Empty hero hides; empty for-you → popular fallback; follow-nobody → empty state |
| Security review                      | `[x]`  | All three new endpoints `authenticate`-guarded; service fns never log PII |
| Architecture review                  | `[x]`  | route → handler (thin) → service (logic); Riverpod Notifier unchanged |
| Code quality review                  | `[x]`  | No unused imports; no TODOs; no hardcoded strings |
| API boots (`/healthz`)               | `[ ]`  | Run manually before merge |
| Flutter launches                     | `[ ]`  | Run manually on device before merge |
| Screenshot parity (Home tab × 3)     | `[ ]`  | Capture For-you / Following / Near-you per precommit step 6 before merge |
| Tracking file updated                | `[x]`  | this file |

## What's next (outside this epic)

- T12 completion — swap `FeedRailCard` → `ContentCard.rail` in `near_you_section.dart` + `vertical_section.dart`. Small, self-contained.
- T14 hardening — individual widget tests for `ContentCard` variants, `HeroCard` eyebrow text, `SegmentedTabs` selection callback.
- T15 Patrol flow — `tapSegmentedTab` helper + assertion that tab-switch re-renders hero.
- T16 screenshot parity — run `scripts/take_screenshots.sh` on iOS sim, attach to this tracking file, confirm visual diff vs. pack-b-discover `S_Home`.
- T17 feed-spec-sync — add `/feed/near-you`, `/feed/vertical/{vertical}`, `/feed/discover`, `/feed/for-you`, `/feed/following`, `/feed/hero` to `openapi.yaml` in one PR.
