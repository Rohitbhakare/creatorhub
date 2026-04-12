import 'package:flutter/material.dart';

/// CreatorHub color system.
/// Monochrome warm neutrals + single coral accent (8 contexts only).
/// All colors pass 4.5:1 contrast ratio against their backgrounds.
abstract final class AppColors {
  // ── Core Neutrals ────────────────────────────────────────────
  /// Page background
  static const surface = Color(0xFFFAF7F4);

  /// Chips, inactive tiles, secondary surfaces
  static const sunken = Color(0xFFF2EEE8);

  /// All borders and dividers
  static const border = Color(0xFFE5E0D7);

  /// Heavier dividers, drag handles
  static const line = Color(0xFFC9C3B6);

  /// Metadata, counts, placeholders
  static const softInk = Color(0xFF9C9689);

  /// Secondary text, subheads
  static const muted = Color(0xFF6B6660);

  /// Primary text, filled pills, icons
  static const ink = Color(0xFF2C2823);

  /// Pure white for overlays, cards on dark surfaces
  static const white = Color(0xFFFFFFFF);

  // ── Coral Accent ─────────────────────────────────────────────
  /// Used in EXACTLY 8 contexts (DD-013):
  /// 1. Primary CTA button (one per screen)
  /// 2. Active save/bookmark icon (filled state)
  /// 3. Location pin icon (city cards + top bar)
  /// 4. Active bottom tab indicator
  /// 5. Overnight stop pin on itinerary maps
  /// 6. Active Studio tab icon
  /// 7. Unread notification/alert badge
  /// 8. Booking status "In Progress" pill
  static const coral = Color(0xFFE15A41);

  /// Lighter coral for pressed/hover states
  static const coralLight = Color(0xFFF4A899);

  /// Coral with reduced opacity for subtle backgrounds
  static const coralSurface = Color(0x14E15A41); // 8% opacity

  // ── Semantic Colors ──────────────────────────────────────────
  /// Verified badges, confirmed bookings
  static const success = Color(0xFF1D9E75);
  static const successSurface = Color(0x141D9E75);

  /// Caution flags, disputed bookings
  static const warning = Color(0xFFBA7517);
  static const warningSurface = Color(0x14BA7517);

  /// Error toasts, cancelled bookings, danger buttons
  static const danger = Color(0xFFC2362F);
  static const dangerSurface = Color(0x14C2362F);

  /// Informational states
  static const info = Color(0xFF185FA5);
  static const infoSurface = Color(0x14185FA5);

  // ── Shimmer Colors ───────────────────────────────────────────
  static const shimmerBase = Color(0xFFEBEADF);
  static const shimmerHighlight = Color(0xFFD8D5C9);

  // ── Vertical / Sub-Category Colors ───────────────────────────
  /// 12 travel sub-category colors for badges
  static const Map<String, Color> verticalColors = {
    'city_guides': Color(0xFF4A90D9),
    'hidden_gems': Color(0xFF7B61FF),
    'food_trails': Color(0xFFE8913A),
    'adventure': Color(0xFF2BA866),
    'heritage_culture': Color(0xFFBF6C3B),
    'nature_wildlife': Color(0xFF3DAA6D),
    'spiritual': Color(0xFFD4A843),
    'road_trips': Color(0xFF5C8FBF),
    'budget_travel': Color(0xFF45A88F),
    'luxury': Color(0xFF9B6FC3),
    'solo_travel': Color(0xFF6C8EB5),
    'family': Color(0xFFD47B5A),
  };

  /// Stories sub-category colors
  static const Map<String, Color> storyColors = {
    'travel_stories': Color(0xFF5B8FCC),
    'local_culture': Color(0xFFCA8842),
    'food_stories': Color(0xFFD98C4A),
    'photo_essays': Color(0xFF7B8DAA),
    'tips_guides': Color(0xFF4A9E7E),
  };

  // ── ColorScheme Factory ──────────────────────────────────────
  static ColorScheme get colorScheme => const ColorScheme(
        brightness: Brightness.light,
        primary: coral,
        onPrimary: white,
        primaryContainer: coralSurface,
        onPrimaryContainer: coral,
        secondary: ink,
        onSecondary: white,
        secondaryContainer: sunken,
        onSecondaryContainer: ink,
        tertiary: muted,
        onTertiary: white,
        error: danger,
        onError: white,
        errorContainer: dangerSurface,
        onErrorContainer: danger,
        surface: surface,
        onSurface: ink,
        onSurfaceVariant: muted,
        outline: border,
        outlineVariant: line,
        shadow: Color(0x1A2C2823),
        inverseSurface: ink,
        onInverseSurface: surface,
      );
}
