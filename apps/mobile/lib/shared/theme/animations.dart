import 'package:flutter/material.dart';

/// CreatorHub animation presets.
/// All animations are snappy (≤300ms), never decorative.
/// Respect `MediaQuery.disableAnimations` for accessibility.
abstract final class Anim {
  // ── Durations ────────────────────────────────────────────────

  /// Card press feedback
  static const cardPressDuration = Duration(milliseconds: 120);

  /// Section entrance (fade + slide)
  static const sectionEntranceDuration = Duration(milliseconds: 200);

  /// Bottom sheet open/close
  static const sheetDuration = Duration(milliseconds: 240);

  /// Tab switch cross-fade
  static const tabSwitchDuration = Duration(milliseconds: 150);

  /// Heart bounce animation
  static const heartBounceDuration = Duration(milliseconds: 300);

  /// Chip select feedback
  static const chipSelectDuration = Duration(milliseconds: 120);

  /// Page transition
  static const pageTransitionDuration = Duration(milliseconds: 300);

  /// Shimmer cycle
  static const shimmerDuration = Duration(milliseconds: 1600);

  // ── Stagger Delay ────────────────────────────────────────────

  /// Stagger between list items in section entrance
  static const sectionStagger = Duration(milliseconds: 80);

  // ── Curves ───────────────────────────────────────────────────

  /// Default easing — use for most animations
  static const defaultCurve = Curves.easeOutCubic;

  /// Card press / chip select
  static const pressCurve = Curves.easeInOut;

  /// Section entrance
  static const entranceCurve = Curves.easeOut;

  /// Bottom sheet — iOS native feel
  static const sheetCurve = Cubic(0.32, 0.72, 0, 1);

  /// Shimmer — linear sweep
  static const shimmerCurve = Curves.linear;

  // ── Scale Values ─────────────────────────────────────────────

  /// Card press scale
  static const cardPressScale = 0.97;

  /// Chip select scale
  static const chipSelectScale = 1.03;

  /// Heart bounce peak scale
  static const heartBounceScale = 1.3;

  // ── Slide Values ─────────────────────────────────────────────

  /// Section entrance slide distance
  static const sectionSlideOffset = Offset(0, 8);

  // ── Helpers ──────────────────────────────────────────────────

  /// Check if animations should be reduced (accessibility).
  static bool shouldReduceMotion(BuildContext context) {
    return MediaQuery.of(context).disableAnimations;
  }

  /// Get duration respecting reduce-motion preference.
  static Duration respectMotion(BuildContext context, Duration duration) {
    return shouldReduceMotion(context) ? Duration.zero : duration;
  }
}
