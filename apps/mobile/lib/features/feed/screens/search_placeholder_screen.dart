import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// Placeholder Search tab — replaced in E2.x.
class SearchPlaceholderScreen extends StatelessWidget {
  const SearchPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
                size: 48,
                color: AppColors.hairlineStrong,
              ),
              const SizedBox(height: 12),
              Text(
                'Search',
                style: AppTypography.h3.copyWith(color: AppColors.inkSoft),
              ),
              const SizedBox(height: 4),
              Text(
                'Coming soon',
                style: AppTypography.bodySmall.copyWith(color: AppColors.inkMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
