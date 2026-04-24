import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/colors.dart';

void showAppToast(BuildContext context, String message) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger.clearSnackBars();
  messenger.showSnackBar(
    SnackBar(
      content: Text(
        message,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          height: 1.4,
          color: AppColors.surface,
        ),
      ),
      backgroundColor: AppColors.ink,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      duration: const Duration(milliseconds: 2500),
    ),
  );
}
