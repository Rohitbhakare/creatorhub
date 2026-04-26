import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// 2x2 grid of large intent tiles below the hero. Each tile pushes to a
/// pre-locked SectionGridScreen / posts feed.
class QuickIntentStrip extends StatelessWidget {
  const QuickIntentStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
      child: GridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.55,
        children: [
          _IntentTile(
            emoji: '🏖️',
            eyebrow: 'THIS WEEKEND',
            title: 'Sat–Sun · ≤90 km',
            tint: const Color(0xFFFEF2EE),
            onTap: () => context.push('/feed/section/this-weekend'),
          ),
          _IntentTile(
            emoji: '🚗',
            eyebrow: 'DAY TRIPS',
            title: 'Return same day',
            tint: const Color(0xFFFFF6E8),
            onTap: () => context.push('/feed/section/day-trips'),
          ),
          _IntentTile(
            emoji: '🏔️',
            eyebrow: 'WEEKEND GETAWAYS',
            title: '2-day trips',
            tint: const Color(0xFFEEF6F0),
            onTap: () => context.push('/feed/section/weekend-getaways'),
          ),
          _IntentTile(
            emoji: '🎟️',
            eyebrow: 'UPCOMING EVENTS',
            title: 'Next 30 days',
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
  final String eyebrow;
  final String title;
  final Color tint;
  final VoidCallback onTap;

  const _IntentTile({
    required this.emoji,
    required this.eyebrow,
    required this.title,
    required this.tint,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
        decoration: BoxDecoration(
          color: tint,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eyebrow,
                  style: AppTypography.label.copyWith(
                    color: AppColors.inkMuted,
                    fontSize: 10,
                    letterSpacing: 0.8,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: AppTypography.body.copyWith(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
