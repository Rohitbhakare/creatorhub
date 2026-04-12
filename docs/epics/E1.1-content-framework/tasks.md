# E1.1 — Tasks

## T1: Content Zod Schemas & TypeScript Types
**Files:** `packages/shared/src/schemas/content.ts`, `packages/shared/src/types/content.ts`
**SRS:** CRT-FR-008, CRT-FR-012, CRT-FR-017, CRT-FR-018
**Acceptance:** Define Zod schemas for: `CreateContentDraftSchema` (type, vertical, title?, description?), `UpdateContentSchema` (partial fields), `PublishContentSchema` (validates all required fields per type), `ContentStatusTransition` (valid state transitions). TypeScript types exported from schemas via `z.infer`. Content status enum, content type enum, visibility enum, pricing model enum. Pricing calculator types (platform fee, GST, TDS, take-home).
**Edge cases:**
- Title: 5-100 chars when provided, optional in draft, required at publish
- Description: 0-280 chars
- Body (posts): 0-1000 chars
- Price: must be 0 for free content, must be > 0 for paid content, always in paisa
- Tags: array of strings, max 5 items, each max 30 chars, lowercase alphanumeric + hyphens
- `vertical` must be one of the 8 enum values
- `type` must be one of the 4 enum values
- Reject unknown fields (Zod strict mode)

## T2: Content CRUD Service
**Files:** `apps/api/src/services/content.service.ts`, `apps/api/src/db/queries/content.queries.ts`
**SRS:** CRT-FR-007, CRT-FR-008
**Acceptance:** `createDraft(userId, input)` — inserts a new content row with `status='draft'`. `getById(contentId, requesterId?)` — returns content with media, respects visibility/ownership. `update(contentId, userId, input)` — partial update, only owner can update, only drafts can be edited. `listByUser(userId, filters)` — cursor-paginated list. `softDelete(contentId, userId)` — sets `deleted_at`, only owner. `listDrafts(userId, type?)` — returns user's drafts, optionally filtered by content type.
**Edge cases:**
- Only owner can update/delete their content
- Cannot update published content directly (must unpublish first, or update specific fields like tags)
- `updated_at` used for optimistic concurrency: client sends `if_updated_at`, server rejects if mismatch
- Soft delete: sets `deleted_at`, does not remove row. Queries filter `WHERE deleted_at IS NULL`
- Draft listing returns most recent draft first
- Content with `status='rejected'` or `status='taken_down'` is not visible to public
- Guests can only see `status='published'` AND `visibility='public'` content
- Owner can see all their own content regardless of status
- List endpoint: cursor is base64-encoded `published_at|id` for stable pagination

## T3: Content State Machine Service
**Files:** `apps/api/src/services/content-state.service.ts`
**SRS:** CRT-FR-008
**Acceptance:** Validates and executes status transitions: `draft -> under_review -> published`, `published -> unpublished`, `published -> archived`, `unpublished -> draft` (re-edit), `unpublished -> archived`. Admin-only transitions: `any -> rejected`, `any -> taken_down`. Records transition in an audit log. Sets `published_at` on first publish. Clears `published_at` on unpublish.
**Edge cases:**
- Invalid transitions throw `AppError('invalid-transition', 422, ...)`
- Cannot publish if required fields are missing (type-specific validation)
- Cannot publish paid content if `kyc_status != 'verified'` (check user's KYC)
- Publish sets `published_at = now()` only on first publish; re-publish (unpublished -> draft -> published) keeps original `published_at`
- Re-publish after unpublish: goes through draft -> under_review -> published again
- `under_review` is currently a pass-through (auto-transitions to `published` in MVP). Moderation queue deferred to V1
- Archiving is permanent in MVP (no un-archive)
- T&Cs consent must be recorded before publish (CRT-FR-021)

## T4: Content CRUD Handlers & Routes
**Files:** `apps/api/src/handlers/content.ts`, `apps/api/src/routes/content.routes.ts`
**SRS:** CRT-FR-008, CRT-FR-014
**Acceptance:** Routes: `POST /api/v1/content` (create draft), `GET /api/v1/content/:id` (get by ID), `PUT /api/v1/content/:id` (update draft), `DELETE /api/v1/content/:id` (soft delete), `GET /api/v1/content/me/drafts` (my drafts), `POST /api/v1/content/:id/publish` (publish), `POST /api/v1/content/:id/unpublish`, `POST /api/v1/content/:id/archive`. Handlers follow thin pattern: validate -> call service -> respond.
**Edge cases:**
- Create draft: requires `authenticate` + user must have completed onboarding
- Get by ID: uses `optionalAuthenticate` — guests see published+public only, owner sees all their own
- Update: requires `authenticate`, only owner, only draft status
- Delete: requires `authenticate`, only owner
- Publish: requires `authenticate`, validates per-type requirements, checks KYC for paid
- Rate limit: 20 creates per hour per user (prevent spam)
- Response includes `Location` header on 201 (create)
- Publish returns 200 with updated content (or 422 with validation errors listing missing fields)

## T5: Media Upload Service (Enhanced)
**Files:** `apps/api/src/services/media.service.ts`, `apps/api/src/handlers/media.ts`, `apps/api/src/routes/media.routes.ts`
**SRS:** CRT-FR-012
**Acceptance:** `POST /api/v1/media/signed-url` — generates Firebase Storage signed upload URL. `POST /api/v1/media/confirm` — client calls after upload completes, server validates file exists, creates `content_media` row. `DELETE /api/v1/media/:mediaId` — removes media from content (owner only). Supports: image/jpeg, image/png, image/webp, video/mp4. Size limits: image 10MB, video 100MB. Purpose-based storage paths.
**Edge cases:**
- Max images per content type: 5 for posts, 10 for itineraries/experiences/events
- Reject if adding media would exceed limit for the content type
- Signed URL expires in 15 minutes
- Confirm endpoint: verify file exists in Firebase Storage before creating DB row
- EXIF GPS data must be stripped server-side after upload (privacy)
- HEIC files: convert to JPEG server-side
- Display order: auto-increment within content, allow reorder via PUT
- Orphaned uploads (signed URL generated but never confirmed): cleanup via cron job (deferred to V1)
- File name sanitization: strip special chars, limit length
- Content-Type header validation: must match declared MIME type

## T6: Google Places Proxy (Enhanced)
**Files:** `apps/api/src/services/places.service.ts`, `apps/api/src/handlers/places.ts`, `apps/api/src/routes/places.routes.ts`
**SRS:** CRT-FR-016, DD-028
**Acceptance:** `GET /api/v1/places/autocomplete?input=...&lat=...&lng=...` — proxies Google Places Autocomplete, biased to India. `GET /api/v1/places/:placeId` — proxies Google Places Details, returns name, coordinates, address, photos, rating. Cache place details in `place_cache` table after first fetch. Rate limit: 100 requests per creator per hour. "Powered by Google" attribution requirement documented.
**Edge cases:**
- Autocomplete: minimum 2 chars input, 300ms debounce on client side
- Autocomplete: return max 5 predictions (Google default)
- Autocomplete: `componentRestrictions: { country: 'in' }` for India bias (but allow international places)
- Place details: cache in DB for 30 days, serve from cache on subsequent requests
- Place details: extract `photo_reference` URLs for spot thumbnails
- Rate limit key: `places:{userId}` — per-creator, not per-IP
- Rate limit exceeded: return 429 with `Retry-After` header
- Google API error: return 502 with generic error, log actual Google error server-side
- Google API key rotation: support multiple keys via env var array
- Empty autocomplete results: return empty array, not error
- Invalid placeId: return 404

## T7: T&Cs Consent Service
**Files:** `apps/api/src/services/tnc.service.ts`, `apps/api/src/db/queries/tnc.queries.ts`
**SRS:** CRT-FR-021
**Acceptance:** `recordConsent(userId, contentId, tncVersion, ipAddress, userAgent)` — records consent in `tnc_versions` table. Called during publish flow. `hasConsented(userId, contentId)` — checks if user has already consented for this content. T&Cs version string is a semver (e.g., "1.0.0"), comes from server config.
**Edge cases:**
- Consent must be recorded before status can transition to `published`
- Re-publishing after unpublish requires fresh consent (new row, new timestamp)
- IP address: extract from `X-Forwarded-For` header (behind Cloudflare/Fly proxy)
- User agent: extract from `User-Agent` header
- Consent is content-specific (one per content publish, not one per user)
- Consent record is immutable: never updated, never deleted
- If user publishes, unpublishes, edits, and re-publishes: new consent row required

## T8: Pricing Calculator Utilities
**Files:** `packages/shared/src/utils/pricing.ts`
**SRS:** CRT-FR-017, CRT-FR-023
**Acceptance:** `calculatePricing(basePricePaisa)` — returns `{ basePricePaisa, gstPaisa, totalPricePaisa, platformFeePaisa, tdsPaisa, creatorTakeHomePaisa }`. Platform fee: 17%. GST: 18% on base price. TDS: 1% on creator payout (Sec 194-O). All calculations use integer arithmetic (no floating point). Export `formatPrice(paisa)` — returns "₹6,500" or "FREE" for 0.
**Edge cases:**
- Zero price: return all zeros, no division
- Negative price: throw error (prices are always >= 0)
- Very small price (e.g., 100 paisa = ₹1): ensure all computed values are non-negative integers
- Rounding: always round platform fee, GST, TDS up (ceiling) — creator never overpaid
- Maximum price: 10,00,000 paisa (₹10,000) for MVP — enforce in validation
- `formatPrice`: use Indian number formatting (12,34,567) not Western (1,234,567)
- `formatPrice`: return "FREE" for 0 paisa, not "₹0"

## T9: Content Type Picker Screen (Flutter)
**Files:** `apps/mobile/lib/features/content/screens/content_type_picker_screen.dart`, `apps/mobile/lib/features/content/widgets/content_type_card.dart`
**SRS:** CRT-FR-014
**Acceptance:** Screen shows 4 cards in a 2x2 grid: Post (icon: pencil-simple), Event (icon: calendar-check), Scheduled Experience (icon: compass), Self-paced Itinerary (icon: map-trifold). Each card shows: icon, title, one-line description, KYC badge ("Requires KYC" for paid types). Tapping a card navigates to the type-specific wizard. Entry points: Studio tab (for non-creators or no drafts), "+" FAB in Studio.
**Edge cases:**
- If user has onboarding incomplete: redirect to onboarding, not content picker
- KYC badge shown on: Scheduled Experience (always paid), Event (if creator intends paid). For post and itinerary, show "No KYC needed" or "KYC needed for paid" respectively
- Haptic feedback on card tap
- Cards use category-specific colors (not gray)
- If a content type is disabled/deferred: show card with "Coming soon" badge, disable tap
- Scheduled Experience card: show "Coming in M2" badge since it's deferred
- Screen has SafeAreaView wrapper
- Back button: return to Studio dashboard or previous screen

## T10: Publishing Wizard Shell (Flutter)
**Files:** `apps/mobile/lib/features/content/screens/wizard_shell_screen.dart`, `apps/mobile/lib/features/content/widgets/wizard_step_indicator.dart`, `apps/mobile/lib/features/content/providers/wizard_provider.dart`
**SRS:** CRT-FR-015
**Acceptance:** Reusable wizard shell with: step indicator (progress bar at top showing current/total steps), step title, body content slot (per-step widget), Back/Next navigation bar at bottom. Steps are configurable per content type (3 for posts, 6 for itineraries, etc.). Draft auto-save triggers on step change and every 30 seconds. Wizard can be abandoned (confirm dialog) and resumed from last completed step.
**Edge cases:**
- Back on first step: show "Discard draft?" confirmation dialog
- Next button disabled until current step passes validation
- Step indicator: coral fill for completed steps, outline for current, gray for future
- Auto-save: debounced 30s timer, resets on user input. Show "Saving..." / "Saved" / "Save failed" indicator
- Auto-save failure: show snackbar with retry, do NOT block user progress
- Resume: if user has existing draft of this type, ask "Continue draft?" or "Start new?"
- One active draft per content type per user in MVP — creating new discards old draft (with confirmation)
- Network loss during save: queue save, retry when back online
- Wizard state managed by Riverpod notifier (not widget state)
- Keyboard handling: auto-scroll to active input, dismiss keyboard on tap outside
- Step transition animation: 200ms slide

## T11: Basics Step Component (Flutter)
**Files:** `apps/mobile/lib/features/content/widgets/steps/basics_step.dart`
**SRS:** CRT-FR-018
**Acceptance:** Title input (5-100 chars) with live character counter below. Description input (0-280 chars) with live character counter. Counter color: neutral at < 85%, warning (amber) at 85-99%, error (red) at 100%. Vertical selector (pre-filled if coming from vertical-specific context). Sub-category picker (loads sub-categories for selected vertical).
**Edge cases:**
- Character counter: counts grapheme clusters, not bytes (emoji = 1 char)
- Title validation: strip leading/trailing whitespace before counting
- Title too short: show inline error "Title must be at least 5 characters"
- Description is optional in draft, but recommended — show helper text
- Vertical selector: only show verticals the user has in `active_verticals`
- Sub-category: optional field, loads from API based on selected vertical
- Input persistence: values survive step back-and-forth (stored in wizard state)
- Paste handling: truncate pasted text to max length, show toast "Text truncated to fit"

## T12: Pricing Step Component (Flutter)
**Files:** `apps/mobile/lib/features/content/widgets/steps/pricing_step.dart`
**SRS:** CRT-FR-017, CRT-FR-023
**Acceptance:** Freemium toggle (default varies by content type: free for posts/itineraries, paid for experiences). When paid: price input field (in rupees, stored as paisa), GST line item ("+ ₹X GST"), total price to buyer, platform fee line, TDS line, creator take-home preview. All computed live with 500ms debounce. When free: price input hidden, show "This content is free for everyone."
**Edge cases:**
- Price input: numeric keyboard, rupee symbol prefix, max ₹10,000 for MVP
- Price input: reject non-numeric input, strip commas/spaces
- Zero or empty price when "Paid" selected: show validation error "Enter a price"
- KYC interrupt: if user toggles to "Paid" but `kyc_status != 'verified'`, show KYC bottom sheet
- KYC bottom sheet: "Verify your identity to publish paid content" with CTA to KYC flow
- Take-home preview: `price - (price * 0.17) - ((price - price * 0.17) * 0.01)` — show as "You earn ₹X per sale"
- GST line: "₹X GST (18%) added at checkout — paid by buyer"
- For posts: this step is skipped entirely (posts are always free)
- Very small price: warn if take-home < ₹50 ("Consider a higher price for better earnings")

## T13: Review & Publish Step Component (Flutter)
**Files:** `apps/mobile/lib/features/content/widgets/steps/review_step.dart`
**SRS:** CRT-FR-020, CRT-FR-021
**Acceptance:** Two sections: (1) Validation checklist — each required field as a check/fail item with field name and status icon. (2) Full-page preview rendered with actual detail-page components using draft data, wrapped in "PREVIEW" banner overlay. Publish CTA pinned to bottom, disabled until: all validation items pass AND T&Cs checkbox is ticked. T&Cs checkbox: unticked by default, links to T&Cs page.
**Edge cases:**
- Validation items vary by content type (post: title, body, at least 1 image; itinerary: title, at least 1 day with spots, etc.)
- Failed validation items: tappable, scrolls to the relevant step
- T&Cs checkbox: unticked by default on every publish attempt (never pre-filled)
- T&Cs link: opens in-app webview or bottom sheet with T&Cs text
- Publish button: shows loading spinner during publish API call
- Publish success: show celebration animation, navigate to published content detail
- Publish failure: show error snackbar with specific reason, keep user on review step
- If network error during publish: show retry button, draft is safe (already saved)
- Preview banner: coral background, white text "PREVIEW", semi-transparent overlay
- Scroll position: preview section scrollable independently

## T14: Draft Auto-Save Service (Flutter)
**Files:** `apps/mobile/lib/features/content/services/draft_auto_save_service.dart`
**SRS:** CRT-FR-007
**Acceptance:** Timer-based auto-save: fires PUT /content/:id every 30 seconds if there are unsaved changes. Debounced: resets timer on each user input. Shows save status indicator: "Saving...", "Saved", "Save failed — tap to retry". Uses optimistic concurrency (`if_updated_at` header). Queues save if offline, retries when back online.
**Edge cases:**
- No-op if no changes since last save (compare local state hash)
- Conflict detection: if server `updated_at` differs from expected, show "Content was modified elsewhere — reload or overwrite?"
- Offline: queue save, show "Will save when online" status
- Multiple rapid saves: only the latest wins (cancel in-flight request on new save)
- Save during publish: cancel auto-save, let publish take priority
- App backgrounded: trigger immediate save before going to background
- App killed: latest auto-saved state should be recoverable on next launch
- Save indicator: positioned in app bar, non-intrusive
