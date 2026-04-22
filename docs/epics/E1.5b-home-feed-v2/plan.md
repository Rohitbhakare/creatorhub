# E1.5b — Home Feed v2: magazine-hybrid, Airbnb-inspired cards

> Goal: fix the 4 P0 structural drifts in `E1.5-home-feed/wireframe-diff.md`
> and rebuild Home as the main-engagement screen it needs to be.
> Reference: Airbnb mobile (no card chrome, photo-first, compact meta).

---

## Data dependencies — ALL EXIST ✓

Verified in schema:
- `follows` table — follower/following edges (migration 007)
- `content.like_count`, `comment_count`, `save_count`, `view_count` — denormalized counters
- `content.duration_minutes` — for itineraries/experiences
- `content.featured` + `editorial_collections` — manual editor-pick already wired
- `content.published_at` — for "2h ago" age formatting

No schema changes needed. Pure app-layer work.

---

## Final Layout Spec

```
┌──────────────────────────────────────────┐
│ 📍 Mumbai ▾                    🔍   🔔   │  Top bar (52h)
├──────────────────────────────────────────┤
│ [ For you │ Following │ Near you ]       │  Segmented (36h, 12y pad)
├──────────────────────────────────────────┤
│                                          │
│  ╔════════════════════════════════════╗  │  HERO (context-aware per tab)
│  ║ [   Big photo — 220h × full-w   ] ║  │  - full bleed at ~20px page pad
│  ║                                    ║  │  - coral eyebrow: "FEATURED" /
│  ║   FEATURED · ITINERARY             ║  │    "POPULAR WITH YOUR FOLLOWS" /
│  ║   Three days in the Coorg mist     ║  │    "TRENDING NEAR YOU"
│  ║   Ananya Rao · 8 min · ❤ 342       ║  │  - gradient overlay on photo
│  ╚════════════════════════════════════╝  │  - title overlay on photo
│                                          │    (Fraunces 22, white)
├──────────────────────────────────────────┤
│                                          │
│  NEAR YOU · THIS WEEKEND           →     │  Section header
│  ┌─────────┐┌─────────┐┌─────  (peek)    │  Rail — 2 cards visible + peek
│  │ [photo] ││ [photo] ││ [photo]         │  Card width: (screen - 20 - 20 - 12) / 2
│  │ 1:1     ││ 1:1     ││                 │  = ~171w on 375 screen
│  │         ││         ││                 │  Photo aspect 1:1
│  │ Title   ││ Title   ││                 │
│  │ ₹1,200·★││ Free ·★ ││                 │
│  └─────────┘└─────────┘└─────            │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  TRAVEL · For you                  →     │  Vertical feed — depth
│  ┌────────────────────────────────────┐  │  Card: full-width edge-to-edge
│  │                                    │  │    minus 20px page padding
│  │  [ photo — 3:2 aspect, ~230h ]     │  │  No border, no shadow (shadow on
│  │                            ♡ save │  │    press only)
│  │                                    │  │
│  │  Ananya Rao · 2h · Bengaluru       │  │  Creator + age + city (11px muted)
│  │  Where to eat breakfast in old     │  │  Title — Fraunces 19, 2 lines max
│  │  Bangalore                         │  │
│  │  ❤ 342  💬 28  ⏱ 6 min read        │  │  Engagement meta (11px muted)
│  └────────────────────────────────────┘  │
│  (card 2)                                │  3 items by default
│  (card 3)                                │  "See all" pushes to full list
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  STORIES WORTH READING             →     │  Rail — breadth (fewer items)
│  [cards as above]                        │
│                                          │
├──────────────────────────────────────────┤
│  DISCOVER · Creators in other niches →   │  Existing Discover section
│                                          │
├──────────────────────────────────────────┤
│  [Honesty footer — keeps DISC-FR-001]    │
└──────────────────────────────────────────┘
```

---

## Top Bar (52h)

- **Background**: `bg` (pure white), bottom 0.5px `hairline` divider
- **Left**: Location chip (padded 12x7, `surfaceAlt` bg, coral pin + city name + ▾)
  - Tap opens LocationPickerScreen (existing bottom sheet)
  - **This is the primary affordance** — travel is location-first
- **Right icons** (36x36, `surfaceAlt` circle):
  - 🔍 Search — pushes to `/search` (placeholder OK for MVP)
  - 🔔 Bell — pushes to `/notifications` (placeholder OK)

**Why no wordmark:** Per user decision — location is more critical than branding
for this vertical. Wordmark can live on Welcome/Auth and profile header instead.

---

## Segmented Tabs

- **Height**: 36dp, full-width pills layout
- **Container**: 20x8 padding, `surfaceAlt` track with radius 20
- **Active pill**: `ink` bg, `surface` text, radius 16, horizontal 14y padding, AnimatedContainer 150ms
- **Inactive**: transparent, `inkSoft` text
- **Labels**: "For you" · "Following" · "Near you" — Inter 13, 600 weight

### Tab behavior

| Tab | Hero eyebrow | Feed source | Empty state |
|-----|-------------|-------------|-------------|
| For you | "FEATURED" | Option C algo (see below) | "Pick a vertical to personalize" → /onboarding/verticals |
| Following | "POPULAR WITH YOUR FOLLOWS" | `follows` join + content latest | "Follow creators to see their work here" + [Discover] button |
| Near you | "TRENDING NEAR YOU" | Existing near-you RPC | "Set a city to see nearby" → /location-picker |

Hero **changes per tab**. Vertical feed below **changes per tab**. Horizontal rails
(Near you, Stories) stay consistent across tabs — they're secondary discovery.

---

## "For you" Algorithm (Option C — MVP version)

Not full ML ranking, but stronger than raw popularity. Server-side SQL:

```
WITH followed_content AS (
  SELECT c.*, 2 AS weight, 'follow' AS source
  FROM content c
  JOIN follows f ON f.following_id = c.user_id
  WHERE f.follower_id = :user_id
    AND c.status = 'published'
    AND c.published_at > now() - interval '30 days'
),
vertical_content AS (
  SELECT c.*, 1 AS weight, 'vertical' AS source
  FROM content c
  JOIN user_active_verticals uv ON uv.vertical = c.vertical
  WHERE uv.user_id = :user_id
    AND c.status = 'published'
    AND c.published_at > now() - interval '60 days'
),
combined AS (
  SELECT DISTINCT ON (id) *,
    (weight * 10) + LEAST(like_count, 500) AS rank_score
  FROM (SELECT * FROM followed_content UNION ALL SELECT * FROM vertical_content) u
  ORDER BY id, weight DESC
)
SELECT * FROM combined
ORDER BY rank_score DESC, published_at DESC
LIMIT 20;
```

- Followed creators weighted 2x
- Within each bucket, `like_count` breaks ties (capped at 500 so one viral post doesn't dominate)
- Freshness cutoff (30d for follows, 60d for verticals)
- No user = fall back to vertical-only (or all-popular if no verticals)

This is transparent, cacheable, and testable. Upgrade to embeddings later.

---

## Airbnb-Inspired Card Spec

### Universal rules (both variants)

- **Zero card border, zero card shadow at rest** — photo + text in page
- **Photo**: coral-tinted placeholder during load (not gray)
- **Save icon** top-right of photo: 32x32 white-95% circle, bookmark icon ink at rest, coral filled when saved
- **Type pill** top-left of photo: white-95% bg, 10px ink text, 600 weight, ALL CAPS, radius 999 (pill)
- **Tap state**: scale(0.98) + light haptic
- **Placeholder image**: coral-tinted gradient (not gray — adds warmth)

### Rail card (horizontal scroll — 175w × 1:1 photo)

```
┌───────────────────┐
│ POST        ♡     │  photo: 175 × 175 (1:1)
│                   │  corner radius 12
│   [photo]         │  type pill 10px, save icon 32x32
│                   │
├───────────────────┤  no visible divider
│ Title 2 lines     │  title: Inter 14 / 600
│ ellipsis          │  color: ink
│ ₹1,200 · ★ 4.9    │  meta: Inter 13 / 500, ink for price, muted for rating
│ Ananya · 2h       │  submeta: Inter 11 / 400, muted
└───────────────────┘
(8px gap)
```

**Width calc**: `(screenWidth - 20 left pad - 20 right pad - 12 gap) / 2 = 171.5w` on 375 screen.
This shows exactly 2 full cards + ~15% peek of the third — the airbnb pattern.

**Section padding**: 20px left/right for first/last, 12px gap between.

### Vertical card (full-width, 3:2 photo)

```
┌──────────────────────────────────────┐
│ [photo — 3:2, ~230h × screen-40w]  ♡ │  photo radius 14, full-width (minus page pad)
│ ITINERARY                            │  type pill top-left
├──────────────────────────────────────┤  8px gap photo→body
│ Ananya Rao · 2h ago · Bengaluru      │  meta: Inter 12 / 500, muted
│ Where to eat breakfast in old        │  title: Fraunces 19 / 600, 2 lines
│ Bangalore                            │    leading 1.2
│ ❤ 342  💬 28  ⏱ 6 min read            │  engagement: Inter 12 / 500, muted
│                                      │  price (only if paid): right-aligned, ink, 14/700
└──────────────────────────────────────┘
(20px gap between cards)
```

**Engagement row hierarchy:**
- Heart count (always shown)
- Comment count (when > 0)
- Read time (posts/itineraries) / duration (experiences/events)

---

## Hero Card

- **Full-width** (minus 20px page padding)
- **Photo**: 220h, aspect ~16:9 to 16:10
- **Corner radius**: 16
- **Photo overlay**:
  - Gradient bottom-up: `transparent 30% → rgba(0,0,0,0.65) 100%`
  - Coral eyebrow top-left of overlay (11px mono, uppercase, letter-spacing 1.5)
  - Title bottom-left (Fraunces 22, white, 600, 2 lines max)
  - Creator + meta below title (Inter 13, rgba(255,255,255,0.85))
- **Save icon** top-right on photo (32x32 white-95% circle)
- **Tap**: opens content detail via existing openFeedItem helper
- **Data source per tab**:
  - For you → SQL picks highest-ranking from Option-C result (reuses feed)
  - Following → highest-liked from follows (30d window)
  - Near you → highest-liked within near-you fallback

---

## Tasks

### Backend (apps/api)

- [ ] **T1** `GET /api/v1/feed/for-you` — implement Option-C SQL, auth required
- [ ] **T2** `GET /api/v1/feed/following` — follows-joined content, auth required, empty=200
- [ ] **T3** `GET /api/v1/feed/hero?tab=for_you|following|near_you` — returns single top item
- [ ] **T4** Update `feed.service.ts` — add `forYou()`, `following()`, `heroFor(tab)` service fns
- [ ] **T5** Add unit tests for each service fn (mock-free integration tests)

### Mobile (apps/mobile)

- [ ] **T6** New shared widget: `ContentCard` with `variant: rail | vertical` prop
  - Handles photo, type pill, save icon, meta, engagement row
  - Save icon hooks to existing save-to-list sheet
- [ ] **T7** New `HeroCard` widget — full-width, photo-overlay title, coral eyebrow
- [ ] **T8** New `SegmentedTabs` shared component (reusable, not just Home)
- [ ] **T9** Rewrite `home_feed_screen.dart`:
  - Location-first top bar (no wordmark)
  - SegmentedTabs below top bar
  - Hero (changes per tab)
  - NearYouSection → convert to 2-card-peek rail variant
  - VerticalSection (Travel) → vertical feed variant, 3 items
  - VerticalSection (Stories) → rail variant
  - DiscoverSection (no change)
  - HonestyFooter (no change)
- [ ] **T10** New `for_you_provider` + `following_provider` + `hero_provider(tab)`
- [ ] **T11** Age formatter: `timeAgo(DateTime)` → "2h" / "yesterday" / "3 days ago"
- [ ] **T12** Update `feed_content_card.dart` — deprecate in favor of T6's ContentCard
- [ ] **T13** Empty states for Following tab + For-you tab when no verticals

### Tests

- [ ] **T14** Widget tests for ContentCard (both variants), HeroCard, SegmentedTabs
- [ ] **T15** Integration test: tab switch changes hero + feed
- [ ] **T16** Screenshot parity: home-foryou, home-following, home-nearyou, home-scroll

### Docs

- [ ] **T17** Update `docs/engineering/openapi.yaml` with new endpoints
- [ ] **T18** Fill tracking.md per precommit.md template, including Screenshot Parity table
- [ ] **T19** Mark E1.5 wireframe-diff.md items P0.1-P0.4 resolved

---

## Acceptance criteria

- All 3 tabs render on iPhone 007 with real content
- Tapping a tab swaps hero + vertical feed with smooth 200ms cross-fade
- Horizontal rails show exactly 2 cards + peek on 375w screen, 2.2+ on bigger
- Save icon works on every card (both variants + hero) — persists to saved_list
- Empty states copy and CTAs match the table above
- `flutter analyze`: 0 issues
- `pnpm test`: all green
- Screenshot parity table has `[x]` for all 4 screens in tracking.md

---

## Risks & decisions

- **R1**: "For you" algorithm may return 0 results for users with no follows + no verticals
  → **Decision**: fall back to all-popular-in-India, eyebrow changes to "POPULAR ACROSS INDIA"
- **R2**: Rail 2-card-peek looks different on 320w (iPhone SE) vs 428w (iPhone 15 Pro Max)
  → **Decision**: card width = `(screenWidth - 52) / 2` — scales proportionally
- **R3**: Vertical feed pushes the page very long — bundled with horizontal rails
  → **Decision**: cap vertical feed at 3 items, "See all" takes user to full grid (already built)

---

## Out of scope (future)

- Quest strip (GAM-FR, SRS marks V1-preview optional)
- Infinite-scroll pagination on vertical feed (current: fixed 3 items)
- Pull-to-save gesture on rail cards
- Live engagement counts (ws push) — current: snapshot at fetch time
- A/B test framework for ranking formula
