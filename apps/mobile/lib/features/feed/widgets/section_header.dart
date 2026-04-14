import 'package:flutter/material.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// Standard feed section header — eyebrow + Fraunces title + optional "See all".
class SectionHeader extends StatelessWidget {
  final String eyebrow;
  final String title;
  final VoidCallback? onSeeAll;

  const SectionHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eyebrow,
                  style: AppTypography.label.copyWith(
                    color: AppColors.softInk,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: AppTypography.h3.copyWith(color: AppColors.ink),
                ),
              ],
            ),
          ),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Row(
                children: [
                  Text(
                    'See all',
                    style: AppTypography.caption.copyWith(color: AppColors.muted),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.chevron_right, size: 14, color: AppColors.muted),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Coral eyebrow for editor's pick sections.
class CoralEyebrow extends StatelessWidget {
  final String text;
  const CoralEyebrow({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: AppTypography.label.copyWith(
        color: AppColors.coral,
        letterSpacing: 0.6,
      ),
    );
  }
}
