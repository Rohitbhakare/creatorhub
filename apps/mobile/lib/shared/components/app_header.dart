import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../theme/colors.dart';

/// v2 app header — 44dp tap area, hairline border optional, ink title.
/// Used above onboarding/auth screens (S_Phone, S_Otp, S_OnbLocation, etc).
class AppHeader extends StatelessWidget {
  final String title;
  final bool showBack;
  final VoidCallback? onBack;
  final Widget? trailing;
  final bool showBottomHairline;

  const AppHeader({
    super.key,
    this.title = '',
    this.showBack = false,
    this.onBack,
    this.trailing,
    this.showBottomHairline = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: showBottomHairline
            ? const Border(
                bottom: BorderSide(color: AppColors.hairline),
              )
            : null,
      ),
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 48,
          child: Row(
            children: [
              if (showBack)
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    onBack?.call();
                  },
                  child: Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    child: Icon(
                      PhosphorIcons.caretLeft(),
                      size: 20,
                      color: AppColors.ink,
                    ),
                  ),
                )
              else
                const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                    letterSpacing: -0.005,
                  ),
                ),
              ),
              trailing ?? const SizedBox(width: 44),
            ],
          ),
        ),
      ),
    );
  }
}
