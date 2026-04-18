# UI/UX Instructions

> Read this before writing any Flutter or Next.js UI code. These rules are non-negotiable.

## Stack

- **Mobile:** Flutter 3.22+ (Dart)
- **Web (MVP minimal):** Next.js 14+ App Router (TypeScript, Tailwind CSS)
- **Design reference (canonical):** `docs/01_wireframes/v2/` — read `v2/README.md` first, then the relevant `v2/project/pack-*.jsx`
- **Pack ship order:** `docs/01_wireframes/v2/project/CreatorHub Redesign.html`
- **Tokens & primitives (React reference):** `v2/project/design-system.jsx` + `components-primitives.jsx` + `components-chrome.jsx`
- **Flutter primitives already live in:** `apps/mobile/lib/shared/components/` — reuse these; do not mirror React structure
- **Archived (do not implement against):** `docs/01_wireframes/archive/v1/`

---

## 1. Design System — The Rules

### Color Palette (Monochrome + 1 Accent)

| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `#FAF7F4` | Page background |
| `sunken` | `#F2EEE8` | Chips, inactive tiles, secondary surfaces |
| `border` | `#E5E0D7` | All borders and dividers |
| `line` | `#C9C3B6` | Heavier dividers, drag handles |
| `softInk` | `#9C9689` | Metadata, counts, placeholders |
| `muted` | `#6B6660` | Secondary text, subheads |
| `ink` | `#2C2823` | Primary text, filled pills, icons |
| `coral` | `#E15A41` | **8 specific contexts ONLY (see below)** |

**Semantic colors (functional states ONLY — never decorative):**
- Success: `#1D9E75` (verified badges, confirmed bookings)
- Warning: `#BA7517` (caution flags, disputed bookings)
- Danger: `#C2362F` (error toasts, cancelled bookings)
- Info: `#185FA5` (informational states)

### The 8 Coral Contexts (DD-013 — strictly enforced)

Coral (`#E15A41`) is used in EXACTLY these 8 places. Any other use is a bug:

1. Primary CTA button (only one per screen)
2. Active save/bookmark icon (filled state)
3. Location pin icon (city cards + top bar)
4. Active bottom tab indicator
5. Overnight stop pin on itinerary maps
6. Active Studio tab icon
7. Unread notification/alert badge
8. Booking status "In Progress" pill

**If you find yourself using coral anywhere else — stop. Use `ink` or `muted` instead.**

### Typography

| Style | Font | Size | Weight | Line Height |
|-------|------|------|--------|-------------|
| Display | Fraunces | 34px | 700 | 1.18 |
| H1 | Fraunces | 28px | 700 | 1.21 |
| H2 | Fraunces | 24px | 600 | 1.25 |
| H3 | Inter | 20px | 600 | 1.3 |
| H4 | Inter | 17px | 600 | 1.35 |
| Body Large | Inter | 16px | 400 | 1.5 |
| Body | Inter | 15px | 400 | 1.53 |
| Body Small | Inter | 13px | 400 | 1.54 |
| Post body | **Fraunces** | 14px | 400 | **1.65** |
| Caption | Inter | 12px | 400 | 1.4 |
| Label | Inter | 11px | 600 | 1.27 |

**Rule:** Fraunces is for Display, H1, H2, section headers, and post body text ONLY. Everything else uses Inter. No exceptions.

### Icons

- **Library:** Phosphor Icons
- **States:** Outline = inactive, Fill = active
- **Vertical icons:** Travel=Mountains, Stories=BookOpen, Food=ForkKnife, Fitness=Barbell, Photography=Camera, Wellness=Sun, Music=MusicNotes, Education=GraduationCap

---

## 2. Component Rules

### Import from theme — never hardcode

```dart
// Good
Text('Hello', style: AppTypography.h3)
Container(color: AppColors.surface)

// Bad — hardcoded values
Text('Hello', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600))
Container(color: Color(0xFFFAF7F4))
```

### Shared components — use them

Use components from `lib/components/common/`. Never create inline styled alternatives.

- `AppButton` — variants: primary (coral filled), secondary (outline), ghost (text only), danger (red filled)
- `AppCard` — warm-tinted shadows, border radius 12px
- `AppInput` — with label, error state, helper text
- `AppBottomSheet` — use `@gorhom/bottom-sheet` pattern (never Modal)
- `AppChip` — selectable, with scale animation
- `ContentCard` — polymorphic (post, itinerary, event, scheduled experience)
- `SkeletonLoader` — shimmer effect for loading states

### Button Rules

- **Disabled:** opacity 0.4, never faded colors
- **One primary CTA per screen** — the rest are secondary or ghost
- **Haptic feedback** on all pressable elements (`HapticFeedback.lightImpact()`)

### Loading States

- **Always:** Skeleton shimmer (1.6s loop, `#EBEADF` → `#D8D5C9` → `#EBEADF`)
- **Never:** ActivityIndicator, CircularProgressIndicator, spinners
- Skeleton shape should match the content layout it replaces

### Empty States

- Always: illustration + title + description + optional CTA
- Never: just gray text or blank screen
- Example: "No saved trips yet" + mountain illustration + "Explore experiences" button

### Lists

- **Always:** `ListView.builder` / `SliverList` with lazy loading
- **Never:** `Column` + `.map()` for dynamic content (kills performance)
- Pull-to-refresh on all list screens

### Images

- **Flutter:** `cached_network_image` with blurhash placeholder
- **Never:** raw `Image.network` (no caching, no placeholder)
- Always provide `width` and `height` to prevent layout shift

---

## 3. Layout Rules

### SafeArea

Every screen root MUST be wrapped in `SafeArea`:

```dart
@override
Widget build(BuildContext context) {
  return SafeArea(
    child: Scaffold(
      // ...
    ),
  );
}
```

### Bottom Tab Bar

5 tabs, always visible for authenticated users:

| Position | Tab | Icon (Phosphor) | Active Color |
|----------|-----|-----------------|--------------|
| 1 | Home | House | coral |
| 2 | Discover | MagnifyingGlass | coral |
| 3 | Studio | PencilSimple | coral (raised circle) |
| 4 | Saved | BookmarkSimple | coral |
| 5 | You | User | coral |

- Center "Studio" tab has a raised circular button
- Labels always visible (not hidden on inactive)
- Active state: coral icon + label, inactive: `muted`

### Responsive (Web — Tailwind Breakpoints)

```
sm: 640px  | md: 768px  | lg: 1024px  | xl: 1280px
```

- Mobile web (< 768px): bottom tab bar
- Desktop (>= 1024px): side nav
- Layout changes only — colors, typography, components stay identical (DD-040)

---

## 4. Animations

All animations are snappy, not decorative:

| Animation | Duration | Easing | Details |
|-----------|----------|--------|---------|
| Card press | 120ms | easeInOut | scale 1.0 → 0.97 → 1.0 |
| Section entrance | 200ms | easeOut | fade + 8px slide-up, 80ms stagger between items |
| Bottom sheet | 240ms | cubic-bezier(0.32, 0.72, 0, 1) | iOS native curve |
| Loading shimmer | 1600ms | linear loop | gradient sweep |
| Chip select | 120ms | easeInOut | scale 1.0 → 1.03 → 1.0 |
| Page transition | 300ms | easeInOut | slide from right (default Flutter) |

- **Flutter:** `flutter_animate` for declarative animations
- **Lottie:** celebration moments only (onboarding complete, booking confirmed)
- **No animations > 300ms** — this is an app, not a landing page

---

## 5. Content Formatting

### Duration

Always use human-readable format:
- "4 days" not "5760 min"
- "2 hours" not "120 min"
- "30 min" (only if under 1 hour)

### Price

Always formatted with INR symbol and commas:
- `"₹6,500"` not `"6500"` or `"Rs. 6500"`
- `"FREE"` for zero-price content (uppercase, green badge)
- Amounts arrive from API in paisa — client divides by 100 for display

### Category Badges

Always use category-specific colors (defined in theme), never gray.

---

## 6. Accessibility

- Minimum tap target: 44x44 dp
- Text scales to 200% without clipping
- Color contrast: 4.5:1 minimum (WCAG 2.1 AA)
- All images have semantic labels / alt text
- Screen reader support: use `Semantics` widget in Flutter
- Focus order follows visual order

---

## 7. Platform-Specific

### Flutter (Mobile)

- State management: Riverpod (or Zustand equivalent — decide in HLD)
- Navigation: GoRouter (declarative, deep-link support)
- Font loading: `google_fonts` package with `opsz` and `SOFT` axes for Fraunces
- Offline: graceful degradation with cached content, banner "You're offline"
- Keyboard: dismiss on scroll, form fields use correct `TextInputType`

### Next.js (Web — MVP Minimal)

- Only SSR pages: mini-site, content detail, home, legal
- Tailwind CSS with custom theme matching Flutter tokens
- `next/font/google` for Fraunces + Inter
- Image: `next/image` with blur placeholder
- No client-side auth in MVP web — purely public pages

---

## 8. What NOT to Do

- Never use gradients (monochrome design system)
- Never use colored pills or per-vertical accent colors
- Never use Modal — use BottomSheet
- Never use ScrollView + map for lists — use ListView.builder
- Never show a spinner — show skeleton shimmer
- Never hardcode strings that could be localized later (use constants file)
- Never put business logic in widgets — use services/providers
- Never use `setState` for complex state — use state management solution
