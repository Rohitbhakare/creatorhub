import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/avatar.dart';
import '../../../shared/components/badge.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/utils/format.dart';
import '../../social/providers/follow_provider.dart';
import '../../social/widgets/engagement_bar.dart';
import '../providers/post_detail_provider.dart';

/// Full post detail screen.
///
/// Shows hero image, creator header, body text (Fraunces serif),
/// image gallery, location tag, and engagement bar.
class PostDetailScreen extends ConsumerWidget {
  final String postId;

  const PostDetailScreen({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final post = ref.watch(postDetailProvider(postId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        top: false, // Let hero image extend behind status bar
        child: switch (post.status) {
          PostDetailStatus.loading => const _PostDetailSkeleton(),
          PostDetailStatus.error => _PostDetailError(
              error: post.error ?? 'Failed to load post',
              onRetry: () =>
                  ref.read(postDetailProvider(postId).notifier).retry(),
            ),
          PostDetailStatus.loaded => _PostDetailContent(
              postId: postId,
              post: post,
            ),
        },
      ),
    );
  }
}

/// Loaded post detail content.
class _PostDetailContent extends ConsumerWidget {
  final String postId;
  final PostDetailState post;

  const _PostDetailContent({
    required this.postId,
    required this.post,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Column(
      children: [
        Expanded(
          child: CustomScrollView(
            slivers: [
              // Hero image with back button overlay
              SliverToBoxAdapter(
                child: _HeroImage(
                  media: post.media,
                  topPadding: topPadding,
                  onBack: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                  },
                ),
              ),

              // Content body
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Layout.screenPaddingH,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: Spacing.lg),

                      // POST badge
                      const CategoryBadge(label: 'POST', slug: 'post'),
                      const SizedBox(height: Spacing.md),

                      // Title
                      Text(post.title, style: typ.AppTypography.h2),
                      const SizedBox(height: Spacing.lg),

                      // Creator header
                      _CreatorHeader(
                        creatorId: post.creatorId,
                        avatarUrl: post.creatorAvatarUrl,
                        displayName: post.creatorName,
                        username: post.creatorUsername,
                        createdAt: post.createdAt,
                      ),
                      const SizedBox(height: Spacing.xl),

                      // Body text (Fraunces serif for reading)
                      if (post.body.isNotEmpty)
                        Text(post.body, style: typ.AppTypography.postBody),
                      const SizedBox(height: Spacing.xl),

                      // Image gallery (if multiple images)
                      if (post.media.length > 1) ...[
                        _ImageGallery(media: post.media),
                        const SizedBox(height: Spacing.xl),
                      ],

                      // Location tag
                      if (post.locationName != null &&
                          post.locationName!.isNotEmpty)
                        _LocationChip(location: post.locationName!),

                      // Tags
                      if (post.tags.isNotEmpty) ...[
                        const SizedBox(height: Spacing.md),
                        Wrap(
                          spacing: Spacing.sm,
                          runSpacing: Spacing.sm,
                          children: post.tags.map((tag) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: Spacing.sm,
                                vertical: Spacing.xs,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.sunken,
                                borderRadius:
                                    BorderRadius.circular(Layout.chipRadius),
                              ),
                              child: Text(
                                '#$tag',
                                style: typ.AppTypography.caption
                                    .copyWith(color: AppColors.muted),
                              ),
                            );
                          }).toList(),
                        ),
                      ],

                      const SizedBox(height: Spacing.xxxl),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Engagement bar
        EngagementBar(
          contentId: postId,
          contentType: 'post',
          contentTitle: post.title,
          initialIsLiked: post.isLiked,
          initialLikeCount: post.likeCount,
          commentCount: post.commentCount,
          initialIsSaved: post.isSaved,
        ),
      ],
    );
  }
}

/// Hero image — full-bleed, first media image.
class _HeroImage extends StatelessWidget {
  final List<PostMediaItem> media;
  final double topPadding;
  final VoidCallback onBack;

  const _HeroImage({
    required this.media,
    required this.topPadding,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Stack(
      children: [
        // Image
        if (media.isNotEmpty)
          SizedBox(
            width: screenWidth,
            height: screenWidth * 0.75,
            child: CachedNetworkImage(
              imageUrl: media.first.url,
              fit: BoxFit.cover,
              placeholder: (_, _) => const SkeletonRect(height: 300),
              errorWidget: (_, _, _) => Container(
                color: AppColors.sunken,
                child: const Center(
                  child: Icon(
                    PhosphorIconsFill.imageSquare,
                    size: 48,
                    color: AppColors.softInk,
                  ),
                ),
              ),
            ),
          )
        else
          Container(
            width: screenWidth,
            height: screenWidth * 0.5,
            color: AppColors.sunken,
            child: const Center(
              child: Icon(
                PhosphorIconsFill.article,
                size: 48,
                color: AppColors.softInk,
              ),
            ),
          ),

        // Back button
        Positioned(
          top: topPadding + Spacing.sm,
          left: Layout.screenPaddingH,
          child: GestureDetector(
            onTap: onBack,
            behavior: HitTestBehavior.opaque,
            child: Container(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              decoration: BoxDecoration(
                color: AppColors.ink.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                PhosphorIconsFill.arrowLeft,
                size: 20,
                color: AppColors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Creator header with avatar, name, username, and follow button.
class _CreatorHeader extends ConsumerWidget {
  final String? creatorId;
  final String? avatarUrl;
  final String displayName;
  final String? username;
  final DateTime? createdAt;

  const _CreatorHeader({
    this.creatorId,
    this.avatarUrl,
    required this.displayName,
    this.username,
    this.createdAt,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Seed follow provider with false — actual state managed optimistically by provider
    final followKey = creatorId != null
        ? (targetUserId: creatorId!, isFollowing: false, followerCount: 0)
        : null;
    final followState = followKey != null ? ref.watch(followProvider(followKey)) : null;

    return Row(
      children: [
        AppAvatar(
          imageUrl: avatarUrl,
          name: displayName,
          size: 40,
        ),
        const SizedBox(width: Spacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                displayName,
                style: typ.AppTypography.body.copyWith(fontWeight: FontWeight.w600),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (username != null || createdAt != null)
                Text(
                  [
                    if (username != null) '@$username',
                    if (createdAt != null) formatTimeAgo(createdAt!),
                  ].join(' · '),
                  style: typ.AppTypography.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
        if (creatorId != null) ...[
          const SizedBox(width: Spacing.md),
          AppButton(
            label: (followState?.isFollowing ?? false) ? 'Following' : 'Follow',
            onPressed: () {
              HapticFeedback.lightImpact();
              if (followKey != null) {
                ref.read(followProvider(followKey).notifier).toggle();
              }
            },
            variant: (followState?.isFollowing ?? false)
                ? AppButtonVariant.secondary
                : AppButtonVariant.primary,
            size: AppButtonSize.small,
          ),
        ],
      ],
    );
  }
}

/// Horizontal scrollable image gallery for multiple images.
class _ImageGallery extends StatelessWidget {
  final List<PostMediaItem> media;

  const _ImageGallery({required this.media});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: media.length,
        separatorBuilder: (_, _) => const SizedBox(width: Spacing.sm),
        itemBuilder: (context, index) {
          final item = media[index];
          return ClipRRect(
            borderRadius: BorderRadius.circular(Layout.cardRadius),
            child: CachedNetworkImage(
              imageUrl: item.url,
              width: 200,
              height: 200,
              fit: BoxFit.cover,
              placeholder: (_, _) => const SkeletonRect(
                width: 200,
                height: 200,
              ),
              errorWidget: (_, _, _) => Container(
                width: 200,
                height: 200,
                color: AppColors.sunken,
                child: const Icon(
                  PhosphorIconsFill.imageSquare,
                  size: 32,
                  color: AppColors.softInk,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Location chip displaying the location name with a pin icon.
class _LocationChip extends StatelessWidget {
  final String location;

  const _LocationChip({required this.location});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            PhosphorIconsFill.mapPin,
            size: 14,
            color: AppColors.coral,
          ),
          const SizedBox(width: Spacing.sm),
          Flexible(
            child: Text(
              location,
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.muted),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}


/// Skeleton shimmer loading for post detail.
class _PostDetailSkeleton extends StatelessWidget {
  const _PostDetailSkeleton();

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Column(
      children: [
        // Hero image skeleton
        SkeletonRect(
          height: MediaQuery.of(context).size.width * 0.75 + topPadding,
          borderRadius: 0,
        ),

        const Expanded(
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: Layout.screenPaddingH,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: Spacing.lg),

                // Badge skeleton
                SkeletonLoader(
                  child: SkeletonLine(width: 50, height: 20),
                ),
                SizedBox(height: Spacing.md),

                // Title skeleton
                SkeletonLoader(
                  child: SkeletonLine(height: 24),
                ),
                SizedBox(height: Spacing.sm),
                SkeletonLoader(
                  child: SkeletonLine(width: 200, height: 24),
                ),
                SizedBox(height: Spacing.lg),

                // Creator skeleton
                SkeletonLoader(
                  child: Row(
                    children: [
                      SkeletonCircle(size: 40),
                      SizedBox(width: Spacing.md),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonLine(width: 120, height: 14),
                          SizedBox(height: Spacing.xs),
                          SkeletonLine(width: 80, height: 12),
                        ],
                      ),
                    ],
                  ),
                ),
                SizedBox(height: Spacing.xl),

                // Body text skeleton
                SkeletonTextBlock(lines: 5),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Error state for post detail.
class _PostDetailError extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _PostDetailError({
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          // Back button
          Align(
            alignment: Alignment.topLeft,
            child: Padding(
              padding: const EdgeInsets.only(
                left: Layout.screenPaddingH,
                top: Spacing.sm,
              ),
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.pop();
                },
                behavior: HitTestBehavior.opaque,
                child: const SizedBox(
                  width: Layout.minTapTarget,
                  height: Layout.minTapTarget,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Icon(
                      PhosphorIconsFill.arrowLeft,
                      size: 24,
                      color: AppColors.ink,
                    ),
                  ),
                ),
              ),
            ),
          ),

          Expanded(
            child: EmptyState(
              icon: PhosphorIconsFill.article,
              title: 'Post not found',
              description: error,
              ctaLabel: 'Try again',
              onCtaPressed: onRetry,
            ),
          ),
        ],
      ),
    );
  }
}
