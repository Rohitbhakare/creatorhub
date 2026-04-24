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
| T12 | Deprecate old `feed_content_card.dart`                               | `[~]` Partial | Rails migrated: [near_you_section.dart](../../../apps/mobile/lib/features/feed/widgets/near_you_section.dart), [vertical_section.dart](../../../apps/mobile/lib/features/feed/widgets/vertical_section.dart) now use `ContentCard.rail`. `FeedRailCard` kept for the grid screen ([vertical_section_full_screen.dart](../../../apps/mobile/lib/features/feed/screens/vertical_section_full_screen.dart)) — grid needs a taller childAspectRatio + no-horizontal-padding card variant, tracked as next polish pass. `DiscoverCreatorCard` stays. |
| T13 | Empty states for Following + For-you                                 | `[x]` Done  | `_EmptyState` widget in `home_feed_screen.dart`; Following tab shows "Your follows live here" with subtitle. |
| T14 | Widget tests for new components                                      | `[x]` Partial | `home_feed_screen_test.dart` rewritten for new design (10 tests covering tab switching, hero, empty states, section rendering). Individual `ContentCard` / `HeroCard` / `SegmentedTabs` widget tests left for a hardening pass. |
| T15 | Integration test — navigate through tabs                             | `[ ]` Deferred | Patrol E2E addition pending next screenshot-parity session. |
| T16 | Screenshot parity captures                                           | `[ ]` Deferred | Awaiting Xcode/simulator pass — run manually via `scripts/take_screenshots.sh`. |
| T17 | Update `docs/engineering/openapi.yaml`                               | `[x]` Done  | Added `Feed` tag, 6 path entries (`/feed/for-you`, `/feed/following`, `/feed/near-you`, `/feed/hero`, `/feed/vertical/{vertical}`, `/feed/discover`), and schemas `FeedCreator`, `FeedContentItem`, `NearYouResult`, `DiscoverCreator` + 4 SuccessResponse wrappers. Spec parses with pyyaml; refs resolved. |
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

---

## Addendum · Card v2 refresh · 2026-04-24

Spec-driven rewrite of `ContentCard` to a single shared component across all home-feed surfaces (For-you, Following, Near-you, rails, See-all). Resolves T12 (legacy `FeedRailCard` removed) and T14's "individual widget tests for `ContentCard`" bullet. Ships in two PRs — backend work blocks the chip row.

### PR 1 — card shell (this PR)

| ID  | Task                                                                 | Status     | Notes |
|-----|----------------------------------------------------------------------|------------|-------|
| CV1 | Rewrite `ContentCard` — two variants (`grid`, `rail`), both 4:5 portrait, 12dp radius; category tag (top-left w/ duration for itineraries), save toggle (top-right, coral fill when saved), price pill (bottom-right, paid only), title (14/500 2-line), creator row (avatar + short name + likes) | `[x]` Done | [content_card.dart](../../../apps/mobile/lib/features/feed/widgets/content_card.dart). Replaces legacy `ContentCardVariant.vertical` entirely. |
| CV2 | Switch home-feed **For-you** + **Following** bodies from single-col to 2-col `GridView` (mix of 2-col grid + horizontal rails per founder ask) | `[x]` Done | [home_feed_screen.dart](../../../apps/mobile/lib/features/feed/screens/home_feed_screen.dart) `_FeedGrid` + `_FeedGridSkeleton`. `childAspectRatio: 0.62` leaves room for title + creator row under 4:5 cover. |
| CV3 | Migrate rails — `VerticalSection` + `NearYouSection` to new `ContentCard.rail` (170dp, 4:5, skeleton rewritten to match) | `[x]` Done | [vertical_section.dart](../../../apps/mobile/lib/features/feed/widgets/vertical_section.dart), [near_you_section.dart](../../../apps/mobile/lib/features/feed/widgets/near_you_section.dart). |
| CV4 | Migrate "See all" full-screen grid from `FeedRailCard` to `ContentCard.grid` | `[x]` Done | [vertical_section_full_screen.dart](../../../apps/mobile/lib/features/feed/screens/vertical_section_full_screen.dart). |
| CV5 | Delete legacy `FeedRailCard` + helpers (`_CreatorInitial`, `_TypePill`) from [feed_content_card.dart](../../../apps/mobile/lib/features/feed/widgets/feed_content_card.dart); keep `DiscoverCreatorCard` (still used by Discover rail) | `[x]` Done | No call sites remain (verified via grep). |
| CV6 | Add helpers: `formatDurationCompact(min) → "7d" / "3h" / "45m"` and `shortAuthorName(displayName, username)` with `@`-handle fallback | `[x]` Done | [format.dart](../../../apps/mobile/lib/shared/utils/format.dart). |
| CV7 | Widget tests for `ContentCard` — category tag per content type, paid vs free price pill, long-title ellipsis, short-name derivation, zero-likes hidden state, guest save-toggle flips to coral, rail width enforcement, coral token sanity check | `[x]` Done | [content_card_test.dart](../../../apps/mobile/test/features/feed/widgets/content_card_test.dart) — 15 tests. |
| CV8 | Unit tests for new helpers | `[x]` Done | [format_test.dart](../../../apps/mobile/test/shared/utils/format_test.dart) — 10 tests. |
| CV9 | `flutter analyze lib/features/feed` = 0 issues; full `flutter analyze` reports only pre-existing studio infos | `[x]` Done | No new issues introduced. |
| CV10 | `flutter test` — 249 passing | `[x]` Done | |
| CV11 | Update SRS (DISC-FR-023a added) + this tracking addendum | `[x]` Done | [srs-v1.2.md](../../00_SRS/v1.2/srs-v1.2.md) anchor `DISC-FR-023a`. |

### PR 2 — row-2 context chips (full scope, 2026-04-24)

Shipped in a single PR covering shared foundations, backend projection + facets write path, mobile capture UI in 3 wizards, and mobile chip rendering on `ContentCard`.

**Locked enums** (see SRS DISC-FR-023a for full spec):
- `season`: `spring | summer | monsoon | autumn | winter | year_round`
- `trip_style`: `adventure | chill | cultural | nightlife | wellness | foodie | offbeat`
- `audience`: `solo | couple | family | friends | group`
- `budget_tier` (derived): `free | ₹ | ₹₹ | ₹₹₹ | ₹₹₹₹` at thresholds `<₹1k / <₹2.5k / <₹5k / ≥₹5k`

| ID  | Task | Status | Notes |
|-----|------|--------|-------|
| CV12 | Shared Zod + TS foundation: `SEASONS`/`TRIP_STYLES`/`AUDIENCES`/`BUDGET_TIERS` constants, `ContentFacets` + `FeedTags` types, `facetsSchema` wired into `updateItinerarySchema` + `updateEventSchema`, `toBudgetTier` / `readTimeMinFromBody` utils | `[x]` Done | [constants/index.ts](../../../packages/shared/src/constants/index.ts), [schemas/index.ts](../../../packages/shared/src/schemas/index.ts), [utils/discoverability.ts](../../../packages/shared/src/utils/discoverability.ts). 7 unit tests, 0 tsc errors. |
| CV13 | API facets write path — merge `facets` into content row on all 3 update endpoints | `[x]` Done | [event.service.ts](../../../apps/api/src/services/event.service.ts), [experience.service.ts](../../../apps/api/src/services/experience.service.ts) + [handlers/experiences.ts](../../../apps/api/src/handlers/experiences.ts) with `facetsSchema.parse` at the boundary, itinerary flows via `updateItinerarySchema` spread. No migration needed — `content.facets jsonb` already exists from 005. |
| CV14 | API feed projection — `tags: FeedTags` on every `FeedContentItem` across all 5 projection queries (`getPopularAcrossIndia`, `getVerticalSection`, `getForYouSection`×2, `getFollowingSection`) + batched `cities` join for `location_label`. Derivations: `budget_tier` via `toBudgetTier` (null for posts); `read_time_min` from body for posts, from `duration_minutes` for itineraries, null elsewhere. Defensive enum re-check on `facets` JSONB at projection time. | `[x]` Done | [feed.service.ts](../../../apps/api/src/services/feed.service.ts). `attachCreators` collapsed into `enrichItems` (single-pass users + cities batch). Incidental fix: `getFollowingSection` was missing `published_at` in its select — added. |
| CV15 | Mobile capture UI — shared `DiscoverabilityBlock` widget + `kSeasons/kTripStyles/kAudiences` constants, wired into Itinerary (`trip_overview_step.dart`), Event (`event_details_step.dart`), Experience (`create_experience_wizard.dart → _BasicsStep`). All 3 PATCH paths emit `facets: { season, trip_style, audience }` snake_case with null-omission. Sentinel-based `copyWith` so `setX(null)` clears cleanly. DD-013 respected (ink-on-surfaceAlt, no coral). | `[x]` Done | [discoverability_block.dart](../../../apps/mobile/lib/features/content/widgets/discoverability_block.dart), [wizard_provider.dart](../../../apps/mobile/lib/features/content/providers/wizard_provider.dart), [draft_auto_save_service.dart](../../../apps/mobile/lib/features/content/services/draft_auto_save_service.dart), [experience_provider.dart](../../../apps/mobile/lib/features/experiences/providers/experience_provider.dart). |
| CV16 | Mobile card chips — `FeedTags` model + `tags` field on `FeedContentItem`, row-2 chip row on `ContentCard` below creator row with per-type slotting (Post: Location · Xm read · Audience; Itinerary: Season · Style · Budget [drops `free`]; Experience: Season · Style · Budget [shows "Free"]; Event: Location · Audience · Budget). Row collapses when all 3 slots are null. **Rendered in `grid` variant only** — rail variant (170×280) overflows by ~30px with the chip row, and rails are intentionally info-lean. | `[x]` Done | [feed_models.dart](../../../apps/mobile/lib/features/feed/models/feed_models.dart), [content_card.dart](../../../apps/mobile/lib/features/feed/widgets/content_card.dart). Caught in `flutter run` boot: `RenderFlex overflowed by 30 pixels` on rail cards. Gate added at the `build()` entry. |
| CV17 | Tests — 7 shared util tests; 8 new `feed.service.test.ts` cases (budget bucketing, cities join, garbage-facets rejection, per-type read-time); 20 mobile capture tests (3 wizard-provider files + `DiscoverabilityBlock` widget); 12 mobile card tests (6 row-2 chip cases + 6 FeedTags/FeedContentItem model cases) | `[x]` Done | API: 35 feed tests pass, **1002/1002** full suite green. Mobile: **281/281** full suite green. |
| CV18 | Analyzer / typecheck clean — `pnpm tsc --noEmit` (api + shared) 0 errors; `flutter analyze` no new issues (54 baseline, all pre-existing in studio/kyc/profile/saved) | `[x]` Done | |
| CV19 | Docs — SRS DISC-FR-023a extended with row-2 chip rules + `tags` wire shape; this addendum updated with final task table. | `[x]` Done | [srs-v1.2.md](../../00_SRS/v1.2/srs-v1.2.md) · DISC-FR-023a. |

### Known follow-ups (deferred — not blockers)

- **Draft hydration for facets.** Wizards don't currently re-read a prior server draft on open — so there's nothing to wire facets into on the load path yet. When draft hydration lands, hit the three `setX(serverValue)` setters.
- **Near-you RPC path.** `feed_near_you` is a stored procedure, not one of the 5 Supabase-client queries. Its rows get a valid `tags` object with mostly-null fields (facets/body/duration_minutes aren't selected by the RPC). A future migration can extend the RPC return shape if needed.
- **Minor linter rot.** One pre-existing `prefer_const_declarations` info in [content_card_test.dart:128](../../../apps/mobile/test/features/feed/widgets/content_card_test.dart#L128) carried over from PR 1 — not introduced by PR 2, not in any touched file's lib/ path.
