import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../providers/studio_provider.dart';

/// Monochrome filter pills for the Studio "Your content" section.
///
/// Three segments: Published · Drafts · Archived. Active pill is ink-on-white,
/// inactive is surface with hairline border. No coral leakage — coral is
/// reserved for the 5 sanctioned places per DD-013.
class ContentFilterPills extends StatelessWidget {
  final String current;
  final ContentCounts counts;
  final void Function(String) onSelect;

  const ContentFilterPills({
    super.key,
    required this.current,
    required this.counts,
    required this.onSelect,
  });

  static const _segments = <(String, String)>[
    ('published', 'Published'),
    ('draft', 'Drafts'),
    ('archived', 'Archived'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: Row(
        children: [
          for (var i = 0; i < _segments.length; i++) ...[
            _Pill(
              label: _segments[i].$2,
              count: counts.forFilter(_segments[i].$1),
              isActive: current == _segments[i].$1,
              onTap: () {
                if (current == _segments[i].$1) return;
                HapticFeedback.selectionClick();
                onSelect(_segments[i].$1);
              },
            ),
            if (i < _segments.length - 1) const SizedBox(width: Spacing.sm),
          ],
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final int count;
  final bool isActive;
  final VoidCallback onTap;

  const _Pill({
    required this.label,
    required this.count,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final display = count > 0 ? '$label · $count' : label;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isActive ? AppColors.ink : AppColors.surface,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: isActive ? AppColors.ink : AppColors.hairline,
          ),
        ),
        child: Text(
          display,
          style: AppTypography.bodySmall.copyWith(
            color: isActive ? AppColors.surface : AppColors.ink,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
