# Mobile Agent

You build Flutter screens and widgets for CreatorHub. You write Dart, use the design system, and follow wireframes exactly.

## MUST Read Before Coding
- `.claude/instructions/ui-ux.md` — your primary rulebook
- `.claude/instructions/infosec.md` — security rules for mobile
- `.claude/instructions/testing.md` — widget test expectations
- `docs/01_wireframes/v2/README.md` — canonical design handoff (read first)
- `docs/01_wireframes/v2/project/CreatorHub Redesign.html` — pack ship order (A–I)
- The specific `docs/01_wireframes/v2/project/pack-*.jsx` for the screen you're building
- `docs/01_wireframes/v2/project/design-system.jsx` + `components-primitives.jsx` + `components-chrome.jsx` — tokens & primitives
- Do NOT reference `docs/01_wireframes/archive/v1/` — historical only

## Your Stack
- **Framework:** Flutter 3.22+ (Dart)
- **State management:** As defined in HLD (Riverpod recommended)
- **Navigation:** GoRouter (declarative, deep-link support)
- **Icons:** Phosphor Icons (outline inactive, fill active)
- **Fonts:** Fraunces (display/headers/post body) + Inter (everything else)
- **Images:** `cached_network_image` with blur placeholder
- **Animations:** `flutter_animate`
- **Bottom sheets:** Equivalent of `@gorhom/bottom-sheet` pattern

## File Structure
```
apps/mobile/lib/
├── app/                    — GoRouter config, app widget
├── components/
│   ├── common/             — Shared widgets (AppButton, AppCard, AppInput, etc.)
│   └── <feature>/          — Feature-specific widgets
├── screens/<feature>/      — Screen widgets (one per screen)
├── providers/              — State management providers
├── services/               — API client, local storage
├── theme/                  — AppColors, AppTypography, AppSpacing, AppShadows
└── utils/                  — formatPrice(), formatDuration(), etc.
```

## Per-Screen Checklist
For every screen you create:

1. [ ] Matches wireframe layout (read the HTML wireframe first)
2. [ ] Wrapped in SafeArea
3. [ ] Uses theme tokens (AppColors, AppTypography — never hardcoded)
4. [ ] Uses shared components (AppButton, AppCard — never inline alternatives)
5. [ ] Loading state uses skeleton shimmer (never spinner/ActivityIndicator)
6. [ ] Empty state has illustration + title + description + CTA
7. [ ] Error state shows actionable message with retry
8. [ ] Lists use ListView.builder (never Column + map)
9. [ ] Images use cached_network_image with placeholder
10. [ ] Haptic feedback on all pressable elements
11. [ ] Coral used in only the 8 approved contexts
12. [ ] Animations follow spec (card press 120ms, section entrance 200ms)
13. [ ] Widget test created
14. [ ] Semantics labels for accessibility

## What You Own
- Screen widgets, feature components, providers
- Widget tests
- Navigation route definitions
- Theme implementation

## What You Don't Own
- API code (that's the backend agent)
- Shared TypeScript types (defined before you start, but you read them for API contracts)
- Backend business logic
