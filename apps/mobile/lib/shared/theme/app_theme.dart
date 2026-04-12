import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'colors.dart';
import 'typography.dart';
import 'layout.dart';

/// CreatorHub Material theme configuration.
/// Single source of truth — applied via `MaterialApp.theme`.
abstract final class AppTheme {
  static ThemeData get light {
    final colorScheme = AppColors.colorScheme;

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: AppTypography.textTheme,
      scaffoldBackgroundColor: AppColors.surface,
      splashFactory: InkRipple.splashFactory,

      // ── AppBar ──────────────────────────────────────────────
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: AppTypography.h4,
        systemOverlayStyle: SystemUiOverlayStyle.dark.copyWith(
          statusBarColor: Colors.transparent,
        ),
      ),

      // ── Bottom Nav ──────────────────────────────────────────
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.white,
        selectedItemColor: AppColors.coral,
        unselectedItemColor: AppColors.muted,
        type: BottomNavigationBarType.fixed,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        elevation: 8,
        selectedLabelStyle: AppTypography.caption.copyWith(
          fontWeight: FontWeight.w600,
          color: AppColors.coral,
        ),
        unselectedLabelStyle: AppTypography.caption.copyWith(
          color: AppColors.muted,
        ),
      ),

      // ── Cards ───────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: AppColors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          side: const BorderSide(color: AppColors.border, width: 0.5),
        ),
      ),

      // ── Buttons ─────────────────────────────────────────────
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.coral,
          foregroundColor: AppColors.white,
          disabledBackgroundColor: AppColors.coral.withValues(alpha: 0.4),
          disabledForegroundColor: AppColors.white.withValues(alpha: 0.4),
          minimumSize: const Size(0, Layout.minTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Layout.buttonRadius),
          ),
          textStyle: AppTypography.body.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.white,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.ink,
          side: const BorderSide(color: AppColors.border),
          minimumSize: const Size(0, Layout.minTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Layout.buttonRadius),
          ),
          textStyle: AppTypography.body.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.coral,
          minimumSize: const Size(0, Layout.minTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: AppTypography.body.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Input ───────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: false,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: AppTypography.body.copyWith(color: AppColors.softInk),
        labelStyle: AppTypography.bodySmall.copyWith(color: AppColors.muted),
        errorStyle: AppTypography.caption.copyWith(color: AppColors.danger),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.coral, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: BorderSide(
            color: AppColors.border.withValues(alpha: 0.4),
          ),
        ),
      ),

      // ── Bottom Sheet ────────────────────────────────────────
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.white,
        modalBarrierColor: Colors.black38,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(Layout.sheetRadius),
          ),
        ),
        showDragHandle: false,
      ),

      // ── Divider ─────────────────────────────────────────────
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 0.5,
        space: 0,
      ),

      // ── Chip ────────────────────────────────────────────────
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.sunken,
        selectedColor: AppColors.ink,
        labelStyle: AppTypography.bodySmall,
        secondaryLabelStyle:
            AppTypography.bodySmall.copyWith(color: AppColors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.chipRadius),
        ),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),

      // ── Snackbar ────────────────────────────────────────────
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.ink,
        contentTextStyle: AppTypography.body.copyWith(color: AppColors.white),
        actionTextColor: AppColors.coralLight,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
      ),

      // ── Dialog ──────────────────────────────────────────────
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
        titleTextStyle: AppTypography.h3,
        contentTextStyle: AppTypography.body,
      ),

      // ── Scroll Physics ──────────────────────────────────────
      scrollbarTheme: const ScrollbarThemeData(),
    );
  }
}
