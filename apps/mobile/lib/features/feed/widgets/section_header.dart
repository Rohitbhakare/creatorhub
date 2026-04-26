import 'package:flutter/material.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// Standard feed section header — eyebrow + Fraunces title + optional "See all".
class SectionHeader extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String? subtitle;
  final VoidCallback? onSeeAll;

  const SectionHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    this.subtitle,
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
                if (eyebrow.isNotEmpty) ...[
                  Text(
                    eyebrow,
                    style: AppTypography.label.copyWith(
                      color: AppColors.inkMuted,
                      letterSpacing: 0.6,
                    ),
                  ),
                  const SizedBox(height: 2),
                ],
                if (title.isNotEmpty)
                  Text(
                    title,
                    style: AppTypography.h3.copyWith(color: AppColors.ink),
                  ),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.inkMuted,
                      fontSize: 12,
                    ),
                  ),
                ],
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
                    style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.chevron_right, size: 14, color: AppColors.inkSoft),
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
