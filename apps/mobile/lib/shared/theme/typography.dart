import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

/// CreatorHub typography system.
/// Fraunces: Display, H1, H2, post body text only.
/// Inter: Everything else.
abstract final class AppTypography {
  // ── Fraunces (Serif) ─────────────────────────────────────────

  /// 34px / 700 / 1.18 line height
  static TextStyle get display => GoogleFonts.fraunces(
        fontSize: 34,
        fontWeight: FontWeight.w700,
        height: 1.18,
        color: AppColors.ink,
      );

  /// 28px / 700 / 1.21 line height
  static TextStyle get h1 => GoogleFonts.fraunces(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        height: 1.21,
        color: AppColors.ink,
      );

  /// 24px / 600 / 1.25 line height
  static TextStyle get h2 => GoogleFonts.fraunces(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        height: 1.25,
        color: AppColors.ink,
      );

  /// 14px / 400 / 1.65 line height — for post body text (serif reading)
  static TextStyle get postBody => GoogleFonts.fraunces(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.65,
        color: AppColors.ink,
      );

  // ── Inter (Sans-Serif) ───────────────────────────────────────

  /// 20px / 600 / 1.3 line height
  static TextStyle get h3 => GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.3,
        color: AppColors.ink,
      );

  /// 17px / 600 / 1.35 line height
  static TextStyle get h4 => GoogleFonts.inter(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: AppColors.ink,
      );

  /// 16px / 400 / 1.5 line height
  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: AppColors.ink,
      );

  /// 15px / 400 / 1.53 line height
  static TextStyle get body => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        height: 1.53,
        color: AppColors.ink,
      );

  /// 13px / 400 / 1.54 line height
  static TextStyle get bodySmall => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        height: 1.54,
        color: AppColors.ink,
      );

  /// 12px / 400 / 1.4 line height
  static TextStyle get caption => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: AppColors.inkMuted,
      );

  /// 11px / 600 / 1.27 line height
  static TextStyle get label => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        height: 1.27,
        color: AppColors.inkSoft,
      );

  // ── TextTheme Factory ────────────────────────────────────────
  static TextTheme get textTheme => TextTheme(
        displayLarge: display,
        displayMedium: h1,
        displaySmall: h2,
        headlineMedium: h3,
        headlineSmall: h4,
        titleLarge: h3,
        titleMedium: h4,
        bodyLarge: bodyLarge,
        bodyMedium: body,
        bodySmall: bodySmall,
        labelLarge: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          height: 1.2,
          color: AppColors.ink,
        ),
        labelMedium: label,
        labelSmall: caption,
      );
}
