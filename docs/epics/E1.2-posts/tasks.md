# E1.2 — Tasks

## T1: Post Zod Schema & Validation
**Files:** `packages/shared/src/schemas/post.ts`, `packages/shared/src/types/post.ts`
**SRS:** CRT-FR-001, CRT-FR-018
**Deps:** E1.1 T1 (base content schemas)
**Acceptance:** `CreatePostDraftSchema` extends base draft schema with `type: 'post'` fixed. `UpdatePostSchema` includes post-specific fields: `body` (max 1000 chars), `location_place_id` (optional). `PublishPostSchema` validates: title (5-100 chars), body (1-1000 chars), at least 1 image (via media check), vertical set. Export `PostDetail` type for API responses.
**Edge cases:**
- Body: strip leading/trailing whitespace, then validate length
- Body: reject if only whitespace or empty after trim
- Body: allow unicode, emoji, line breaks (count grapheme clusters)
- Title: required at publish, optional in draft
- No `price_paisa` field in post schema (always 0)
- No `pricing_model` field — always `free`
- Location: optional Google Place ID — validated against places cache if provided
- Tags: optional, max 5, each tag 2-30 chars, lowercase

## T2: Post Service
**Files:** `apps/api/src/services/post.service.ts`
**SRS:** CRT-FR-001, CRT-FR-008, DD-027
**Deps:** E1.1 T2 (content CRUD service), E1.1 T3 (state machine)
**Acceptance:** `createPostDraft(userId, input)` — calls content service with `type='post'`, `pricing_model='free'`, `price_paisa=0`. `getPostDetail(contentId, requesterId?)` — returns post with media, creator profile, like/save state for requester. `publishPost(contentId, userId)` — validates post-specific rules (body required, at least 1 image), then calls state machine. `updatePost(contentId, userId, input)` — validates post-specific fields.
**Edge cases:**
- Publish validation: title 5-100 chars, body 1-1000 chars, at least 1 image, vertical set
- Publish: NO KYC check (posts never require KYC, per DD-027)
- Publish: set `pricing_model='free'`, `price_paisa=0` regardless of input
- Get detail: include `is_liked`, `is_saved` booleans for authenticated requester
- Get detail: include creator `PublicProfile` (avatar, name, username, follower_count)
- Get detail: include `media` array ordered by `display_order`
- Get detail: 404 if post is deleted or requester is not owner and status != published
- List: support filtering by `vertical`, `user_id`, cursor pagination
- Update: reject if status is not `draft` (must unpublish first)

## T3: Post Handlers & Routes
**Files:** `apps/api/src/handlers/posts.ts`, `apps/api/src/routes/posts.routes.ts`
**SRS:** CRT-FR-001
**Deps:** E1.1 T4 (content routes), T2 (post service)
**Acceptance:** Routes: `POST /api/v1/posts` (create draft, auth required), `GET /api/v1/posts/:id` (detail, optionalAuth), `PUT /api/v1/posts/:id` (update, auth + owner), `POST /api/v1/posts/:id/publish` (publish, auth + owner), `GET /api/v1/posts` (list, optionalAuth, with filters). Handlers: thin — validate input with Zod, call service, return response.
**Edge cases:**
- Create: return 201 with `Location: /api/v1/posts/{id}` header
- Get detail: 200 for published (anyone) or owner's own content; 404 for non-owner accessing non-published
- Update: 200 with updated post; 403 if not owner; 422 if not draft status
- Publish: 200 with published post; 422 with validation error details listing each failing field
- List: default limit 20, max 50, cursor-based pagination with `next_cursor` and `has_more`
- List: guests see only published+public; authenticated users see their own + published+public
- Rate limit: 10 post creates per hour per user

## T4: Post Creation Wizard (Flutter — 3 steps)
**Files:** `apps/mobile/lib/features/posts/screens/post_wizard_screen.dart`, `apps/mobile/lib/features/posts/providers/post_wizard_provider.dart`
**SRS:** CRT-FR-001, CRT-FR-015
**Deps:** E1.1 T10 (wizard shell), E1.1 T11 (basics step)
**Acceptance:** 3-step wizard using E1.1 shell: Step 1 = Basics (title + description, using E1.1 basics step), Step 2 = Body & Media (text editor + image picker), Step 3 = Review & Publish (using E1.1 review step). On wizard start: create draft via API, receive content ID. Auto-save on step change and every 30s. On publish success: navigate to post detail screen.
**Edge cases:**
- Resume existing draft: if user has a post draft, ask "Continue draft?" or "Start new?"
- Start new: soft-delete old draft, create new one
- API error on draft create: show error, do not proceed to step 1
- Step 1 -> Step 2 transition: validate title is at least 5 chars
- Step 2 -> Step 3: validate body has at least 1 char and at least 1 image
- Wizard exit: "Discard changes?" if any unsaved changes; "Draft saved" toast if auto-saved recently
- Back navigation: each step retains state (no data loss)
- Content type fixed to 'post' — cannot change type mid-wizard

## T5: Post Body Editor (Flutter)
**Files:** `apps/mobile/lib/features/posts/widgets/post_body_editor.dart`
**SRS:** CRT-FR-001
**Deps:** E1.1 T11 (basics step pattern)
**Acceptance:** Multi-line text input (plain text for MVP) with live character counter (max 1000 chars). Counter shows X/1000 with color states: neutral < 850, warning 850-999, error at 1000. Input grows vertically as user types (no fixed height). Optional location tag: "Add location" chip that opens Places autocomplete bottom sheet.
**Edge cases:**
- Character counting: grapheme clusters (emoji = 1 char)
- Paste: truncate to 1000 chars, show "Text truncated" toast
- Empty body at publish time: show inline error "Write something before publishing"
- Line break handling: preserve line breaks in display, count as 1 char each
- Location tag: once added, shows as chip with place name + "x" to remove
- Location search: uses E1.1 Google Places autocomplete (via API)
- Keyboard: show character counter above keyboard when input is focused
- Scroll: input scrollable when content exceeds viewport
- Undo/redo: system default (platform-provided)

## T6: Post Media Step (Flutter)
**Files:** `apps/mobile/lib/features/posts/widgets/post_media_step.dart`
**SRS:** CRT-FR-001, CRT-FR-012
**Deps:** E1.1 T5 (media upload service)
**Acceptance:** Image grid (2 columns) showing selected images. "+" button to add images (opens photo picker). Max 5 images. First image auto-designated as hero/cover. Drag to reorder. Tap image for options (remove, set as cover). Upload progress shown per image. Images compressed client-side to max 1MB before upload.
**Edge cases:**
- No images: show "Add at least 1 image" prompt with illustration
- Max 5: "+" button hidden when 5 images selected, show "Maximum 5 images" toast if user tries to add more
- Upload failure: show retry button on failed image, red border indicator
- Upload in progress: show progress circle overlay on image thumbnail
- Reorder: drag-and-drop with haptic feedback
- Remove: confirm "Remove this image?" dialog (if already uploaded to server)
- Large images: compress to max 1MB or 1200px longest edge (whichever comes first)
- HEIC format: convert to JPEG on client before upload
- Permissions: handle photo library permission denied (show settings redirect)
- Image types: accept JPEG, PNG, WebP, HEIC

## T7: Post Detail Screen (Flutter)
**Files:** `apps/mobile/lib/features/posts/screens/post_detail_screen.dart`, `apps/mobile/lib/features/posts/widgets/post_hero_image.dart`, `apps/mobile/lib/features/posts/widgets/post_body_text.dart`, `apps/mobile/lib/features/posts/providers/post_detail_provider.dart`
**SRS:** CRT-FR-001, DD-026, DD-027
**Deps:** E1.1 T2 (content service), E0.4 (design system)
**Acceptance:** Full-screen scrollable layout: hero image (full-bleed, aspect ratio preserved), creator header (avatar + display name + follow button), body text in Fraunces 14px/1.65 line height, image gallery (if multiple images), location tag (if set), engagement bar (like + comment + share + save). No price display, no booking CTA (DD-027). Pull quotes styled in Fraunces italic.
**Edge cases:**
- Loading state: skeleton shimmer (not spinner) per UI rules
- Error state: "Post not found" with back button
- Image loading: blur placeholder hash (expo-image style, using cached_network_image or similar)
- No images: hide hero section, show body text with top padding
- Creator header: tap avatar/name navigates to creator profile
- Follow button: shown for non-self, optimistic update
- Like: tap heart icon, haptic feedback, optimistic count update
- Save: tap bookmark icon, add to default saved list
- Share: native share sheet with deep link URL
- Long body text: render all text (no "read more" truncation on detail page)
- Accessibility: semantic labels on all interactive elements
- Deep link: `/content/{id}` resolves to this screen

## T8: Post Feed Card Widget (Flutter)
**Files:** `apps/mobile/lib/features/posts/widgets/post_feed_card.dart`
**SRS:** CRT-FR-001
**Deps:** E0.4 (design system Card component)
**Acceptance:** Card with: cover image (16:9 aspect, rounded corners), "POST" type badge (top-left), title (max 2 lines, ellipsis), creator avatar + name row, engagement row (like count + comment count). Tap navigates to post detail screen. Consistent with design system Card component.
**Edge cases:**
- No cover image: show placeholder with post icon
- Long title: truncate with ellipsis after 2 lines
- Zero engagement counts: show "0" (not hidden)
- Creator avatar missing: show initial letter circle
- Haptic feedback on tap
- Card elevation/shadow per design system
- FlatList rendering: card must be efficiently renderable (no heavy computation in build)
- Skeleton variant: shimmer loading state while data loads

## T9: Post Detail SSR Page (Web)
**Files:** `apps/web/src/app/content/[id]/page.tsx`
**SRS:** CRT-FR-001, DD-026, DISC-FR-007
**Deps:** E1.1 T4 (content API)
**Acceptance:** Server-rendered post detail page. Fetches from API using server component. Renders: hero image, title, body text (Fraunces), creator info, engagement counts. OpenGraph meta tags: `og:title`, `og:description` (first 160 chars of body), `og:image` (cover image URL), `og:url`, `og:type=article`. Twitter Card meta tags. JSON-LD Article structured data.
**Edge cases:**
- Non-existent content: return 404 page
- Non-post content type: this page handles all content types (show appropriate layout per type)
- Body text: render plain text with preserved line breaks
- Image: serve optimized WebP via Next.js Image component
- No image: use default OpenGraph image
- Draft/unpublished content: return 404 for non-authenticated requests (web is public-only)
- SEO: `<title>` = post title + " | CreatorHub", `<meta name="description">` = first 160 chars

## T10: Mount Post Routes in App
**Files:** `apps/api/src/index.ts`
**SRS:** n/a
**Deps:** T3 (post routes)
**Acceptance:** Add `app.route('/api/v1/posts', postsRoutes)` to the main app file. Import posts routes. Ensure route is mounted after auth middleware but before error handler.
**Edge cases:**
- Verify no route conflicts with existing `/api/v1/content` routes (posts routes are a separate path)
- Verify rate limiting applies to `/api/v1/posts/*` routes
