import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// 4-col flex grid of compact intent tiles. Adding more tiles auto-wraps to
/// the next row. Each tile pushes to a pre-locked SectionGridScreen / posts feed.
class QuickIntentStrip extends StatelessWidget {
  const QuickIntentStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
      child: GridView.count(
        crossAxisCount: 4,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 0.78,
        children: [
          _IntentTile(
            emoji: '🏖️',
            title: 'This weekend',
            tint: const Color(0xFFFEF2EE),
            onTap: () => context.push('/feed/section/this-weekend'),
          ),
          _IntentTile(
            emoji: '🚗',
            title: 'Day trips',
            tint: const Color(0xFFFFF6E8),
            onTap: () => context.push('/feed/section/day-trips'),
          ),
          _IntentTile(
            emoji: '🏔️',
            title: 'Getaways',
            tint: const Color(0xFFEEF6F0),
            onTap: () => context.push('/feed/section/weekend-getaways'),
          ),
          _IntentTile(
            emoji: '🎟️',
            title: 'Events',
            tint: const Color(0xFFF1EEFA),
            onTap: () => context.push('/feed/section/upcoming-events'),
          ),
        ],
      ),
    );
  }
}

class _IntentTile extends StatelessWidget {
  final String emoji;
  final String title;
  final Color tint;
  final VoidCallback onTap;

  const _IntentTile({
    required this.emoji,
    required this.title,
    required this.tint,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final highlight = Color.alphaBlend(Colors.white.withValues(alpha: 0.55), tint);
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(-0.4, -0.6),
            radius: 1.2,
            colors: [highlight, tint],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24, height: 1.0)),
            const SizedBox(height: 6),
            Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.caption.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
