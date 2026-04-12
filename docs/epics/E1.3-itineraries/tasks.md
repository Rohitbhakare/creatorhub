# E1.3 — Tasks

## T1: Itinerary Zod Schemas & Types
**Files:** `packages/shared/src/schemas/itinerary.ts`, `packages/shared/src/types/itinerary.ts`
**SRS:** CRT-FR-002, CRT-FR-003, CRT-FR-019
**Deps:** E1.1 T1 (base content schemas)
**Acceptance:** `CreateItineraryDraftSchema` extends base with `type: 'self_paced_itinerary'`. `UpdateItinerarySchema` includes itinerary-specific fields: `day_count` (1-30), `starting_city_id`, `destination_city_ids` (array), `budget_range` (min/max paisa). `ItineraryDaySchema`: `day_number`, `title`, `description`. `ItinerarySpotSchema`: `google_place_id`, `name`, `point` ({lat, lng}), `creator_note` (max 500 chars), `duration_minutes`, `stop_type` (enum), `spot_order`. `PublishItinerarySchema`: validates title, at least 1 day, each day has at least 1 spot, vertical='travel'.
**Edge cases:**
- Day count: 1-30, integer only
- Spot order: 1-based integer, unique within a day
- Creator note: optional, max 500 chars
- Duration minutes: optional, 0-1440 (max 24 hours per spot)
- Stop type: `regular | overnight | meal | viewpoint | activity`
- Point: lat -90 to 90, lng -180 to 180
- Google place ID: optional (manual spots allowed? No — required in MVP per DD-028)
- Destination cities: optional array, max 10 cities
- Budget range: optional, min <= max, both in paisa
- Tags: optional, max 5 per itinerary
- Sub-category must be one of 12 travel sub-categories

## T2: Itinerary Service
**Files:** `apps/api/src/services/itinerary.service.ts`, `apps/api/src/db/queries/itinerary.queries.ts`
**SRS:** CRT-FR-002, CRT-FR-003, CRT-FR-019, DD-023
**Deps:** E1.1 T2 (content service), E1.1 T3 (state machine)
**Acceptance:** `createItineraryDraft(userId, input)` — creates content row + initial day skeletons based on `day_count`. `getItineraryDetail(contentId, requesterId?)` — returns content + days + spots + map data. For paid itineraries: non-buyers see only Day 1 spots (is_free_preview=true). `addDay(contentId, userId, dayData)` — add a day (only if owner, only if draft). `updateDay(dayId, userId, dayData)` — update day title/description. `removeDay(dayId, userId)` — remove day + cascade spots, reorder remaining days. `addSpot(dayId, userId, spotData)` — add spot to day, set spot_order. `updateSpot(spotId, userId, spotData)` — update spot fields. `removeSpot(spotId, userId)` — remove spot, reorder remaining. `reorderSpots(dayId, userId, spotIds)` — reorder spots within a day. `publishItinerary(contentId, userId)` — validate and publish.
**Edge cases:**
- Create day skeletons: on draft creation with `day_count=N`, insert N rows in `itinerary_days` with `day_number` 1..N
- Day count change: if user changes day count from 5 to 3, prompt "Remove days 4 and 5?" (but handle in service: remove extra days + cascade spots)
- Day count increase: add empty day skeletons
- Add spot: auto-increment `spot_order` to max(spot_order) + 1 within the day
- Remove day: reorder remaining days (day 1,2,3 -> remove 2 -> renumber to 1,2)
- Remove spot: reorder remaining spots within the day
- Reorder spots: accept array of spot IDs in new order, update `spot_order` values
- Free preview: for paid itineraries, auto-set `is_free_preview=true` on all Day 1 spots
- Free itineraries: all spots have `is_free_preview=true`
- Detail endpoint: for non-buyers of paid itineraries, return Day 1 spots only + total spot count hint
- Publish validation: title required (5-100 chars), at least 1 day, each day has at least 1 spot, vertical='travel', if paid -> KYC verified
- Distance computation: use PostGIS `ST_Distance` between consecutive spots in a day, sum for `total_distance_km`
- Duration computation: sum `duration_minutes` of all spots in a day for `estimated_hours`
- Spot thumbnail: `thumbnail_url` comes from Google Places `photo_reference` (populated during spot creation from place details)

## T3: Itinerary Days & Spots CRUD Handlers
**Files:** `apps/api/src/handlers/itineraries.ts`, `apps/api/src/routes/itineraries.routes.ts`
**SRS:** CRT-FR-002, CRT-FR-003
**Deps:** T2 (itinerary service), E1.1 T4 (content routes pattern)
**Acceptance:** Routes:
- `POST /api/v1/itineraries` — create draft (auth)
- `GET /api/v1/itineraries/:id` — detail (optionalAuth)
- `PUT /api/v1/itineraries/:id` — update itinerary fields (auth, owner, draft only)
- `POST /api/v1/itineraries/:id/publish` — publish (auth, owner)
- `POST /api/v1/itineraries/:id/days` — add day (auth, owner, draft)
- `PUT /api/v1/itineraries/:id/days/:dayId` — update day (auth, owner, draft)
- `DELETE /api/v1/itineraries/:id/days/:dayId` — remove day (auth, owner, draft)
- `POST /api/v1/itineraries/:id/days/:dayId/spots` — add spot (auth, owner, draft)
- `PUT /api/v1/itineraries/:id/days/:dayId/spots/:spotId` — update spot (auth, owner, draft)
- `DELETE /api/v1/itineraries/:id/days/:dayId/spots/:spotId` — remove spot (auth, owner, draft)
- `PUT /api/v1/itineraries/:id/days/:dayId/spots/reorder` — reorder spots (auth, owner, draft)

**Edge cases:**
- Verify itinerary belongs to authenticated user for all write operations
- Verify day belongs to the itinerary (prevent cross-itinerary day manipulation)
- Verify spot belongs to the day (prevent cross-day spot manipulation)
- Create: return 201 with Location header
- Add spot: validate google_place_id exists by fetching from Places cache or API
- Add spot: auto-populate thumbnail_url from Google Places photo_reference
- Reorder: validate all spot IDs belong to the specified day and no duplicates/missing
- Day operations only allowed on draft-status itineraries
- Rate limit: 30 requests per minute per user on spot CRUD (prevent abuse)

## T4: Itinerary Distance & Duration Calculator
**Files:** `apps/api/src/services/distance.service.ts`
**SRS:** CRT-FR-002, CRT-FR-019
**Deps:** T2 (itinerary service), E0.2 (PostGIS setup)
**Acceptance:** `computeDayDistance(dayId)` — queries spots for a day, computes total distance in km using PostGIS `ST_Distance` between consecutive spots (in order of `spot_order`). Updates `itinerary_days.total_distance_km`. `computeDayDuration(dayId)` — sums `duration_minutes` of all spots in the day, updates `itinerary_days.estimated_hours`. Both called after spot add/remove/reorder.
**Edge cases:**
- Single spot: distance = 0, duration = spot's duration
- Zero spots: distance = 0, duration = 0
- Spots without coordinates: skip in distance calculation (should not happen — point is required)
- Very large distances (intercontinental): cap at 99999.9 km (numeric(6,1) limit)
- Duration: convert minutes to hours (e.g., 450 min -> 7.5 hours) for `estimated_hours`
- Called asynchronously after spot operations (do not block the HTTP response)
- Null duration_minutes on spots: treat as 0 in sum

## T5: Place Cache Service
**Files:** `apps/api/src/services/place-cache.service.ts`, `apps/api/src/db/queries/place-cache.queries.ts`
**SRS:** CRT-FR-003, DD-028
**Deps:** E1.1 T6 (places proxy)
**Acceptance:** `cachePlace(placeDetail)` — upserts place details into `place_cache` table with `fetched_at` timestamp. `getCachedPlace(placeId)` — returns cached place if exists and not stale (< 30 days old). `getPhotoUrl(placeId)` — returns first photo URL from cached place details. Called by itinerary spot creation to populate thumbnail_url.
**Edge cases:**
- Stale cache: if `fetched_at` > 30 days ago, re-fetch from Google and update cache
- Cache miss: fetch from Google Places API, cache, then return
- Google API error during cache refresh: serve stale data with warning log
- Photo URL: use first photo from place details, construct URL with server-side API key
- Place with no photos: return null for thumbnail_url
- Place cache table DDL: `CREATE TABLE place_cache (place_id TEXT PK, name TEXT, formatted_address TEXT, lat DOUBLE, lng DOUBLE, rating FLOAT, photos JSONB, fetched_at TIMESTAMPTZ)`
- Migration file needed: `apps/api/src/db/migrations/013_place_cache.sql`

## T6: Itinerary Creation Wizard (Flutter — 6 steps)
**Files:** `apps/mobile/lib/features/itineraries/screens/itinerary_wizard_screen.dart`, `apps/mobile/lib/features/itineraries/providers/itinerary_wizard_provider.dart`
**SRS:** CRT-FR-002, CRT-FR-015
**Deps:** E1.1 T10 (wizard shell), E1.1 T11 (basics step), E1.1 T12 (pricing step)
**Acceptance:** 6-step wizard using E1.1 shell: Step 1 = Basics (title, description, sub-category — E1.1), Step 2 = Trip Overview (day count, starting city, destinations), Step 3 = Day Builder (spot picker per day), Step 4 = Media (up to 10 images), Step 5 = Pricing (free/paid toggle — E1.1), Step 6 = Review & Publish (E1.1). On wizard start: create draft via API. Auto-save on step change and every 30s.
**Edge cases:**
- Resume existing itinerary draft: load days and spots from API, restore wizard to last step
- Step 1 -> Step 2: validate title (5-100 chars), vertical must be 'travel'
- Step 2 -> Step 3: validate day count >= 1, create day skeletons via API
- Day count change in Step 2 after spots added in Step 3: warn "Reducing days will remove spots from removed days"
- Step 3 -> Step 4: at least Day 1 must have at least 1 spot
- Step 5: default to Free. If toggled to Paid, check KYC. Show free preview note for Day 1
- Step 6: validate all requirements, show validation failures as tappable items
- Wizard state: Riverpod notifier managing all 6 steps' state + API sync
- Large itineraries (30 days, many spots): efficient rendering, lazy loading days

## T7: Trip Overview Step (Flutter)
**Files:** `apps/mobile/lib/features/itineraries/widgets/trip_overview_step.dart`
**SRS:** CRT-FR-002, CRT-FR-019
**Deps:** E1.1 T11 (basics step pattern)
**Acceptance:** Day count input: numeric stepper (1-30 days), "+ / -" buttons. Starting city: city search (reuse onboarding city picker component). Destination cities: multi-select city search (max 10). Duration display: "X days" summary. Budget range input: optional, min-max fields in rupees.
**Edge cases:**
- Day count stepper: disable "-" at 1, disable "+" at 30
- Day count 0: not allowed, minimum is 1
- Day count change: if reducing below current days with spots, show confirmation dialog
- Starting city: required (validation on step transition)
- Destination cities: optional, but useful for search/filter
- Budget range: optional, if provided both min and max required, min <= max
- Budget display: "₹X - ₹Y per person" using formatPrice
- City search: debounced (300ms), minimum 2 chars, uses /cities API
- GPS auto-detect for starting city: offer "Use current location" if GPS available

## T8: Day Builder Screen (Flutter)
**Files:** `apps/mobile/lib/features/itineraries/screens/day_builder_screen.dart`, `apps/mobile/lib/features/itineraries/widgets/day_tab_bar.dart`, `apps/mobile/lib/features/itineraries/widgets/spot_list_tile.dart`
**SRS:** CRT-FR-003, DD-023
**Deps:** T6 (wizard), E1.1 T6 (places proxy)
**Acceptance:** Horizontal tab bar for days (Day 1, Day 2, ..., Day N). Each day tab shows spot list with: spot thumbnail (Google Places photo), spot name, creator note preview, stop type badge, duration badge. "Add spot" FAB that opens spot picker bottom sheet. Drag-to-reorder spots within a day. Swipe-to-remove spots. Day distance/duration summary bar at the top of each day's spot list.
**Edge cases:**
- Empty day: show "Add your first spot" illustration + CTA button
- Many days (>5): scrollable tab bar with scroll indicator
- Many spots per day (>10): FlatList with efficient rendering (not ScrollView + map)
- Reorder: drag handle on left side, haptic feedback during drag
- Remove: swipe left reveals red delete button, confirm dialog
- Tab switch: preserve scroll position per day
- Distance/duration: computed from spots, updated live on add/remove/reorder
- Loading state: skeleton shimmer while spots load from API
- Offline: show cached spots, queue add/remove operations for sync

## T9: Spot Picker Bottom Sheet (Flutter)
**Files:** `apps/mobile/lib/features/itineraries/widgets/spot_picker_sheet.dart`
**SRS:** CRT-FR-003, CRT-FR-016, DD-028, DD-032
**Deps:** E1.1 T6 (places proxy)
**Acceptance:** Bottom sheet with: search input (Google Places autocomplete), 300ms debounce, results list showing place name + secondary text. "Powered by Google" attribution below search. Tap a result: fetch place details, show spot editor. Results biased to starting city location (lat/lng).
**Edge cases:**
- Minimum 2 chars to trigger search
- Empty results: "No places found. Try a different search." message
- Network error: "Search unavailable. Check your connection." with retry
- Rate limited (429): "Too many searches. Wait a moment and try again."
- Google attribution: "Powered by Google" must be visible per Google ToS
- Search results: max 5 predictions (Google Places API default)
- Keyboard: auto-focus search input when sheet opens
- Dismiss: swipe down or tap outside
- Sheet height: 60% of screen, expandable to 90%

## T10: Spot Editor Bottom Sheet (Flutter)
**Files:** `apps/mobile/lib/features/itineraries/widgets/spot_editor_sheet.dart`
**SRS:** CRT-FR-003, CRT-FR-016
**Deps:** T9 (spot picker), T5 (place cache)
**Acceptance:** After selecting a place, show spot editor with: place name (read-only), thumbnail (Google Places photo), creator note text input (max 500 chars, optional), duration picker (15min increments, 15min - 8h), stop type selector (5 options: regular, overnight, meal, viewpoint, activity). "Add spot" CTA saves spot to itinerary day via API.
**Edge cases:**
- Place with no photo: show generic category-based placeholder
- Creator note: optional, show helper "Add a personal tip or note for travelers"
- Duration: default to 60 min for regular, 480 min for overnight
- Stop type: default to 'regular', show icons for each type
- Overnight: only 1 per day recommended (show warning if adding 2nd overnight to same day)
- Save spot: show loading indicator on CTA, dismiss sheet on success
- API error on save: show error snackbar, keep sheet open
- Haptic feedback on stop type selection
- Duration picker: custom wheel picker or dropdown (not free-text input)
- Keyboard: dismiss when duration/stop-type controls are focused

## T11: Itinerary Detail Screen (Flutter)
**Files:** `apps/mobile/lib/features/itineraries/screens/itinerary_detail_screen.dart`, `apps/mobile/lib/features/itineraries/widgets/itinerary_map.dart`, `apps/mobile/lib/features/itineraries/widgets/spot_detail_card.dart`, `apps/mobile/lib/features/itineraries/providers/itinerary_detail_provider.dart`
**SRS:** CRT-FR-002, DD-023, DD-024
**Deps:** T2 (itinerary service), E0.4 (design system)
**Acceptance:** Map-first layout: top half is Google Map with spot pins, bottom half is scrollable content. Day tab bar (same as day builder but read-only). For each day: spot list cards showing thumbnail, name, note, duration, stop type. Map pins: overnight spots = larger coral pins, regular = ink/dark pins, activity = blue pins (DD-024). Tap pin: scroll to corresponding spot card. Tap spot card: center map on that spot. Creator header, engagement bar (like/comment/share/save). For paid: show "Unlock full itinerary" CTA (Day 1 visible, others locked).
**Edge cases:**
- Loading: skeleton shimmer for map + spot list
- Map: fit all pins of current day in view
- Day switch: animate map to fit new day's pins
- Paid + non-buyer: Day 1 spots shown, days 2+ show locked overlay with "X more spots" count
- Paid + buyer: all days/spots visible
- Free: all days/spots visible
- No spots: "This itinerary has no spots yet" (should not happen for published)
- Single spot: map centered on that spot, zoom level 14
- Many spots: auto-zoom to fit all in viewport with padding
- Offline: cache map tiles and spot data for recently viewed itineraries
- Accessibility: map has "X spots on map" semantic label, each pin is labeled

## T12: Itinerary Map Component (Flutter)
**Files:** `apps/mobile/lib/features/itineraries/widgets/itinerary_map_widget.dart`, `apps/mobile/lib/features/itineraries/widgets/custom_map_pin.dart`
**SRS:** DD-024
**Deps:** E0.4 (design system colors)
**Acceptance:** Google Maps widget with custom markers. Pin types: overnight (large coral circle with moon icon), regular (small dark/ink circle), meal (small with fork icon), viewpoint (small with eye icon), activity (small blue circle with lightning icon). Polyline connecting spots in order (dashed line). Map style: custom JSON style (light theme matching design system).
**Edge cases:**
- Custom markers: render as bitmap from Flutter canvas (not default Google markers)
- Polyline: dashed style between spots, solid between overnight spots
- Map controls: zoom buttons, current location button
- Map interaction: pinch to zoom, drag to pan, tap pin to select
- Selected pin: bounces and shows name label popup
- Performance: limit to 50 pins visible at a time (show cluster for more)
- Dark mode: separate map style JSON for dark theme
- Map padding: account for bottom content card overlap
- Initial camera: fit all spots of Day 1 with 50px padding

## T13: Itinerary Feed Card Widget (Flutter)
**Files:** `apps/mobile/lib/features/itineraries/widgets/itinerary_feed_card.dart`
**SRS:** CRT-FR-002
**Deps:** E0.4 (design system Card component)
**Acceptance:** Card with: cover image (16:9, from media or first spot photo), "ITINERARY" type badge, day count badge ("5 days"), spot count ("12 spots"), title (2 lines max), creator row, distance summary ("342 km"), price badge ("FREE" or "₹2,500"). Tap navigates to itinerary detail.
**Edge cases:**
- No cover image: use Google Maps static image with spot pins as thumbnail
- Static map thumbnail: generated on publish (or lazy on first view), cached as image URL
- Price badge: coral background for paid, green for free
- Day count badge: top-right corner overlay on image
- Long title: 2-line truncation with ellipsis
- Zero distance: hide distance line
- Haptic feedback on tap
- Skeleton shimmer loading variant

## T14: Itinerary Detail SSR Page (Web)
**Files:** `apps/web/src/app/content/[id]/page.tsx` (extend from E1.2 T9)
**SRS:** CRT-FR-002, DISC-FR-007
**Deps:** T3 (itinerary API)
**Acceptance:** Server-rendered itinerary detail. Shows: static map image with pins, day list with spot names, creator info, pricing. OpenGraph meta: title, first 160 chars of description, static map image or cover image, URL. For paid: show Day 1 spots only, "Unlock in the app" CTA. JSON-LD TravelGuide structured data.
**Edge cases:**
- Reuse the `/content/[id]/page.tsx` from E1.2 — detect content type and render appropriate layout
- Static map: use Google Maps Static API with markers (server-side URL construction)
- Paid itinerary: only show Day 1 spots (same as API behavior)
- No spots: show "View in app" CTA
- Deep link: "Open in CreatorHub" banner for mobile web visitors

## T15: Mount Itinerary Routes in App
**Files:** `apps/api/src/index.ts`
**SRS:** n/a
**Deps:** T3 (itinerary routes)
**Acceptance:** Add `app.route('/api/v1/itineraries', itinerariesRoutes)` to the main app. Import itineraries routes. Add `app.route('/api/v1/content', contentRoutes)` for shared content routes from E1.1.
**Edge cases:**
- Route ordering: content routes and itinerary routes are separate route groups
- Verify no path conflicts
- Rate limiting applies to all new routes
