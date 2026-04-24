import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/avatar.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/services/analytics_service.dart';
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../../saved/widgets/save_to_list_sheet.dart';
import '../../social/providers/follow_provider.dart';
import '../../social/utils/share_utils.dart' show shareNative;
import '../../social/widgets/engagement_bar.dart';
import '../providers/post_detail_provider.dart';

/// Full post detail screen — hero carousel, metadata row, creator header, body.
class PostDetailScreen extends ConsumerWidget {
  final String postId;

  const PostDetailScreen({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postAsync = ref.watch(postDetailProvider(postId));

    // ANL-FR-001: track content view once post data is available
    ref.listen(postDetailProvider(postId), (_, next) {
      if (next is AsyncData) {
        final dio = ref.read(authServiceProvider).dio;
        AnalyticsService.contentViewed(dio, postId, 'post');
      }
    });

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        top: false,
        child: postAsync.when(
          loading: () => const _PostDetailSkeleton(),
          error: (e, _) => _PostDetailError(
            error: e.toString().replaceFirst('Exception: ', ''),
            onRetry: () => ref.invalidate(postDetailProvider(postId)),
          ),
          data: (post) => _PostDetailContent(postId: postId, post: post),
        ),
      ),
    );
  }
}

class _PostDetailContent extends ConsumerWidget {
  final String postId;
  final PostDetailState post;

  const _PostDetailContent({required this.postId, required this.post});

  int get _readTimeMinutes {
    final words = post.body
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .length;
    return (words / 200).ceil().clamp(1, 99);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Column(
      children: [
        Expanded(
          child: CustomScrollView(
            slivers: [
              // Hero carousel with overlay buttons
              SliverToBoxAdapter(
                child: _HeroCarousel(
                  postId: postId,
                  postTitle: post.title,
                  media: post.media,
                  topPadding: topPadding,
                  isSaved: post.isSaved,
                  onBack: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                  },
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Layout.screenPaddingH,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: Spacing.lg),

                      // Metadata: read time · location · date
                      _PostMetaRow(
                        readTimeMinutes: post.body.isNotEmpty ? _readTimeMinutes : null,
                        locationName: post.locationName,
                        createdAt: post.createdAt,
                      ),
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
                        followerCount: post.creatorFollowerCount,
                        postCount: post.creatorPostCount,
                        joinedAt: post.creatorJoinedAt,
                      ),

                      const Divider(height: Spacing.xl * 2, thickness: 0.5, color: AppColors.hairline),

                      // Body text
                      if (post.body.isNotEmpty)
                        Text(post.body, style: typ.AppTypography.postBody),
                      const SizedBox(height: Spacing.xl),

                      // Additional images carousel (2nd image onward)
                      if (post.media.length > 1) ...[
                        _ImageGallery(media: post.media.skip(1).toList()),
                        const SizedBox(height: Spacing.xl),
                      ],

                      // Tags
                      if (post.tags.isNotEmpty) ...[
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
                                color: AppColors.surfaceAlt,
                                borderRadius: BorderRadius.circular(Layout.chipRadius),
                              ),
                              child: Text(
                                '#$tag',
                                style: typ.AppTypography.caption
                                    .copyWith(color: AppColors.inkSoft),
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

// ── Hero image carousel with overlay buttons ──────────────────────────────────

class _HeroCarousel extends ConsumerStatefulWidget {
  final String postId;
  final String postTitle;
  final List<PostMediaItem> media;
  final double topPadding;
  final bool isSaved;
  final VoidCallback onBack;

  const _HeroCarousel({
    required this.postId,
    required this.postTitle,
    required this.media,
    required this.topPadding,
    required this.isSaved,
    required this.onBack,
  });

  @override
  ConsumerState<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends ConsumerState<_HeroCarousel> {
  int _currentPage = 0;
  bool _isSharing = false;
  final _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final height = screenWidth * 0.75;
    final hasMultiple = widget.media.length > 1;

    return Stack(
      children: [
        // Image(s)
        SizedBox(
          width: screenWidth,
          height: height,
          child: widget.media.isEmpty
              ? Container(
                  color: AppColors.surfaceAlt,
                  child: const Center(
                    child: Icon(
                      PhosphorIconsFill.article,
                      size: 48,
                      color: AppColors.inkMuted,
                    ),
                  ),
                )
              : PageView.builder(
                  controller: _pageController,
                  itemCount: widget.media.length,
                  onPageChanged: (i) => setState(() => _currentPage = i),
                  itemBuilder: (context, i) {
                    return CachedNetworkImage(
                      imageUrl: widget.media[i].url,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => const SkeletonRect(height: 300),
                      errorWidget: (_, _, _) => Container(
                        color: AppColors.surfaceAlt,
                        child: const Center(
                          child: Icon(
                            PhosphorIconsFill.imageSquare,
                            size: 48,
                            color: AppColors.inkMuted,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),

        // Bottom gradient scrim
        Positioned(
          left: 0, right: 0, bottom: 0,
          height: 80,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black.withValues(alpha: 0.3)],
              ),
            ),
          ),
        ),

        // Back button — top left
        Positioned(
          top: widget.topPadding + Spacing.sm,
          left: Layout.screenPaddingH,
          child: _OverlayIconBtn(
            icon: PhosphorIconsFill.arrowLeft,
            onTap: widget.onBack,
          ),
        ),

        // Share + Save — top right
        Positioned(
          top: widget.topPadding + Spacing.sm,
          right: Layout.screenPaddingH,
          child: Row(
            children: [
              _OverlayIconBtn(
                icon: PhosphorIcons.shareNetwork(PhosphorIconsStyle.regular),
                onTap: () async {
                  if (_isSharing) return;
                  _isSharing = true;
                  HapticFeedback.lightImpact();
                  await shareNative(
                    title: widget.postTitle,
                    contentId: widget.postId,
                    contentType: 'post',
                    ref: ref,
                    context: context,
                  );
                  _isSharing = false;
                },
              ),
              const SizedBox(width: 8),
              _OverlayIconBtn(
                icon: PhosphorIconsFill.bookmarkSimple,
                tintColor: AppColors.coral,
                onTap: () => showSaveToListSheet(context, ref, widget.postId),
              ),
            ],
          ),
        ),

        // Dot indicators — bottom center
        if (hasMultiple)
          Positioned(
            bottom: 12,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.media.length, (i) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: i == _currentPage ? 16 : 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: i == _currentPage
                        ? AppColors.surface
                        : AppColors.surface.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(3),
                  ),
                );
              }),
            ),
          ),
      ],
    );
  }
}

class _OverlayIconBtn extends StatelessWidget {
  final dynamic icon;
  final VoidCallback onTap;
  final Color? tintColor;

  const _OverlayIconBtn({
    required this.icon,
    required this.onTap,
    this.tintColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: Layout.minTapTarget,
        height: Layout.minTapTarget,
        decoration: BoxDecoration(
          color: AppColors.ink.withValues(alpha: 0.45),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon as IconData,
          size: 20,
          color: tintColor ?? AppColors.surface,
        ),
      ),
    );
  }
}

// ── Post metadata row ─────────────────────────────────────────────────────────

class _PostMetaRow extends StatelessWidget {
  final int? readTimeMinutes;
  final String? locationName;
  final DateTime? createdAt;

  const _PostMetaRow({this.readTimeMinutes, this.locationName, this.createdAt});

  @override
  Widget build(BuildContext context) {
    final parts = <Widget>[];

    if (readTimeMinutes != null) {
      parts.add(_metaChip(
        icon: PhosphorIcons.clock(PhosphorIconsStyle.regular),
        label: '$readTimeMinutes min read',
      ));
    }

    if (locationName != null && locationName!.isNotEmpty) {
      if (parts.isNotEmpty) parts.add(_dot());
      parts.add(_metaChip(
        icon: PhosphorIcons.mapPin(PhosphorIconsStyle.regular),
        label: locationName!,
      ));
    }

    if (createdAt != null) {
      if (parts.isNotEmpty) parts.add(_dot());
      parts.add(Text(
        _formatDate(createdAt!),
        style: typ.AppTypography.caption.copyWith(color: AppColors.inkMuted),
      ));
    }

    if (parts.isEmpty) return const SizedBox.shrink();

    return Row(
      children: parts,
    );
  }

  Widget _metaChip({required IconData icon, required String label}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.inkMuted),
        const SizedBox(width: 4),
        Text(
          label,
          style: typ.AppTypography.caption.copyWith(color: AppColors.inkMuted),
        ),
      ],
    );
  }

  Widget _dot() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Text(
        '·',
        style: typ.AppTypography.caption.copyWith(color: AppColors.inkFaint),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}';
  }
}

// ── Creator header with stats ─────────────────────────────────────────────────

class _CreatorHeader extends ConsumerWidget {
  final String? creatorId;
  final String? avatarUrl;
  final String displayName;
  final String? username;
  final int followerCount;
  final int postCount;
  final DateTime? joinedAt;

  const _CreatorHeader({
    this.creatorId,
    this.avatarUrl,
    required this.displayName,
    this.username,
    this.followerCount = 0,
    this.postCount = 0,
    this.joinedAt,
  });

  String _buildSubtitle() {
    final parts = <String>[];
    if (postCount > 0) parts.add('${formatCount(postCount)} posts');
    if (followerCount > 0) parts.add('${formatCount(followerCount)} followers');
    if (joinedAt != null) {
      final months = DateTime.now().difference(joinedAt!).inDays ~/ 30;
      if (months > 0) {
        parts.add('Writing for ${months < 12 ? '$months months' : '${months ~/ 12}y'}');
      }
    }
    return parts.join(' · ');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followKey = creatorId != null
        ? (targetUserId: creatorId!, isFollowing: false, followerCount: 0)
        : null;
    final followState = followKey != null ? ref.watch(followProvider(followKey)) : null;
    final isFollowing = followState?.isFollowing ?? false;
    final subtitle = _buildSubtitle();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        GestureDetector(
          onTap: creatorId == null
              ? null
              : () {
                  HapticFeedback.selectionClick();
                  context.push('/profile/$creatorId');
                },
          behavior: HitTestBehavior.opaque,
          child: AppAvatar(imageUrl: avatarUrl, name: displayName, size: 48),
        ),
        const SizedBox(width: Spacing.md),
        Expanded(
          child: GestureDetector(
            onTap: creatorId == null
                ? null
                : () {
                    HapticFeedback.selectionClick();
                    context.push('/profile/$creatorId');
                  },
            behavior: HitTestBehavior.opaque,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  style: typ.AppTypography.body.copyWith(fontWeight: FontWeight.w700),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: typ.AppTypography.caption.copyWith(color: AppColors.inkMuted),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ),
        if (creatorId != null) ...[
          const SizedBox(width: Spacing.md),
          AppButton(
            label: isFollowing ? 'Following' : 'Follow',
            onPressed: () {
              HapticFeedback.lightImpact();
              if (followKey != null) handleFollowTap(context, ref, followKey);
            },
            variant: isFollowing
                ? AppButtonVariant.secondary
                : AppButtonVariant.coralOutline,
            size: AppButtonSize.small,
          ),
        ],
      ],
    );
  }
}

// ── Additional image gallery ──────────────────────────────────────────────────

class _ImageGallery extends StatelessWidget {
  final List<PostMediaItem> media;

  const _ImageGallery({required this.media});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
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
              width: 220,
              height: 220,
              fit: BoxFit.cover,
              placeholder: (_, _) => const SkeletonRect(width: 220, height: 220),
              errorWidget: (_, _, _) => Container(
                width: 220,
                height: 220,
                color: AppColors.surfaceAlt,
                child: const Icon(
                  PhosphorIconsFill.imageSquare,
                  size: 32,
                  color: AppColors.inkMuted,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _PostDetailSkeleton extends StatelessWidget {
  const _PostDetailSkeleton();

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Column(
      children: [
        SkeletonRect(
          height: MediaQuery.of(context).size.width * 0.75 + topPadding,
          borderRadius: 0,
        ),

        const Expanded(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: Spacing.lg),
                SkeletonLoader(child: SkeletonLine(width: 180, height: 12)),
                SizedBox(height: Spacing.md),
                SkeletonLoader(child: SkeletonLine(height: 24)),
                SizedBox(height: Spacing.sm),
                SkeletonLoader(child: SkeletonLine(width: 200, height: 24)),
                SizedBox(height: Spacing.lg),
                SkeletonLoader(
                  child: Row(
                    children: [
                      SkeletonCircle(size: 48),
                      SizedBox(width: Spacing.md),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonLine(width: 130, height: 14),
                          SizedBox(height: 4),
                          SkeletonLine(width: 180, height: 11),
                        ],
                      ),
                    ],
                  ),
                ),
                SizedBox(height: Spacing.xl),
                SkeletonTextBlock(lines: 6),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Error state ───────────────────────────────────────────────────────────────

class _PostDetailError extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _PostDetailError({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
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
