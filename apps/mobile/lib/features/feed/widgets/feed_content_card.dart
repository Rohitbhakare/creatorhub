import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// Discover creator chip (130px wide, coral-border avatar + follow button).
class DiscoverCreatorCard extends StatelessWidget {
  final String displayName;
  final String? avatarUrl;
  final String vertical;
  final VoidCallback? onFollow;

  const DiscoverCreatorCard({
    super.key,
    required this.displayName,
    this.avatarUrl,
    required this.vertical,
    this.onFollow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar with coral border
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.coral, width: 2),
            ),
            child: ClipOval(
              child: avatarUrl != null
                  ? CachedNetworkImage(
                      imageUrl: avatarUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(color: AppColors.surfaceAlt),
                      errorWidget: (_, _, _) =>
                          _InitialsAvatar(name: displayName),
                    )
                  : _InitialsAvatar(name: displayName),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            displayName,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            vertical.toUpperCase(),
            style: AppTypography.caption.copyWith(
              color: AppColors.inkMuted,
              fontSize: 9,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 30,
            child: OutlinedButton(
              onPressed: onFollow,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.coral),
                foregroundColor: AppColors.coral,
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                textStyle: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              child: const Text('+ Follow'),
            ),
          ),
        ],
      ),
    );
  }
}

class _InitialsAvatar extends StatelessWidget {
  final String name;
  const _InitialsAvatar({required this.name});

  String get _initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceAlt,
      alignment: Alignment.center,
      child: Text(
        _initials,
        style: AppTypography.label.copyWith(
          color: AppColors.inkSoft,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
