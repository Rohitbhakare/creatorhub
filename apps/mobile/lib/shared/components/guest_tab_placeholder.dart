import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../features/auth/widgets/soft_auth_sheet.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import 'button.dart';

/// Full-screen placeholder shown to guests in tabs that require auth
/// (Studio + You per IAM-FR-011). Tapping the CTA opens the soft-auth
/// sheet with the supplied trigger; dismissing leaves the guest on the
/// tab so they can keep browsing via the other tabs.
class GuestTabPlaceholder extends ConsumerWidget {
  final IconData icon;
  final String title;
  final String description;
  final String ctaLabel;
  final SoftAuthTrigger trigger;

  const GuestTabPlaceholder({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.ctaLabel,
    required this.trigger,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.primaryTint,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  alignment: Alignment.center,
                  child: Icon(icon, size: 32, color: AppColors.coral),
                ),
                const SizedBox(height: 20),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.fraunces(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                    letterSpacing: -0.018 * 22,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  description,
                  textAlign: TextAlign.center,
                  style: AppTypography.body.copyWith(
                    color: AppColors.inkSoft,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    label: ctaLabel,
                    variant: AppButtonVariant.primary,
                    size: AppButtonSize.large,
                    fullWidth: true,
                    onPressed: () {
                      HapticFeedback.selectionClick();
                      showSoftAuthSheet(context, ref, trigger: trigger);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
