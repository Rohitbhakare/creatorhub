import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/avatar.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../../social/providers/follow_provider.dart';
import '../providers/profile_provider.dart';
import '../widgets/profile_stats_row.dart';

/// Public profile view — other users' profiles.
class ProfileViewScreen extends ConsumerWidget {
  final String userId;
  const ProfileViewScreen({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ownId = ref.watch(authProvider.select((s) => s.user?['id'] as String?));
    if (ownId == userId) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go('/you');
      });
      return const SizedBox.shrink();
    }

    final profileAsync = ref.watch(publicProfileProvider(userId));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceAlt,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.ink),
          onPressed: () => context.pop(),
        ),
        title: profileAsync.whenOrNull(
          data: (p) => Text(
            p.username != null ? '@${p.username}' : (p.displayName ?? ''),
            style: AppTypography.h4,
          ),
        ),
        centerTitle: true,
      ),
      body: profileAsync.when(
        loading: () => const _ProfileSkeleton(),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                PhosphorIcons.userCircle(PhosphorIconsStyle.regular),
                size: 48,
                color: AppColors.hairlineStrong,
              ),
              const SizedBox(height: 12),
              Text(
                'Profile not found',
                style: AppTypography.h4.copyWith(color: AppColors.inkSoft),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.pop(),
                child: Text('Go back', style: AppTypography.body.copyWith(color: AppColors.coral)),
              ),
            ],
          ),
        ),
        data: (profile) => SingleChildScrollView(
          child: Column(
            children: [
              _PublicHeroCard(profile: profile, targetUserId: userId),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Content coming in E1.7+',
                  style: AppTypography.bodySmall.copyWith(color: AppColors.inkMuted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PublicHeroCard extends ConsumerWidget {
  final PublicProfile profile;
  final String targetUserId;

  const _PublicHeroCard({required this.profile, required this.targetUserId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followKey = (
      targetUserId: targetUserId,
      isFollowing: profile.isFollowing,
      followerCount: profile.followerCount,
    );
    final followState = ref.watch(followProvider(followKey));
    final isFollowing = followState.isFollowing;
    return Container(
      width: double.infinity,
      color: AppColors.surfaceAlt,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: profile.isCreator ? AppColors.coral : AppColors.hairlineStrong,
                width: profile.isCreator ? 2.5 : 1.5,
                strokeAlign: BorderSide.strokeAlignOutside,
              ),
            ),
            child: AppAvatar(
              imageUrl: profile.avatarUrl,
              name: profile.displayName ?? '?',
              size: 84,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            profile.displayName ?? 'Unknown',
            style: GoogleFonts.fraunces(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
          if (profile.username != null) ...[
            const SizedBox(height: 2),
            Text(
              '@${profile.username}',
              style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
            ),
          ],
          if (profile.bio != null && profile.bio!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              profile.bio!,
              style: GoogleFonts.fraunces(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: AppColors.inkSoft,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 16),
          ProfileStatsRow(
            followerCount: profile.followerCount,
            followingCount: profile.followingCount,
            contentCount: profile.contentCount,
            showContent: profile.isCreator,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: 160,
            height: 40,
            child: isFollowing
                ? OutlinedButton(
                    onPressed: followState.isLoading
                        ? null
                        : () {
                            HapticFeedback.selectionClick();
                            handleFollowTap(context, ref, followKey);
                          },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.hairline),
                      foregroundColor: AppColors.ink,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'Following',
                      style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
                    ),
                  )
                : ElevatedButton(
                    onPressed: followState.isLoading
                        ? null
                        : () {
                            HapticFeedback.selectionClick();
                            handleFollowTap(context, ref, followKey);
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.coral,
                      foregroundColor: AppColors.surface,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'Follow',
                      style: AppTypography.body.copyWith(
                        color: AppColors.surface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _ProfileSkeleton extends StatelessWidget {
  const _ProfileSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          color: AppColors.surfaceAlt,
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
          child: const Column(
            children: [
              SkeletonRect(width: 84, height: 84, borderRadius: 42),
              SizedBox(height: 12),
              SkeletonLine(width: 140, height: 22),
              SizedBox(height: 6),
              SkeletonLine(width: 100, height: 14),
              SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SkeletonLine(width: 50, height: 16),
                  SizedBox(width: 32),
                  SkeletonLine(width: 50, height: 16),
                ],
              ),
              SizedBox(height: 16),
              SkeletonRect(width: 160, height: 40, borderRadius: 10),
            ],
          ),
        ),
      ],
    );
  }
}
