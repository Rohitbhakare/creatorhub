import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../theme/colors.dart';

/// Shared category tile — used in onboarding's vertical picker AND on
/// Discover's Browse-by-category grid so the two surfaces visually rhyme.
///
/// States:
/// - rest: white surface, hairline border, emoji + label
/// - selected: tinted background, coral border, coral check badge top-right
/// - soon: dimmed 0.55, SOON pill top-right, no tap
class CategoryTile extends StatelessWidget {
  final String emoji;
  final String label;
  final Color tint;
  final bool selected;
  final bool soon;
  final VoidCallback? onTap;

  const CategoryTile({
    super.key,
    required this.emoji,
    required this.label,
    required this.tint,
    this.selected = false,
    this.soon = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final body = AnimatedContainer(
      duration: const Duration(milliseconds: 120),
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
      decoration: BoxDecoration(
        color: selected ? tint : AppColors.surface,
        border: Border.all(
          color: selected ? AppColors.coral : AppColors.hairlineStrong,
          width: 1.5,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: AppColors.cardRaisedShadow,
      ),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 22)),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                  letterSpacing: -0.005,
                ),
              ),
            ],
          ),
          if (selected)
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                width: 18,
                height: 18,
                decoration: const BoxDecoration(
                  color: AppColors.coral,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(
                  PhosphorIcons.check(PhosphorIconsStyle.bold),
                  size: 10,
                  color: AppColors.surface,
                ),
              ),
            ),
          if (soon)
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppColors.hairline, width: 0.5),
                ),
                child: Text(
                  'SOON',
                  style: GoogleFonts.inter(
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                    color: AppColors.inkMuted,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
            ),
        ],
      ),
    );

    final wrapped = soon ? Opacity(opacity: 0.55, child: body) : body;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: soon ? null : onTap,
      child: wrapped,
    );
  }
}
