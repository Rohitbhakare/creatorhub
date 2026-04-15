# E1.7 — Social (Follow · Like · Comment · Save · Share)

> **SRS refs:** SOC-FR-001–011, DD-017, DD-019, DD-030
> **Wireframe refs:** Screen 11 (Saved tab), Screen 04b/c/d (detail engagement bars)
> **Depends on:** E0.2 (DB tables), E0.3 (auth), E1.1–E1.4 (content types), E1.6 (profiles)
> **Blocked by:** Nothing — all dependencies DONE

---

## Market Research — Social Feature UX Patterns

### Follow/Unfollow (Instagram, Twitter/X, Pinterest)
- **Instant feedback:** All major apps use optimistic UI — button state changes immediately on tap.
- **Button states:** Instagram uses "Follow" (blue fill) → "Following" (outline) → hold-to-unfollow confirmation. Twitter/X uses "Follow" (outline) → "Following" (fill) → hover reveals "Unfollow" (red). Pinterest uses "Follow" → "Unfollow" with a direct toggle.
- **Best practice for CreatorHub:** Use Instagram-style — "Follow" (coral fill) → "Following" (outline). No long-press — tapping "Following" shows a confirmation bottom sheet to prevent accidental unfollows. Optimistic count update (+1/-1) on the profile stats.

### Like (Instagram, Twitter/X, YouTube)
- **Gesture:** Instagram has double-tap on image + heart icon. Twitter/X has heart icon. YouTube has thumbs up/down.
- **Animation:** Instagram's heart burst animation is the gold standard — scales up, shows filled heart with particle burst, scales back.
- **CreatorHub approach:** Heart icon tap (SOC-FR-002 says "undo on double-tap"). Optimistic UI — heart fills coral immediately, count increments. Double-tap to unlike (matches SRS). Add a subtle scale animation on like (200ms scale to 1.3x → back to 1.0x).

### Comments (Instagram, YouTube, Reddit)
- **Threading:** Instagram supports 1 level of replies (matches SOC-FR-003). YouTube is flat with @mentions. Reddit has deep threading.
- **Input:** Fixed bottom input bar with avatar + "Add a comment..." hint. Keyboard pushes it up.
- **Moderation:** Instagram auto-hides offensive comments. YouTube holds for review.
- **CreatorHub approach:** One-level threading per SRS. Bottom-sheet comment view (like Instagram Reels comments). Input bar pinned to bottom with keyboard-aware padding. Rate limit: 10/min/user. Show comment count on engagement bar. Empty state with illustration.

### Save/Bookmark — Multi-List (Pinterest, Instagram, Google Maps)
- **Pinterest:** Best-in-class multi-list saves — tap save → board picker bottom sheet → can create new board inline. This is exactly what SRS DD-030 specifies.
- **Instagram:** Single "Save" to collections — later organize into collections. Less structured.
- **Google Maps:** Save to lists (Favorites, Want to go, Starred, custom).
- **CreatorHub approach (per SRS DD-030):** Pinterest-style. Tap bookmark → bottom sheet shows user's lists with checkboxes (multi-select). Pre-checked if item already in list. "Create new list" inline. Coral fill on checked items. Default list auto-created on first save ("My saved trips"). Bookmark icon renders filled coral on ALL surfaces when saved to ANY list.

### Share (WhatsApp first-class, Instagram, Twitter)
- **India market:** WhatsApp is the #1 share channel (>500M users in India). Must be first-class, not buried in generic share sheet.
- **Instagram:** Direct message + Stories share + copy link + share to other apps.
- **Twitter/X:** Retweet + Quote Tweet + Copy Link + Share via.
- **CreatorHub approach (per SRS DD-019):** Two buttons on every detail page: 1) Dedicated WhatsApp button (wa.me deep link with pre-filled text + canonical URL). 2) Generic share button (share_plus → native share sheet). Both use canonical SSR URL. Track share events server-side for analytics.

### Key UX Principles Applied
1. **Optimistic everywhere:** All social actions (follow, like, save) update UI instantly. Revert silently on server failure.
2. **Haptic feedback:** Every tap on follow/like/save/share triggers selectionClick haptic.
3. **Guest handling:** Save-to-local-storage, show soft auth wall when accumulating saves to sync.
4. **Count formatting:** Use `formatCount()` (1K, 1M) for large numbers.
5. **Empty states:** Custom illustration + CTA for empty comments, empty saved lists.

---

## Architecture Overview

### API Endpoints (to add to OpenAPI spec)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/users/:userId/follow` | Required | Follow user (idempotent) |
| DELETE | `/api/v1/users/:userId/follow` | Required | Unfollow user (idempotent) |
| POST | `/api/v1/content/:contentId/like` | Required | Like content (idempotent) |
| DELETE | `/api/v1/content/:contentId/like` | Required | Unlike content |
| GET | `/api/v1/content/:contentId/comments` | Optional | List comments (cursor paginated) |
| POST | `/api/v1/content/:contentId/comments` | Required | Add comment |
| PUT | `/api/v1/comments/:commentId` | Required | Edit own comment |
| DELETE | `/api/v1/comments/:commentId` | Required | Soft-delete own comment |
| GET | `/api/v1/saved-lists` | Required | List user's saved lists |
| POST | `/api/v1/saved-lists` | Required | Create new list |
| PUT | `/api/v1/saved-lists/:listId` | Required | Rename/update list |
| DELETE | `/api/v1/saved-lists/:listId` | Required | Delete list |
| GET | `/api/v1/saved-lists/:listId/items` | Required | List items in a list |
| POST | `/api/v1/content/:contentId/save` | Required | Save to list(s) — body: { list_ids: [] } |
| DELETE | `/api/v1/content/:contentId/save` | Required | Remove from list(s) — body: { list_ids: [] } |
| GET | `/api/v1/content/:contentId/save-status` | Required | Which lists contain this item |
| POST | `/api/v1/content/:contentId/share` | Optional | Record share event (analytics) |

### DB Tables (already exist in migration 007)

- `follows` (follower_id, following_id) — PK composite, self-follow CHECK
- `likes` (user_id, content_id) — PK composite
- `comments` (id, content_id, user_id, parent_id, body, is_edited, deleted_at)
- `saved_lists` (id, user_id, name, cover_content_id)
- `saved_list_items` (list_id, content_id) — PK composite
- `shares` (id, user_id?, content_id, platform)

### Counter Management

Counters use `increment_count()` function from migration 012. On follow/unfollow, update both `follower_count` on target and `following_count` on actor. On like/comment/save, update respective count on content table.

### Flutter State Management

- **Follow state:** Managed locally in profile providers. Optimistic toggle.
- **Like state:** Provider per content item. Optimistic toggle with animation.
- **Comment state:** Paginated list provider per content_id. Add inserts to top.
- **Save state:** Global provider tracking which lists contain which items. Bottom sheet for save-to-list.
- **Share:** No state needed — fire-and-forget to server, open WhatsApp/share sheet.

---

## Task Breakdown

### T1 · Follow service + handlers (API)
**Files:** `apps/api/src/services/social.service.ts`, `apps/api/src/handlers/social.ts`, `apps/api/src/routes/social.routes.ts`
**SRS:** SOC-FR-001

- `followUser(followerId, followingId)` — INSERT INTO follows, increment follower_count + following_count. Idempotent (ON CONFLICT DO NOTHING).
- `unfollowUser(followerId, followingId)` — DELETE FROM follows WHERE ..., decrement counts. Idempotent (affected rows check).
- `getFollowers(userId, cursor, limit)` — paginated followers list.
- `getFollowing(userId, cursor, limit)` — paginated following list.
- Handler validates UUID format, prevents self-follow (400).
- Mount routes: POST/DELETE `/api/v1/users/:userId/follow`, GET `/api/v1/users/:userId/followers`, GET `/api/v1/users/:userId/following`.

**Edge cases:**
- Self-follow → 400
- Follow already-followed → 200 (idempotent, no count change)
- Unfollow not-followed → 204 (idempotent, no count change)
- Non-existent user → 404
- Count update race condition → use increment_count() atomic function

**Tests:** ~15 tests

---

### T2 · Like service + handlers (API)
**Files:** `apps/api/src/services/social.service.ts` (add to same file), handlers, routes
**SRS:** SOC-FR-002

- `likeContent(userId, contentId)` — INSERT INTO likes, increment content.like_count. Idempotent.
- `unlikeContent(userId, contentId)` — DELETE FROM likes, decrement content.like_count. Idempotent.
- Handler validates content exists and is published.
- Routes: POST/DELETE `/api/v1/content/:contentId/like`.

**Edge cases:**
- Like non-existent or unpublished content → 404
- Like already-liked → 200 (idempotent)
- Unlike not-liked → 204 (idempotent)
- Guest → 401

**Tests:** ~8 tests

---

### T3 · Comment service + handlers (API)
**Files:** `apps/api/src/services/comment.service.ts`, handlers, routes
**SRS:** SOC-FR-003

- `addComment(userId, contentId, body, parentId?)` — INSERT, increment content.comment_count. Validate parentId belongs to same content. Max 500 chars.
- `editComment(userId, commentId, body)` — UPDATE, set is_edited=true. Only owner.
- `deleteComment(userId, commentId)` — Soft delete (deleted_at). Only owner. Decrement count.
- `listComments(contentId, cursor, limit)` — Paginated, ordered by created_at ASC. Include replies nested under parent. Exclude soft-deleted (show "Comment deleted" placeholder for parent with live replies).
- Rate limit: 10 comments/user/minute (via middleware or in-service check).

**Edge cases:**
- Reply to non-existent parent → 404
- Reply to a reply (depth > 1) → 422 "Only one level of threading allowed"
- Edit non-owned comment → 403
- Delete comment with replies → soft delete, show "[deleted]" placeholder
- Empty body or >500 chars → 400
- Comment on non-existent/unpublished content → 404

**Tests:** ~18 tests

---

### T4 · Saved lists service + handlers (API)
**Files:** `apps/api/src/services/saved.service.ts`, handlers, routes
**SRS:** SOC-FR-004, SOC-FR-008, SOC-FR-009, SOC-FR-010, SOC-FR-011

- `getUserLists(userId)` — SELECT saved_lists with item_count and first item cover.
- `createList(userId, name)` — INSERT. Auto-create "My saved trips" if first list (SOC-FR-011).
- `renameList(userId, listId, name)` — UPDATE. Owner check.
- `deleteList(userId, listId)` — DELETE CASCADE (removes items too). Owner check.
- `getListItems(userId, listId, sort, typeFilter, cursor, limit)` — Paginated items with content join. Sort: recently_added | oldest | a_z | price_asc | price_desc. Type filter: post | itinerary | event | experience.
- `saveToLists(userId, contentId, listIds[])` — INSERT INTO saved_list_items for each list. Auto-create default list if none exist. Increment content.save_count (only +1 regardless of how many lists — save_count tracks unique users, not list placements). Update cover_content_id on lists.
- `removeFromLists(userId, contentId, listIds[])` — DELETE FROM saved_list_items. Decrement save_count only if removed from ALL lists (user no longer has item saved anywhere).
- `getSaveStatus(userId, contentId)` — Returns which list_ids contain this content.
- `isContentSavedByUser(userId, contentId)` — Quick boolean check.

**Edge cases:**
- Save to non-existent list → 404
- Save to list owned by another user → 403
- Delete default "My saved trips" → allowed (it's not a system list)
- Save same content to same list twice → idempotent
- Remove from last list → revert bookmark icon + decrement save_count
- Content deleted → CASCADE removes from all lists
- Sort by price when mixed free/paid → free sorts as 0

**Tests:** ~20 tests

---

### T5 · Share tracking (API)
**Files:** Add to `apps/api/src/services/social.service.ts`
**SRS:** SOC-FR-005

- `recordShare(userId?, contentId, platform)` — INSERT INTO shares. userId nullable for guests.
- Route: POST `/api/v1/content/:contentId/share` (optionalAuthenticate).
- Body: `{ platform: 'whatsapp' | 'instagram' | 'twitter' | 'copy_link' | 'other' }`.

**Tests:** ~4 tests

---

### T6 · Follow/unfollow UI (Mobile)
**Files:** Update `profile_view_screen.dart`, create `apps/mobile/lib/features/social/providers/follow_provider.dart`
**SRS:** SOC-FR-001

- Wire Follow/Following button on ProfileViewScreen to call API.
- Optimistic toggle: tap "Follow" → immediately show "Following" (outline), fire POST to server, revert on failure.
- Update follower_count display optimistically (+1/-1).
- Confirmation sheet on "Following" tap: "Unfollow @username?" with "Cancel" + "Unfollow" buttons.
- Haptic feedback on toggle.

**Edge cases:**
- Network error during follow → revert button state silently
- Rapid double-tap → debounce (ignore second tap within 500ms)
- Follow from suggested creators (onboarding) already works via different provider — ensure no conflict

---

### T7 · Like UI + animation (Mobile)
**Files:** Update engagement bars in `post_detail_screen.dart`, `itinerary_detail_screen.dart`, `event_detail_screen.dart`. Create `apps/mobile/lib/features/social/providers/like_provider.dart`.
**SRS:** SOC-FR-002

- Wire heart icon in all 3 detail screen engagement bars.
- Optimistic: tap heart → fill coral + count+1 immediately. Double-tap → unlike (outline + count-1).
- Animation: on like, heart scales 1.0 → 1.3 → 1.0 over 300ms with bounceOut curve.
- Like state provider: family provider keyed by contentId. Tracks isLiked + likeCount.
- On feed cards: show like count but heart is tap-to-navigate (not tap-to-like). Like only available on detail pages.

**Edge cases:**
- Guest taps like → soft auth wall
- API failure → revert optimistic state, no error toast (SRS: "revert quietly")
- Like count display: use formatCount() for large numbers

---

### T8 · Comment UI — bottom sheet + thread (Mobile)
**Files:** Create `apps/mobile/lib/features/social/screens/comments_sheet.dart`, `apps/mobile/lib/features/social/providers/comments_provider.dart`
**SRS:** SOC-FR-003

- Comment bottom sheet: opens from engagement bar "comment" button. 75% screen height.
- Header: "Comments" + count + close button.
- Comment list: FlatList (not ScrollView+map), cursor-paginated (load more on scroll).
- Each comment: avatar + username + time + body. Reply button. Replies indented with left border.
- Input bar: pinned to bottom (above keyboard). Avatar + TextInput + Send button. Send disabled when empty.
- Reply mode: tap "Reply" → input shows "@username" prefix, parentId set. Cancel reply with X.
- Edit: long-press own comment → edit/delete options. Edit shows inline editor. "Edited" badge after save.
- Delete: own comments → "Delete comment?" confirmation → soft delete → show "[Deleted]" if has replies, remove entirely if no replies.
- Empty state: illustration + "No comments yet" + "Be the first to share your thoughts."

**Edge cases:**
- Long comment (500 chars) → char counter shows remaining
- Rate limit hit (10/min) → show "Slow down! Try again in X seconds" toast
- Deleted parent with replies → show "[Deleted]" placeholder, replies still visible
- Rapid-fire submit → disable send button during API call
- Keyboard overlap → bottomSheet with keyboard-aware padding

---

### T9 · Saved lists tab / screen (Mobile)
**Files:** Create `apps/mobile/lib/features/saved/screens/saved_lists_screen.dart`, `apps/mobile/lib/features/saved/screens/saved_list_detail_screen.dart`, `apps/mobile/lib/features/saved/providers/saved_provider.dart`
**SRS:** SOC-FR-008, SOC-FR-009

- **Saved Lists Screen:** Accessed from You tab settings card (add "Saved" row). Not a bottom tab — it's a pushed screen.
- 2-column grid of list cards. Each card: cover image (first item's cover, or placeholder), list name (Fraunces 14px), item count pill, "updated X ago" meta.
- "New list" card: dashed border, + icon, "New list" label. Tap → inline name input.
- **Inside-list View:** Tapping a list card → list detail screen.
- Content items as horizontal cards (thumb + title + creator + price).
- Sort dropdown: Recently added, Oldest, A-Z, Price asc, Price desc.
- Type filter chips: All | Posts | Itineraries | Events (horizontally scrollable).
- Remove from list: bookmark icon on each item → tap to remove from this list.
- Empty list state: illustration + "Nothing here yet" + "Keep exploring" CTA.
- Add routes: `/saved` → SavedListsScreen, `/saved/:listId` → SavedListDetailScreen.

---

### T10 · Save-to-list bottom sheet (Mobile)
**Files:** Create `apps/mobile/lib/features/saved/widgets/save_to_list_sheet.dart`
**SRS:** SOC-FR-010, SOC-FR-011

- Bottom sheet triggered by bookmark icon on any detail page or feed card.
- Shows "Save to..." title + "Pick one or more wishlists" subtitle.
- List of user's lists with checkboxes. Pre-checked (coral) for lists already containing the item.
- Multi-select: user can check/uncheck multiple lists at once.
- "Create new list" row at bottom → inline text input for list name.
- "Done" button → commits all changes (add to checked, remove from unchecked) in single API call.
- First-time save: auto-create "My saved trips" list and add item (SOC-FR-011). Show rename toast.
- Bookmark icon state: filled coral if saved to ANY list, outline if saved to NO list.
- Optimistic: bookmark icon updates immediately on Done tap. Revert silently on failure.

**Edge cases:**
- No lists exist → auto-create default + add item in one flow
- Guest tap → soft auth wall → then open sheet (save queued in local storage? Or just require login)
- Create new list with empty name → validation error
- Create list with duplicate name → allowed (no uniqueness constraint)

---

### T11 · Share UI — WhatsApp + native sheet (Mobile)
**Files:** Update engagement bars, create `apps/mobile/lib/features/social/utils/share_utils.dart`
**SRS:** SOC-FR-005, DD-019

- Two share buttons on every detail page:
  1. **WhatsApp button:** Green WhatsApp icon. Tap → opens `wa.me/?text=Check out {title} on CreatorHub: {canonical_url}`. Use `url_launcher`.
  2. **Share button:** Generic share icon. Tap → `share_plus` native share sheet with title + URL.
- Canonical URL format: `https://creatorhub.in/{content_type}/{slug_or_id}` (SSR page from E2.10).
- Record share event to API (fire-and-forget): POST /content/:id/share with platform.
- Haptic feedback on both buttons.

**Edge cases:**
- WhatsApp not installed → url_launcher fallback (opens in browser or shows "WhatsApp not found")
- Share on web (E2.10) → Web Share API with copy-link fallback
- Content URL pre-E2.10 → use a placeholder URL that will be replaced when web launches

---

### T12 · Wire engagement state into existing detail screens (Mobile)
**Files:** Update all 3 detail providers to accept and manage engagement mutations.

- Post detail: wire like, comment count, save, share buttons to real providers.
- Itinerary detail: same.
- Event detail: same.
- Feed cards: show filled bookmark if saved, show like count. Tap bookmark → save-to-list sheet.

---

### T13 · Tests
**Files:** `social.service.test.ts`, `comment.service.test.ts`, `saved.service.test.ts`

- Follow service: ~15 tests (follow, unfollow, idempotent, self-follow, not found, count update)
- Like service: ~8 tests
- Comment service: ~18 tests (add, edit, delete, thread, rate limit, edge cases)
- Saved service: ~20 tests (CRUD lists, save/remove items, multi-list, auto-create, save status)
- Share: ~4 tests
- **Total: ~65 new API tests**

---

## Dependency Order

```
T1 (follow API) ──┐
T2 (like API) ────┤
T3 (comment API) ─┼── can run in parallel ──→ T13 (tests)
T4 (saved API) ───┤
T5 (share API) ───┘
                   │
                   ▼
T6 (follow UI) ───┐
T7 (like UI) ─────┤
T8 (comment UI) ──┼── can run in parallel ──→ T12 (wire to detail screens)
T9 (saved screen)─┤
T10 (save sheet) ─┤
T11 (share UI) ───┘
```

**Phase 1 (API):** T1–T5 + T13 — all backend services, handlers, routes, tests
**Phase 2 (Mobile):** T6–T12 — all Flutter screens, providers, widgets

---

## UI/UX Specifications

### Engagement Bar (updated)
```
┌───────────────────────────────────────────────┐
│  ❤ 1.2K    💬 34    [WhatsApp]  [↗]   [🔖]  │
│  (like)   (comment) (wa share) (share)(save) │
└───────────────────────────────────────────────┘
```
- Heart: outline ink → filled coral on like. Count right of icon.
- Comment: speech bubble icon. Count right. Tap opens comment sheet.
- WhatsApp: green circle with WA logo. No count.
- Share: arrow-up-right icon. No count.
- Bookmark: outline ink → filled coral when saved. No count on bar.

### Comment Bottom Sheet
```
┌─────────────────────────────────────┐
│  ── handle ──                       │
│  Comments (34)              [close] │
│─────────────────────────────────────│
│  [avatar] @username · 2h           │
│  Great post! Love the photos.      │
│  ↩ Reply                           │
│    ├ [avatar] @creator · 1h        │
│    │ Thanks! 🙏                    │
│    │ ↩ Reply                       │
│  [avatar] @user2 · 5h             │
│  Adding this to my list!           │
│  ↩ Reply                           │
│─────────────────────────────────────│
│  [avatar] Add a comment...  [Send] │
└─────────────────────────────────────┘
```

### Save-to-List Bottom Sheet
```
┌─────────────────────────────────────┐
│  ── handle ──                       │
│  Save to…                           │
│  Pick one or more of your wishlists │
│─────────────────────────────────────│
│  [✓coral] [thumb] Spiti trip ideas  │
│           4 items · updated 2d ago  │
│  [  ]     [thumb] Weekend escapes   │
│           7 items · updated 5d ago  │
│  [✓coral] [thumb] My saved trips    │
│           12 items · updated today  │
│─────────────────────────────────────│
│  [+]  Create new list               │
│─────────────────────────────────────│
│  [      Done (coral fill)         ] │
└─────────────────────────────────────┘
```

### Saved Lists Grid (Screen 11A)
```
┌──────────────────────────────────┐
│  Saved                      [+] │
│  Your wishlists                  │
│─────────────────────────────────│
│ ┌──────────┐ ┌──────────┐      │
│ │ [cover]  │ │ [cover]  │      │
│ │     [4]  │ │     [7]  │      │
│ │ Spiti    │ │ Weekend  │      │
│ │ 2d ago   │ │ 5d ago   │      │
│ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌╌╌╌╌╌╌╌╌╌╌┐     │
│ │ [cover]  │ ╎   [+]    ╎     │
│ │    [12]  │ ╎ New list  ╎     │
│ │ My saved │ └╌╌╌╌╌╌╌╌╌╌┘     │
│ │ today    │                    │
│ └──────────┘                    │
└──────────────────────────────────┘
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Count drift (optimistic counts diverge from DB) | Periodic reconcile cron job (V1 scope). For MVP, counts refresh on each page load. |
| Comment moderation (offensive content) | Text moderation deferred to E2.7 (Trust & Safety). MVP relies on report flow. |
| Guest save persistence | Save to local storage → prompt sign-up to sync. Complex for MVP → defer to V1. MVP: guest must sign in to save. |
| WhatsApp deep link fails on devices without WA | url_launcher `canLaunchUrl` check → fallback to copy-link toast |

---

## Definition of Done

- [ ] All 17 API endpoints working (follow, like, comment CRUD, saved lists CRUD, share)
- [ ] ~65 API tests passing
- [ ] Follow/unfollow with optimistic UI + confirmation sheet
- [ ] Like with optimistic UI + animation
- [ ] Comment bottom sheet with threading + pagination
- [ ] Saved lists screen (2-col grid) + list detail (sort + filter)
- [ ] Save-to-list bottom sheet (multi-select + auto-create)
- [ ] WhatsApp share + native share on all detail pages
- [ ] All engagement bars wired to real API calls
- [ ] `flutter analyze` 0 issues
- [ ] `tsc --noEmit` 0 errors
- [ ] API `/healthz` returns 200
