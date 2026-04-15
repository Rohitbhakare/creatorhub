import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// Placeholder Studio tab — replaced in E1.8.
class StudioPlaceholderScreen extends StatelessWidget {
  const StudioPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                PhosphorIcons.squaresFour(PhosphorIconsStyle.regular),
                size: 48,
                color: AppColors.line,
              ),
              const SizedBox(height: 12),
              Text(
                'Studio',
                style: AppTypography.h3.copyWith(color: AppColors.muted),
              ),
              const SizedBox(height: 4),
              Text(
                'Coming soon',
                style: AppTypography.bodySmall.copyWith(color: AppColors.softInk),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
