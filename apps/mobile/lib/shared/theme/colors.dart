import 'package:flutter/material.dart';

/// CreatorHub color system — v2 "Paper White + Coral" (SRS C-25).
/// Pure white surfaces on a barely-warm page; coral `#E15A41` is the sole
/// decorative accent. Semantic hues appear only on functional status.
abstract final class AppColors {
  // ── Surfaces ────────────────────────────────────────────────
  /// Page / behind cards.
  static const bg = Color(0xFFF7F7F5);

  /// Cards, sheets, nav.
  static const surface = Color(0xFFFFFFFF);

  /// Sunken rows, toolbars, chips.
  static const surfaceAlt = Color(0xFFF2F1EE);

  /// Info blocks, code blocks, sunken inserts inside cards.
  static const surfaceSunk = Color(0xFFECEAE5);

  // ── Ink hierarchy ───────────────────────────────────────────
  /// Body / primary text.
  static const ink = Color(0xFF16161A);

  /// Secondary text, subheads.
  static const inkSoft = Color(0xFF3A3A40);

  /// Metadata, counts, placeholders.
  static const inkMuted = Color(0xFF7A7A82);

  /// Disabled, hairline emphasis, tertiary meta.
  static const inkFaint = Color(0xFFB4B4BA);

  // ── Hairlines ───────────────────────────────────────────────
  /// Borders and dividers (SRS C-26 rest state).
  static const hairline = Color(0xFFE8E6E1);

  /// Heavier dividers, drag handles, selection-tile rest border.
  static const hairlineStrong = Color(0xFFD8D5CE);

  // ── Coral Accent (SRS C-17 + C-25) ──────────────────────────
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

  /// Deep coral — pressed / hover states.
  static const coralDeep = Color(0xFFB9401E);

  /// Pale opaque coral wash — SelectionTile halo, active BottomNav pill,
  /// coral-background chips. Opaque, not alpha. (SRS C-26, C-28)
  static const primaryTint = Color(0xFFFCEBE6);

  /// Soft-press coral used in pressed button states.
  static const coralLight = Color(0xFFF4A899);

  /// Translucent coral wash (8% alpha) — for large-area tints where
  /// an opaque wash would be too heavy. Keep for backwards compatibility
  /// with existing call sites.
  static const coralSurface = Color(0x14E15A41); // 8% opacity

  // ── Semantic Colors (functional-only per SRS C-25) ──────────
  /// Verified badges, confirmed bookings.
  static const success = Color(0xFF1D9E75);
  static const successSurface = Color(0x141D9E75);

  /// Caution flags, disputed bookings.
  static const warning = Color(0xFFBA7517);
  static const warningSurface = Color(0x14BA7517);

  /// Error toasts, cancelled bookings, danger buttons.
  static const danger = Color(0xFFC2362F);
  static const dangerSurface = Color(0x14C2362F);

  /// Informational states.
  static const info = Color(0xFF185FA5);
  static const infoSurface = Color(0x14185FA5);

  // ── Shimmer Colors ──────────────────────────────────────────
  static const shimmerBase = Color(0xFFEBEADF);
  static const shimmerHighlight = Color(0xFFD8D5C9);

  // ── Elevation Shadows (SRS C-27) ────────────────────────────
  /// Layered shadow stack for `AppCard` raised default.
  /// Use this list directly in `BoxDecoration.boxShadow`.
  static const List<BoxShadow> cardRaisedShadow = [
    BoxShadow(
      color: Color(0x0D101828), // rgba(16,24,40,0.05)
      offset: Offset(0, 1),
      blurRadius: 2,
    ),
    BoxShadow(
      color: Color(0x0A101828), // rgba(16,24,40,0.04)
      offset: Offset(0, 1),
      blurRadius: 4,
    ),
    BoxShadow(
      color: Color(0x0A101828), // rgba(16,24,40,0.04)
      offset: Offset(0, 4),
      blurRadius: 12,
    ),
  ];

  /// Top-edge shadow for BottomNav (SRS C-28).
  /// Applied as a Container decoration above the bar.
  static const List<BoxShadow> bottomNavTopShadow = [
    BoxShadow(
      color: Color(0x0F101828), // rgba(16,24,40,0.06)
      offset: Offset(0, -8),
      blurRadius: 24,
    ),
    BoxShadow(
      color: Color(0x08101828), // rgba(16,24,40,0.03)
      offset: Offset(0, -1),
      blurRadius: 2,
    ),
  ];

  /// Coral-tinted glow for the Create FAB (SRS C-28).
  static const List<BoxShadow> fabGlowShadow = [
    BoxShadow(
      color: Color(0x54E15A41), // rgba(225,90,65,0.33)
      offset: Offset(0, 8),
      blurRadius: 20,
    ),
  ];

  // ── Vertical / Sub-Category Colors ──────────────────────────
  /// 12 travel sub-category colors for badges.
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

  /// Stories sub-category colors.
  static const Map<String, Color> storyColors = {
    'travel_stories': Color(0xFF5B8FCC),
    'local_culture': Color(0xFFCA8842),
    'food_stories': Color(0xFFD98C4A),
    'photo_essays': Color(0xFF7B8DAA),
    'tips_guides': Color(0xFF4A9E7E),
  };

  // ── ColorScheme Factory ─────────────────────────────────────
  static ColorScheme get colorScheme => const ColorScheme(
        brightness: Brightness.light,
        primary: coral,
        onPrimary: surface,
        primaryContainer: primaryTint,
        onPrimaryContainer: coralDeep,
        secondary: ink,
        onSecondary: surface,
        secondaryContainer: surfaceAlt,
        onSecondaryContainer: ink,
        tertiary: inkSoft,
        onTertiary: surface,
        error: danger,
        onError: surface,
        errorContainer: dangerSurface,
        onErrorContainer: danger,
        surface: bg,
        onSurface: ink,
        onSurfaceVariant: inkSoft,
        outline: hairline,
        outlineVariant: hairlineStrong,
        shadow: Color(0x1A16161A),
        inverseSurface: ink,
        onInverseSurface: surface,
      );
}
