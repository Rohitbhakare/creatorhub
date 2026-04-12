# E0.4 — Tasks

## T1: Color System
**Files:** `apps/mobile/lib/shared/theme/colors.dart`
**SRS:** Appendix F, DD-011, DD-013
**Acceptance:** All color constants defined. Warm neutrals (Linen #FBF7F4, Stone #8A7B6B, Bark #3E3228). Coral #E15A41 for exactly 8 contexts. Semantic colors (success, warning, error, info). Dark mode colors (V1 prep, not implemented).
**Edge cases:**
- Coral used ONLY in 8 contexts: tab bar active, primary CTA, follow button, heart filled, verified badge, price tag, notification dot, FAB
- Never use coral for backgrounds, section headers, or decorative elements
- All colors must pass 4.5:1 contrast ratio against their backgrounds
- Export both Color objects and hex strings for flexibility

## T2: Typography System
**Files:** `apps/mobile/lib/shared/theme/typography.dart`
**SRS:** C-17, Appendix F
**Acceptance:** Fraunces for: display (32px), H1 (28px), H2 (24px), post body text (16px, serif reading). Inter for everything else. Full scale: caption (12px) → display (32px). Line heights and letter spacing defined.
**Edge cases:**
- `google_fonts` package must be used (not bundled fonts)
- Fallback fonts specified for offline/loading (system serif for Fraunces, system sans for Inter)
- Do not use Fraunces below 16px — it becomes unreadable
- Weight: Fraunces (400, 600, 700), Inter (400, 500, 600, 700)

## T3: Spacing & Layout Constants
**Files:** `apps/mobile/lib/shared/theme/spacing.dart`, `apps/mobile/lib/shared/theme/layout.dart`
**SRS:** Appendix F
**Acceptance:** 4px grid system. Named spacings: `xs` (4), `sm` (8), `md` (12), `lg` (16), `xl` (24), `xxl` (32), `xxxl` (48). Screen padding: 16px horizontal. Card border radius: 12px. Bottom sheet handle: 4x40px centered. Bottom nav height: 64px.
**Edge cases:**
- All spacing values must be multiples of 4
- Screen-edge padding never less than 16px
- Card internal padding: 16px (content), 12px (compact)

## T4: ThemeData Configuration
**Files:** `apps/mobile/lib/shared/theme/app_theme.dart`
**SRS:** Appendix F
**Acceptance:** Complete `ThemeData` with: `ColorScheme`, `TextTheme`, `InputDecorationTheme`, `ElevatedButtonTheme`, `OutlinedButtonTheme`, `TextButtonTheme`, `CardTheme`, `BottomNavigationBarTheme`, `AppBarTheme`, `BottomSheetThemeData`. Applied via `MaterialApp.theme`.
**Edge cases:**
- `useMaterial3: true`
- Splash effects: use `InkRipple` with coral tint (subtle)
- ScrollPhysics: `BouncingScrollPhysics` (iOS feel on both platforms)
- Status bar: transparent with dark icons (on Linen background)
- Bottom sheet: barrier color `Colors.black38`

## T5: Button Component
**Files:** `apps/mobile/lib/shared/components/button.dart`
**SRS:** C-19
**Acceptance:** 4 variants: Primary (filled coral), Secondary (outline coral), Ghost (text only), Danger (filled red). Disabled state: opacity 0.4, non-interactive. Loading state: skeleton shimmer inside button bounds. Sizes: small (32h), medium (44h), large (52h). Full-width option.
**Edge cases:**
- Minimum tap target: 44dp regardless of visual size
- Haptic feedback on press (light impact)
- Press animation: scale 0.97 for 120ms
- Icon support: leading and/or trailing icons
- Text truncation: ellipsis, never wrap to second line
- Never use coral for Danger variant — use red

## T6: Input Component
**Files:** `apps/mobile/lib/shared/components/input.dart`
**SRS:** Appendix F
**Acceptance:** Text input with label, placeholder, helper text, error state. OTP input (6 boxes with auto-advance). Search input with search icon and clear button. Character counter for bio/description fields.
**Edge cases:**
- Error state: red border + error text below
- Focus: coral border (1.5px)
- Disabled: opacity 0.4, non-interactive
- Multiline: auto-expand up to max lines
- OTP: paste support (auto-fill all 6 digits)
- Search: debounce 300ms before triggering search
- Password: not needed (passwordless auth)

## T7: Card Component
**Files:** `apps/mobile/lib/shared/components/content_card.dart`, `apps/mobile/lib/shared/components/creator_card.dart`
**SRS:** Appendix F, DISC-FR wireframes
**Acceptance:** Content card: image, title, creator avatar+name, vertical badge, price/free badge, save button. Creator card: avatar, name, verticals, follower count, follow button. Both with press animation (scale 0.97, 120ms).
**Edge cases:**
- Image loading: blur placeholder hash → full image (cached_network_image)
- Missing image: show vertical-colored placeholder
- Long titles: 2-line max, ellipsis
- Price badge: "FREE" for free, "₹X,XXX" for paid (formatted from paisa)
- Category badge: use category-specific color, never gray
- Save button: heart outline (unsaved) → filled coral (saved), with haptic

## T8: Bottom Sheet Wrapper
**Files:** `apps/mobile/lib/shared/components/app_bottom_sheet.dart`
**SRS:** Appendix F
**Acceptance:** Reusable bottom sheet with handle bar, title, close button. Snap points configurable. Backdrop dismissible. Consistent styling across all sheets.
**Edge cases:**
- Animation: slide up 240ms ease-out
- Handle bar: 4px × 40px, centered, Bark/20% color
- Max height: 90% of screen
- Keyboard avoidance: sheet pushes up when keyboard appears
- Nested scrolling: inner content scrolls, outer sheet doesn't
- Accessibility: focus trap while open

## T9: Skeleton Shimmer Components
**Files:** `apps/mobile/lib/shared/components/skeleton.dart`
**SRS:** C-20
**Acceptance:** Skeleton variants: text line, text block, circle (avatar), rectangle (image), card (full card skeleton), list (multiple card skeletons). Shimmer animation: left-to-right sweep, ~1.5s cycle. Colors: Linen base, Stone/20% highlight.
**Edge cases:**
- Never use ActivityIndicator/spinner anywhere in the app
- Skeleton must match the exact dimensions of the content it replaces
- Skeleton for text: show 3 lines (80%, 100%, 60% width)
- Skeleton for list: show 3 cards
- Animation must be smooth (use `AnimationController`, not Timer)

## T10: Empty State Component
**Files:** `apps/mobile/lib/shared/components/empty_state.dart`
**SRS:** Appendix F
**Acceptance:** Illustration (SVG or Lottie) + title + description + optional CTA button. Never just gray text. Centered in parent. Vertically centered with slight upward offset (-10%).
**Edge cases:**
- Illustration must be themed (warm colors matching palette)
- CTA uses Primary button variant
- No illustration fallback: show icon from Phosphor Icons (64dp, Stone color)
- Description max 2 lines, centered
- Accessibility: illustration marked decorative (semantics exclude from screen reader)

## T11: Badge & Avatar Components
**Files:** `apps/mobile/lib/shared/components/badge.dart`, `apps/mobile/lib/shared/components/avatar.dart`
**SRS:** DD-013 (verified badge), Appendix F
**Acceptance:** Badge: category-specific colors (12 travel sub-category colors), status badges (draft, published, etc.), count badges (notification dot). Avatar: circle image with fallback initials, size variants (24, 32, 40, 56dp), optional verified badge overlay.
**Edge cases:**
- Category badge colors must be distinct and accessible (not just random hues)
- Verified badge: small coral checkmark overlaid on avatar (bottom-right)
- Notification dot: coral circle (8dp), positioned top-right
- Avatar initials: first letter of display_name, Stone background
- Avatar image error: fallback to initials (never show broken image)

## T12: Animation Presets
**Files:** `apps/mobile/lib/shared/theme/animations.dart`
**SRS:** Appendix F
**Acceptance:** Named animation presets: `cardPress` (scale 0.97, 120ms), `sectionEntrance` (fade + slide up 16px, 200ms), `bottomSheetOpen` (slide up, 240ms), `tabSwitch` (fade, 150ms), `heartBounce` (scale 1.0→1.3→1.0, 300ms). Easing curves defined.
**Edge cases:**
- All animations must respect `MediaQuery.disableAnimations` for accessibility
- Animations use `Curves.easeOutCubic` by default
- Heart bounce includes haptic feedback at peak
- Section entrance: stagger 50ms between items in a list
- All durations are constants (never magic numbers in widgets)
