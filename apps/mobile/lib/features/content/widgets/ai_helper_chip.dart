import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart'
    show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/utils/toast.dart';

/// Small coral pill that teases the upcoming AI drafting assistant.
///
/// v1 is a stub — tap shows a toast. Hooked up next to the Title and Body
/// fields in the post wizard so the affordance is visible where users
/// actually want the help.
class AiHelperChip extends StatelessWidget {
  final VoidCallback? onTap;

  const AiHelperChip({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Draft with AI, coming soon',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          if (onTap != null) {
            onTap!();
            return;
          }
          showAppToast(context, "We're cooking this up — coming soon.");
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.coralSurface,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                PhosphorIconsFill.sparkle,
                size: 13,
                color: AppColors.coral,
              ),
              const SizedBox(width: 6),
              Text(
                'Draft with AI',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  height: 1.1,
                  color: AppColors.coral,
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.coral,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'SOON',
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.6,
                    height: 1.1,
                    color: AppColors.surface,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
