import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../models/feed_models.dart';
import '../providers/discover_new_provider.dart';

/// "Discover something new" section — shows creators from outside the user's
/// active verticals at the bottom of the home feed.
///
/// Hidden entirely when the API returns an empty list or errors out.
class DiscoverNewSection extends ConsumerWidget {
  const DiscoverNewSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverNewProvider);

    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (creators) {
        if (creators.isEmpty) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Section header ────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(
                      PhosphorIcons.binoculars(PhosphorIconsStyle.regular),
                      size: 18,
                      color: AppColors.coral,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Discover something new',
                      style: GoogleFonts.fraunces(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                        color: AppColors.ink,
                        height: 1.2,
                        letterSpacing: -0.018 * 20,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Text(
                  'Outside your usual · worth a look',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.inkMuted,
                    fontSize: 12,
                  ),
                ),
              ),

              // ── Creator chips rail ────────────────────────────────
              SizedBox(
                height: 148,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: creators.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (context, i) =>
                      _CreatorChip(creator: creators[i]),
                ),
              ),
              const SizedBox(height: 28),
            ],
          ),
        );
      },
    );
  }
}

// ── Creator chip ──────────────────────────────────────────────────────────────

class _CreatorChip extends StatelessWidget {
  final DiscoverCreator creator;
  const _CreatorChip({required this.creator});

  static const _avatarSize = 48.0;

  // Deterministic palette matching ContentCard's initial circle palette.
  static const _palette = [
    Color(0xFFB8860B),
    Color(0xFF5A7247),
    Color(0xFF7C5CBF),
    Color(0xFFE15A41),
    Color(0xFF3B7DD8),
    Color(0xFF2D8F6F),
    Color(0xFF8B4F8B),
    Color(0xFF888888),
  ];

  @override
  Widget build(BuildContext context) {
    final name = creator.displayName ?? creator.username ?? 'Creator';
    final avatarUrl = creator.avatarUrl;
    final color = _palette[name.hashCode.abs() % _palette.length];
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    final fallbackAvatar = Container(
      width: _avatarSize,
      height: _avatarSize,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: color,
          height: 1,
        ),
      ),
    );

    return SizedBox(
      width: 90,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar
          ClipOval(
            child: avatarUrl != null && avatarUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: avatarUrl,
                    width: _avatarSize,
                    height: _avatarSize,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => fallbackAvatar,
                    errorWidget: (_, _, _) => fallbackAvatar,
                  )
                : fallbackAvatar,
          ),
          const SizedBox(height: 6),
          // Display name
          Text(
            name,
            style: AppTypography.label.copyWith(
              color: AppColors.ink,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          // Follow button
          SizedBox(
            height: 28,
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => HapticFeedback.selectionClick(),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.hairlineStrong),
                foregroundColor: AppColors.ink,
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                textStyle: AppTypography.label.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
              ),
              child: const Text('Follow'),
            ),
          ),
        ],
      ),
    );
  }
}
