# E1.4 — Events — Tasks

> Detailed task list for implementation. Each task is independent within its agent lane.
> API tasks (T1–T6) and Mobile tasks (T7–T11) run in parallel after T1 is complete.
> **Do not start implementation until the plan is approved by the founder.**

---

## T1: Event Zod Schemas & Shared Types
**Agent:** API
**Files:**
- `packages/shared/src/schemas/index.ts` (modify)
- `packages/shared/src/types/index.ts` (modify)
- `packages/shared/src/constants/index.ts` (modify)

**SRS:** CRT-FR-013, CRT-FR-018
**Deps:** E1.1 T1 (base content schemas exist)
**Acceptance:**
- `updateEventSchema` with all event-specific fields: title (5-100), description (max 500), start_at (ISO datetime), end_at (ISO datetime), timezone, venue_name (1-200), venue_address (max 500), venue_lat (-90 to 90), venue_lng (-180 to 180), city_id, capacity (int, 1-10000), tags (max 5 items, each max 50 chars), sub_category_id, vertical_data (what_to_bring, dress_code, age_restriction)
- `eventListQuerySchema` with: city_id, from_date, vertical, user_id, cursor, limit (default 20, max 50)
- `EventOccurrence` interface with all `event_occurrences` table fields + venue_lat/lng extracted from PostGIS point
- `EventDetail` interface extending content base with event occurrence, media, creator summary, attendee list, attendee_count, has_rsvpd
- `EventListItem` interface with essential list fields (id, title, start_at, end_at, venue_name, city_id, capacity, spots_booked, is_free, cover_image_url, creator)
- `EventVerticalData` interface (what_to_bring?: string[], dress_code?: string | null, age_restriction?: string | null)
- `AttendeeItem` interface (id, display_name, avatar_url)
- Constants: `MAX_EVENT_DESCRIPTION_LENGTH = 500`, `MAX_EVENT_CAPACITY = 10000`, `MAX_EVENT_TITLE_LENGTH = 100`, `MIN_EVENT_TITLE_LENGTH = 5`
- All new types and schemas exported from package index

**Edge cases:**
- start_at/end_at: z.string().datetime() — rejects non-ISO strings
- capacity: z.number().int() — rejects floats
- description: max 500 chars (different from CRT-FR-018's 280 for posts)
- venue_lat/lng: strict range validation (lat -90/90, lng -180/180)
- tags: optional, each tag max 50 chars, whole array max 5 items
- All new schemas and types must be re-exported via packages/shared/src/index.ts

---

## T2: Event Service
**Agent:** API
**Files:**
- `apps/api/src/services/event.service.ts` (new)

**SRS:** CRT-FR-013, DD-025
**Deps:** E1.1 T2 (content.service.ts), E1.1 T3 (content-state.service.ts), T1 (schemas + types)
**Acceptance:**
Seven functions:

1. `createEventDraft(userId: string, input: { vertical: string; sub_category_id?: string })`
   - Calls `contentService.createDraft()` with `type = 'event'`, `pricing_model = 'free'`, `price_paisa = 0`
   - Returns `{ id, status: 'draft', type: 'event' }`

2. `getEventDetail(contentId: string, requesterId?: string): Promise<EventDetail>`
   - Joins content + event_occurrences + users + media
   - Fetches first 4 attendees + total attendee count from bookings
   - Computes `has_rsvpd` by checking bookings for requesterId
   - Returns 404 if: event not found, type !== 'event', or (status !== 'published' && user_id !== requesterId)

3. `updateEvent(contentId: string, userId: string, input: UpdateEventInput)`
   - Validates ownership (fetch content, check user_id — throw 403 if mismatch)
   - Validates status = 'draft' (throw 422 if not draft)
   - Stores all event-specific fields in `content.vertical_data` JSONB via UPDATE
   - Returns `{ id, updated_at }`

4. `publishEvent(contentId: string, userId: string, tncAccepted: boolean)`
   - Validates ownership
   - Reads vertical_data to extract draft event fields
   - Validates all required fields: title (5-100), description non-empty, venue_name, venue_address, venue_lat, venue_lng, city_id, capacity ≥ 1, start_at > NOW(), end_at > start_at, same calendar day in timezone, at least 1 media item
   - Forces: `pricing_model = 'free'`, `price_paisa = 0`, `is_free = true`
   - In a transaction: creates `event_occurrences` row, delegates to state machine `publishContent()`
   - No KYC check (free events, M1)

5. `rsvpEvent(contentId: string, userId: string)`
   - Validates event exists + is published (throw 404 if not)
   - Validates start_at > NOW() (throw 422 "event_past")
   - Validates userId !== event.user_id (throw 422 "own_event")
   - Checks no existing booking for (content_id, user_id) (throw 409 "already_rsvpd")
   - Atomic UPDATE: `UPDATE event_occurrences SET spots_booked = spots_booked + 1 WHERE content_id = $1 AND spots_booked < capacity RETURNING spots_booked`
   - If 0 rows returned → throw 409 "event_full"
   - Inserts booking row: status = 'confirmed', price_paisa = 0
   - Returns `{ booking_id, event_id, status: 'confirmed', spots_booked }`

6. `cancelRsvp(contentId: string, userId: string)`
   - Validates booking exists for (content_id, user_id) (throw 404 if not)
   - Validates event start_at > NOW() (throw 422 "event_past" if not)
   - Deletes booking row
   - Atomic decrement: `UPDATE event_occurrences SET spots_booked = GREATEST(spots_booked - 1, 0), rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE content_id = $1`
   - Returns `{ event_id, spots_booked }`

7. `listEvents(filters: EventListFilters): Promise<{ items: EventListItem[]; next_cursor: string | null }>`
   - Upcoming published events only by default (start_at >= NOW())
   - Supports city_id, from_date, vertical, user_id filters
   - Cursor pagination sorted by (start_at ASC, id ASC)
   - Cursor is base64(`${start_at}|${id}`)
   - Joins media LATERAL for cover image URL

**Edge cases:**
- Publish same-day check: compare `start_at.toDate()` and `end_at.toDate()` calendar day in the event's timezone
- Publish: minimum 1 media item (check media table for this content_id)
- Detail: if requesterId is undefined, has_rsvpd = false (no DB query)
- List: cursor decode handles malformed base64 gracefully (ignore cursor, return first page)
- Cancel RSVP: only delete bookings with status != 'cancelled' (idempotency)

---

## T3: Event Handlers & Routes
**Agent:** API
**Files:**
- `apps/api/src/handlers/events.ts` (new)
- `apps/api/src/routes/events.routes.ts` (new)

**SRS:** CRT-FR-013
**Deps:** T2 (event service), posts.ts as thin-handler reference pattern
**Acceptance:**
7 thin handlers following `posts.ts` pattern exactly:

```
POST   /             → createEventHandler    (authenticate, validateBody(createContentSchema))
GET    /             → listEventsHandler     (optionalAuthenticate, validateQuery(eventListQuerySchema))
GET    /:id          → getEventHandler       (optionalAuthenticate)
PUT    /:id          → updateEventHandler    (authenticate, validateBody(updateEventSchema))
POST   /:id/publish  → publishEventHandler   (authenticate, validateBody(publishContentSchema))
POST   /:id/rsvp     → rsvpEventHandler      (authenticate)
DELETE /:id/rsvp     → cancelRsvpHandler     (authenticate)
```

Each handler: extract validated input, call event service function, return response.

Status codes:
- POST /: 201 + Location header
- GET /: 200
- GET /:id: 200
- PUT /:id: 200
- POST /:id/publish: 200
- POST /:id/rsvp: 201 + Location header (`/api/v1/bookings/{booking_id}`)
- DELETE /:id/rsvp: 200

All errors in RFC 9457 format (type, title, status, detail, [errors array for 400]).

**Edge cases:**
- Publish 400: response body has `errors` array listing each failing field
- RSVP 409/422: response body has `code` + `detail` fields (not just `detail`)
- List: parse `cursor` query param, pass to service
- Rate limit: apply 10/hour for POST / and POST /:id/rsvp

---

## T4: Mount Event Routes
**Agent:** API
**Files:**
- `apps/api/src/index.ts` (modify)

**SRS:** N/A
**Deps:** T3 (event routes file)
**Acceptance:**
- Add `import { eventsRoutes } from './routes/events.routes.js'`
- Add `app.route('/api/v1/events', eventsRoutes)` — placed after itinerary routes, before error handler
- `pnpm dev` in apps/api still starts without errors
- `GET /healthz` returns 200 after the change
- No path conflicts: confirm `/api/v1/events` doesn't shadow `/api/v1/content`

**Edge cases:**
- Confirm rate limiting middleware is inherited by sub-routes
- Confirm `optionalAuthenticate` is applied correctly (not `authenticate`) on public GET routes

---

## T5: Event Service Tests
**Agent:** API
**Files:**
- `apps/api/src/services/event.service.test.ts` (new)

**SRS:** CRT-FR-013
**Deps:** T2 (event service)
**Acceptance:** Minimum 15 tests:

| # | Test |
|---|------|
| 1 | `createEventDraft` — creates draft with type='event', pricing_model='free', price_paisa=0 |
| 2 | `updateEvent` — stores event fields in vertical_data JSONB |
| 3 | `updateEvent` — rejects non-owner (403) |
| 4 | `updateEvent` — rejects non-draft (422) |
| 5 | `publishEvent` — happy path: creates event_occurrences row, status becomes 'published' |
| 6 | `publishEvent` — rejects missing venue_name (400) |
| 7 | `publishEvent` — rejects start_at in past (400) |
| 8 | `publishEvent` — rejects start_at and end_at on different days (400) |
| 9 | `publishEvent` — rejects no cover image (400) |
| 10 | `rsvpEvent` — happy path: spots_booked incremented, booking created |
| 11 | `rsvpEvent` — rejects at capacity (409 event_full) |
| 12 | `rsvpEvent` — rejects duplicate RSVP (409 already_rsvpd) |
| 13 | `rsvpEvent` — rejects creator RSVPing own event (422 own_event) |
| 14 | `rsvpEvent` — rejects past event (422 event_past) |
| 15 | `cancelRsvp` — happy path: booking deleted, spots_booked decremented |
| 16 | `cancelRsvp` — rejects when no existing RSVP (404) |
| 17 | `listEvents` — returns upcoming events only (past excluded by default) |
| 18 | `getEventDetail` — has_rsvpd = true when requester has booking |

**Edge cases:**
- Race condition test: concurrent rsvpEvent calls with exactly 1 spot remaining — verify only one succeeds
- Mock NOW() to test start_at boundary conditions
- Verify publishEvent forces free pricing even if vertical_data has price_paisa set

---

## T6: Event Handler Tests
**Agent:** API
**Files:**
- `apps/api/src/handlers/events.test.ts` (new)

**SRS:** CRT-FR-013
**Deps:** T3 (handlers), T5 (service tests passing)
**Acceptance:** Minimum 21 integration tests using `app.request()` pattern — all 21 test cases from plan §12:

| # | HTTP | Path | Scenario | Expected |
|---|------|------|----------|----------|
| 1 | POST | /events | happy path | 201 + Location header + draft response |
| 2 | POST | /events | unauthenticated | 401 |
| 3 | PUT | /events/:id | update draft fields | 200 + updated_at |
| 4 | PUT | /events/:id | update non-draft | 422 |
| 5 | PUT | /events/:id | non-owner | 403 |
| 6 | POST | /events/:id/publish | happy path | 200 + published status |
| 7 | POST | /events/:id/publish | missing venue_name | 400 + errors array |
| 8 | POST | /events/:id/publish | start_at in past | 400 |
| 9 | POST | /events/:id/publish | different-day start/end | 400 |
| 10 | POST | /events/:id/publish | no cover image | 400 |
| 11 | POST | /events/:id/rsvp | happy path | 201 + Location header |
| 12 | POST | /events/:id/rsvp | at capacity | 409 event_full |
| 13 | POST | /events/:id/rsvp | already RSVP'd | 409 already_rsvpd |
| 14 | POST | /events/:id/rsvp | own event | 422 own_event |
| 15 | POST | /events/:id/rsvp | past event | 422 event_past |
| 16 | POST | /events/:id/rsvp | unauthenticated | 401 |
| 17 | DELETE | /events/:id/rsvp | happy path | 200 + spots_booked |
| 18 | DELETE | /events/:id/rsvp | no existing RSVP | 404 |
| 19 | GET | /events/:id | published, unauthenticated | 200 + has_rsvpd=false |
| 20 | GET | /events/:id | draft, non-owner | 404 |
| 21 | GET | /events | list with city filter | 200 + paginated + start_at ASC |

All error responses must be valid RFC 9457 JSON.

---

## T7: Event Creation Wizard (Flutter)
**Agent:** Mobile
**Files:**
- `apps/mobile/lib/features/events/screens/event_wizard_screen.dart` (new)
- `apps/mobile/lib/features/events/providers/event_wizard_provider.dart` (new)
- `apps/mobile/lib/features/events/widgets/event_details_step.dart` (new)

**SRS:** CRT-FR-013, CRT-FR-015, CRT-FR-018
**Deps:** E1.1 T10 (wizard shell), E1.1 T11 (basics step — must accept `maxDescriptionLength` param), E1.1 T13 (review step), T3 (API endpoints at /api/v1/events)
**Acceptance:**
4-step wizard:

**Step 1: Basics**
- Reuse `BasicsStep` from E1.1, pass `maxDescriptionLength: 500` (event override from CRT-FR-013)
- Live character counter: warning at 425 chars (85% of 500), error/block at 500

**Step 2: Event Details** (new widget: `EventDetailsStep`)
- Date/time pickers: `showDatePicker` + `showTimePicker` (native, default to tomorrow 10:00 AM)
- End time picker: default to start time + 2 hours
- Inline validation: start_at > NOW(), end_at > start_at, same calendar day
- Venue name: `TextFormField`, required, max 200 chars
- Venue address: `TextFormField`, required for step transition, max 500 chars
- City search: reuse the city autocomplete component from E0.5 onboarding
- Capacity: integer `TextFormField` with increment/decrement buttons, min 1, max 10000

**Step 3: Media**
- Reuse E1.2 media step pattern (image_picker, 2-column grid, max 5)
- Cover image required: show error if none selected when attempting to proceed

**Step 4: Review & Publish**
- Reuse E1.1 review step

**Provider (`EventWizardProvider` extends `AsyncNotifier`)**:
- Holds: `eventId` (set on draft create), `step` (1-4), `draftData` (EventDraft model), `autoSaveTimer`
- `initWizard()`: check for existing event draft, offer continue/new
- `createDraft()`: `POST /api/v1/events`, saves event ID
- `updateDraft(partial)`: merges into draftData, `PUT /api/v1/events/:id`, auto-save debounced
- `publish()`: `POST /api/v1/events/:id/publish`, navigates to detail on success

**Edge cases:**
- Resume existing draft: check for `type='event', status='draft'` on wizard start
- "Start new": call `DELETE /api/v1/content/:id` on old draft first
- API error on draft create: show SnackBar error, do not advance step
- Step 2 inline errors: shown inline, Next button disabled
- Wizard exit with unsaved changes: `showDialog` "Discard changes?" confirmation
- Back from step 2+: retain all entered data

---

## T8: Event Detail Screen (Flutter)
**Agent:** Mobile
**Files:**
- `apps/mobile/lib/features/events/screens/event_detail_screen.dart` (new)
- `apps/mobile/lib/features/events/providers/event_detail_provider.dart` (new)
- `apps/mobile/lib/features/events/widgets/date_block.dart` (new)
- `apps/mobile/lib/features/events/widgets/facts_grid.dart` (new)
- `apps/mobile/lib/features/events/widgets/whos_going.dart` (new)
- `apps/mobile/lib/features/events/widgets/rsvp_bottom_bar.dart` (new)
- `apps/mobile/lib/features/events/widgets/meeting_point_card.dart` (new)

**SRS:** CRT-FR-013, SOC-FR-005, DD-025
**Deps:** E0.4 design system, T3 (API endpoints), T1 (EventDetail type)
**Acceptance:**
Full screen per wireframe screen-04c layout:

**`DateBlock` widget** (stateless):
- Props: `startAt: DateTime`
- Layout: `width: 58`, border 1px ink, border-radius 10
- Header: `height: 28`, `background: AppColors.ink`, month abbreviation (uppercase, white, 9px, weight 600)
- Body: padding 7px, day number (Fraunces 24px, weight 600, `SOFT=60 opsz=30`), weekday (muted, 8px, uppercase, weight 600)

**`FactsGrid` widget** (stateless):
- 2×2 grid in sunken card (`AppColors.sunken`, border-radius 10)
- 4 facts: "STARTS" (formatted time), "DURATION" (formatted duration), "DIFFICULTY" (from vertical_data or "—"), "SPOTS" ("X going / Y max")
- Each fact: label (8px, uppercase, soft-ink) + value (11px, bold, ink)

**`WhosGoing` widget** (stateless):
- Props: `attendees: List<AttendeeItem>`, `totalCount: int`
- Avatar pile: max 4 avatars, each 28dp circle, -8dp overlap, ink border 2dp
- Last item if total > 4: ink circle with "+N" white text
- Footer text: "N others going"
- Hidden entirely if `totalCount == 0`

**`RsvpBottomBar` widget** (stateless):
- Props: `isRsvpd: bool`, `isFull: bool`, `isPast: bool`, `isCreator: bool`, `onRsvp: VoidCallback`, `onCancelRsvp: VoidCallback`
- "Free" label (Fraunces, 18px), coral RSVP button (full-width minus label)
- States: default (RSVP), RSVP'd ("You're going ✓" + "Cancel RSVP"), full ("Event is Full", disabled), past (hidden), creator ("You're hosting this", no button)
- Sticky bottom: `SafeArea` + white background + border-top

**`MeetingPointCard` widget** (stateless):
- Map placeholder (Container with light background), coral pin icon
- Venue name (bold) + full address (soft-ink)

**`EventDetailProvider`** (`AsyncNotifier<EventDetail>`):
- `load(eventId)`: `GET /api/v1/events/:id`
- `rsvp()`: `POST /api/v1/events/:id/rsvp`, optimistic update `has_rsvpd = true, spots_booked++`
- `cancelRsvp()`: `DELETE /api/v1/events/:id/rsvp`, optimistic update `has_rsvpd = false, spots_booked--`

**`EventDetailScreen`** (ConsumerWidget):
- Uses `SkeletonLoader` while loading
- `CustomScrollView` with `SliverAppBar` (hero image, floating nav)
- Sections: date block + title row, facts grid, description, meeting point, who's going, what to bring, cancellation policy
- `RsvpBottomBar` as sticky bottom overlay

**Edge cases:**
- Loading: skeleton shimmer per component (DateBlock skeleton, FactsGrid skeleton, body shimmer)
- Error/404: `AppEmptyState` with "Event not found", back button, retry CTA
- Past event: `Container` banner "This event has passed" above content; hide `RsvpBottomBar`
- At capacity (not RSVP'd): `RsvpBottomBar` shows full state
- User RSVP'd: `RsvpBottomBar` shows RSVP'd state; cancel triggers confirmation dialog
- Creator's own event: `RsvpBottomBar` shows creator state
- 0 attendees: `WhosGoing` widget not rendered
- No cover image: `SliverAppBar` shows `AppColors.surface` background with calendar icon
- Deep link via GoRouter: `EventDetailScreen(eventId: id)` built from route params

---

## T9: Event Feed Card Widget (Flutter)
**Agent:** Mobile
**Files:**
- `apps/mobile/lib/features/events/widgets/event_feed_card.dart` (new)

**SRS:** CRT-FR-013
**Deps:** E0.4 design system (PostFeedCard + ItineraryFeedCard as style reference), T1 (EventListItem type)
**Acceptance:**
Stateless widget with named parameters:
```dart
const EventFeedCard({
  required String id,
  required String title,
  required DateTime startAt,
  required String venueName,
  required int capacity,
  required int spotsBooked,
  required String creatorName,
  String? coverImageUrl,
  String? creatorAvatarUrl,
  bool isPast = false,
})
```

Layout:
- `InkWell` wrapper (44dp min tap target, haptic + `HapticFeedback.lightImpact()`)
- Press animation: `AnimatedScale(scale: _pressed ? 0.97 : 1.0, duration: 120ms)`
- Cover image: `CachedNetworkImage` (16:9, `borderRadius: 12`), placeholder with calendar icon
- Overlays on image: "EVENT" badge (top-left, same style as PostFeedCard), compact date block (top-right: month + day only)
- "Ended" badge overlay: if `isPast`, semi-transparent dark badge on image
- Body: title (2-line max, ellipsis, Inter 14sp weight 600), venue row (pin icon + name, soft-ink), spots row ("X going / Y max"), creator row (AppAvatar 28dp + name), "FREE" badge (AppColors.successSurface, same as ItineraryFeedCard)
- Tap: `context.push('/events/$id')`
- Skip animation if `MediaQuery.disableAnimations`

**Edge cases:**
- No cover image: placeholder Container with `AppColors.surface` + calendar icon centered
- Long title: max 2 lines, `TextOverflow.ellipsis`
- Creator avatar null: `AppAvatar` shows initial letter circle
- 0 spots booked: show "0 going / $capacity max"

---

## T10: Flutter Widget Tests
**Agent:** Mobile
**Files:**
- `apps/mobile/test/features/events/widgets/event_feed_card_test.dart` (new)
- `apps/mobile/test/features/events/widgets/date_block_test.dart` (new)
- `apps/mobile/test/features/events/screens/event_detail_screen_test.dart` (new)

**SRS:** CRT-FR-013
**Deps:** T8 (detail screen), T9 (feed card)
**Acceptance:**
Minimum 10 widget tests per plan §12. Follow patterns from E1.2/E1.3 widget tests:
- `_wrap(Widget)` helper with `MaterialApp.router` + GoRouter for navigation tests
- `ProviderScope(overrides: [...])` for Riverpod-backed screens
- `implements HttpClientAdapter` (not `extends`) for fake Dio adapter — Dio 5 rule from E1.3
- `service.dio.interceptors.clear()` before injecting fake adapter (prevents flutter_secure_storage hang)
- `SizedBox(height: 700)` wrapper if any `ListView` is in the widget tree

All 10 tests from §12 must pass. Plus:
- Verify no `CircularProgressIndicator` in widget tree when loading state (skeleton only)
- Verify `RsvpBottomBar` RSVP button has `≥ 44dp` tap target size

**Edge cases:**
- `DateBlock` test: verify Fraunces font family used for day number text widget
- Navigation test: use `GoRouter` + `MaterialApp.router` to verify `context.push('/events/$id')` reached target route
- `EventDetailScreen` loading test: provider returns `AsyncValue.loading()` state

---

## T11: Register Event Routes in Flutter Router
**Agent:** Mobile
**Files:**
- `apps/mobile/lib/app/router.dart` (modify)

**SRS:** N/A
**Deps:** T8 (EventDetailScreen), T7 (EventWizardScreen)
**Acceptance:**
- Add GoRoute: `path: '/events/:id'`, builder returns `EventDetailScreen(eventId: state.pathParameters['id']!)`
- Add GoRoute: `path: '/events/create'`, builder returns `EventWizardScreen()`, redirect to `/auth` if unauthenticated
- No conflict with existing routes (`/posts/:id`, `/itineraries/:id`)
- Verify deep link `/events/abc123` navigates to `EventDetailScreen` in test

**Edge cases:**
- Auth guard: unauthenticated user navigating to `/events/create` is redirected to `/auth`
- Route ordering: `/events/create` must be listed before `/events/:id` to prevent "create" being matched as an id param
