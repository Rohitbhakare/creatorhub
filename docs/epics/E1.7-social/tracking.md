# E1.7 — Social — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E1.7 Social |
| Milestone | M1 |
| Status | `DONE` |
| Plan approved | `[x]` Yes |
| Implementation started | `[x]` Yes |
| Implementation complete | `[x]` Yes |
| Committed | `[x]` Yes — commit `dev` branch |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T1 | `social.service.ts` (follow/unfollow/getFollowers/getFollowing/like/unlike/share) | API | `DONE` | `[x]` 23/23 | `social.service.test.ts` |
| T2 | `comment.service.ts` (add/edit/delete/list with 1-level threading) | API | `DONE` | `[x]` 23/23 | `comment.service.test.ts` |
| T3 | `saved.service.ts` (getUserLists/createList/rename/delete/getListItems/save/unsave/status) | API | `DONE` | `[x]` 30/30 | `saved.service.test.ts` |
| T4 | `social.handlers.ts` (all 20 handler functions, validatedBody/validatedQuery) | API | `DONE` | — | |
| T5 | `social.routes.ts` (20 endpoints, auth middleware, Zod validation) | API | `DONE` | — | |
| T6 | Zod schemas (addComment, editComment, createList, renameList, save, unsave, share, listItemsQuery) | Shared | `DONE` | — | `packages/shared/src/schemas/` |
| T7 | Follow UI — `follow_provider.dart` (optimistic toggle, loading guard) wired into detail screens | Mobile | `DONE` | `[x]` flutter analyze 0 | |
| T8 | Like animation — `like_provider.dart` (optimistic count), heart tap with haptic in `EngagementBar` | Mobile | `DONE` | `[x]` | |
| T9 | Comment bottom sheet — `comments_provider.dart` + `comments_sheet.dart` (threaded replies, edit/delete own, char counter) | Mobile | `DONE` | `[x]` | |
| T10 | Saved lists screen — `saved_lists_screen.dart` (2-col grid) + `saved_list_detail_screen.dart` (filter/sort) | Mobile | `DONE` | `[x]` | |
| T11 | Save-to-list bottom sheet — `save_to_list_sheet.dart` (multi-select, inline create, optimistic state) | Mobile | `DONE` | `[x]` | |
| T12 | Share utils — `share_utils.dart` (WhatsApp deep link, native share via MethodChannel, copy link) | Mobile | `DONE` | `[x]` | |
| T13 | `EngagementBar` widget wired into post/itinerary/event detail screens; `/saved` + `/saved/:id` routes | Mobile | `DONE` | `[x]` | |

---

## Pre-Commit Checklist

- `[x]` All tests passing
- `[x]` `tsc --noEmit` — 0 errors
- `[x]` `flutter analyze` — 0 errors (0 warnings)
- `[x]` API boots — `/healthz` 200
- `[x]` Flutter launches — no crash
- `[x]` Tracking updated

---

## Test Coverage

| File | Tests | Passing |
|------|-------|---------|
| `apps/api/src/services/social.service.test.ts` | 23 | `[x]` 23/23 |
| `apps/api/src/services/comment.service.test.ts` | 23 | `[x]` 23/23 |
| `apps/api/src/services/saved.service.test.ts` | 30 | `[x]` 30/30 |

**Total: 76 API tests — all passing**

---

## Notes

- Riverpod 3.x family pattern: constructor injection, `build()` takes no args. Applied consistently across all providers.
- `save_status_provider` uses optimistic state to avoid round-trip latency on save/unsave toggle.
- `share_utils.dart` uses MethodChannel for native share sheet on iOS/Android; WhatsApp deep link as primary CTA.
