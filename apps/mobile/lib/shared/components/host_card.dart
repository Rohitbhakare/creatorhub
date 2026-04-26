import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../theme/colors.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';
import 'button.dart';
import 'initial_avatar.dart';

/// Anchors trust on detail screens — replaces inline creator chips.
///
/// Layout: 56px avatar on the left; on the right a column with the
/// display name (with a small filled seal-check when [verified]),
/// `@username · N published`, and a tenure label. Below, two pill-style
/// buttons: Follow / Following (coral outline when not following per
/// DD-016) and Message (hairline outline).
class HostCard extends StatelessWidget {
  final String creatorId;
  final String displayName;
  final String? avatarUrl;
  final String? username;
  final bool verified;
  final String tenureLabel;
  final int contentCount;
  final bool isFollowing;
  final VoidCallback? onFollowTap;
  final VoidCallback? onMessageTap;
  final VoidCallback? onTap;

  const HostCard({
    super.key,
    required this.creatorId,
    required this.displayName,
    this.avatarUrl,
    this.username,
    this.verified = false,
    required this.tenureLabel,
    required this.contentCount,
    this.isFollowing = false,
    this.onFollowTap,
    this.onMessageTap,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final subtitleParts = <String>[
      if (username != null && username!.isNotEmpty) '@$username',
      '$contentCount published',
    ];

    final card = Container(
      padding: const EdgeInsets.all(Spacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InitialAvatar(
                name: displayName,
                avatarUrl: avatarUrl,
                size: 56,
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            displayName,
                            style: AppTypography.h4,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (verified) ...[
                          const SizedBox(width: Spacing.xs),
                          const Icon(
                            PhosphorIconsFill.sealCheck,
                            size: 16,
                            color: AppColors.ink,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitleParts.join(' · '),
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.inkSoft,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      tenureLabel,
                      style: AppTypography.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.lg),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: isFollowing ? 'Following' : 'Follow',
                  variant: isFollowing
                      ? AppButtonVariant.outline
                      : AppButtonVariant.coralOutline,
                  size: AppButtonSize.medium,
                  fullWidth: true,
                  onPressed: onFollowTap,
                ),
              ),
              const SizedBox(width: Spacing.sm),
              Expanded(
                child: AppButton(
                  label: 'Message',
                  variant: AppButtonVariant.outline,
                  size: AppButtonSize.medium,
                  fullWidth: true,
                  onPressed: onMessageTap,
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (onTap == null) return card;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: card,
    );
  }
}
