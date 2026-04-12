# E0.4 — Design System

## Overview
Build the Flutter design system: theme (colors, typography, spacing from Appendix F), shared widget library (Button, Card, Input, BottomSheet, Skeleton, EmptyState, Badge, Avatar), Phosphor Icons integration, and animation presets. This epic ensures every future screen is visually consistent and builds fast.

## SRS Requirements
- Appendix F (design tokens: colors, typography, spacing)
- C-17 (Fraunces for display/H1/H2/post body, Inter for everything else)
- C-18 (coral #E15A41 in exactly 8 contexts: DD-013)
- C-19 (button variants, disabled states)
- C-20 (skeleton shimmer for loading — never spinner)
- DD-013 (coral contexts: tab bar active, primary CTA, follow button, heart filled, verified badge, price tag, notification dot, FAB)
- DD-011 (warm neutrals: Linen #FBF7F4, Stone #8A7B6B, Bark #3E3228)

## Dependencies
- E0.1 (Flutter project scaffold)

## Architecture Decisions
- `google_fonts` package for Fraunces + Inter (ADR from ui-ux.md)
- Theme data in `lib/shared/theme/` — single source of truth
- All widgets import from theme — never hardcode colors/sizes
- Skeleton shimmer via `shimmer` package — ActivityIndicator/spinner banned
- `flutter_animate` for micro-interactions
- Phosphor Icons via `phosphor_flutter` package
- 44dp minimum tap target (accessibility)
- 4.5:1 contrast ratio minimum

## Deliverables
1. Theme configuration (`ThemeData`, `ColorScheme`, `TextTheme`)
2. Color constants (warm neutrals + coral + semantic colors)
3. Typography scale (Fraunces display, Inter body, size/weight/height table)
4. Spacing constants (4px grid system)
5. Button widget (primary, secondary, ghost, danger variants + disabled state)
6. Input widget (text field, search bar, OTP input)
7. Card widget (content card, creator card)
8. Bottom sheet wrapper (using `@gorhom/bottom-sheet` Flutter equivalent)
9. Skeleton shimmer loading components
10. Empty state component (illustration + title + description + CTA)
11. Badge component (category-specific colors, status badges)
12. Avatar component (with fallback initials)
13. Animation presets (card press 120ms, section entrance 200ms, sheet 240ms)
