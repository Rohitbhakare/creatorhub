import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../models/feed_models.dart';
import '../providers/posts_feed_provider.dart';

/// Instagram-style vertical posts feed reachable at
/// `/feed/posts?scope=near|following&city_id=&sub_category_id=`.
class PostsFeedScreen extends ConsumerStatefulWidget {
  final String scope; // 'near' | 'following'
  final String? cityId;
  final String? subCategoryId;

  const PostsFeedScreen({
    super.key,
    required this.scope,
    this.cityId,
    this.subCategoryId,
  });

  @override
  ConsumerState<PostsFeedScreen> createState() => _PostsFeedScreenState();
}

class _PostsFeedScreenState extends ConsumerState<PostsFeedScreen> {
  final _scrollController = ScrollController();

  PostsFeedParams get _params => PostsFeedParams(
        scope: widget.scope,
        cityId: widget.cityId,
        subCategoryId: widget.subCategoryId,
      );

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final pos = _scrollController.position;
    if (pos.pixels >= pos.maxScrollExtent - 800) {
      ref.read(postsFeedProvider(_params).notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(postsFeedProvider(_params));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular)),
          color: AppColors.ink,
          onPressed: () => context.pop(),
        ),
        title: Text(
          widget.scope == 'following' ? 'Following' : 'Stories',
          style: AppTypography.h4,
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: () => ref.read(postsFeedProvider(_params).notifier).refresh(),
          child: async.when(
            loading: () => const _LoadingList(),
            error: (_, _) => const _ErrorState(),
            data: (state) {
              if (state.items.isEmpty) {
                return const _EmptyState();
              }
              return ListView.separated(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: state.items.length + (state.hasReachedEnd ? 0 : 1),
                separatorBuilder: (_, _) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Divider(color: AppColors.hairline, height: 1),
                ),
                itemBuilder: (context, i) {
                  if (i >= state.items.length) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.coral,
                          ),
                        ),
                      ),
                    );
                  }
                  return _PostFeedItem(item: state.items[i]);
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

class _PostFeedItem extends StatelessWidget {
  final FeedContentItem item;
  const _PostFeedItem({required this.item});

  @override
  Widget build(BuildContext context) {
    final readTime = item.tags.readTimeMin;
    final location = item.tags.locationLabel;
    final creator = item.creator;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Creator header
          Row(
            children: [
              _Avatar(name: creator?.displayName ?? creator?.username ?? '', url: creator?.avatarUrl),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      creator?.displayName ?? creator?.username ?? 'Unknown',
                      style: AppTypography.body.copyWith(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    if (creator?.username != null)
                      Text(
                        '@${creator!.username}',
                        style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Cover
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              context.push('/posts/${item.id}');
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 4 / 5,
                child: item.coverImageUrl != null && item.coverImageUrl!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: item.coverImageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(color: AppColors.surfaceAlt),
                        errorWidget: (_, _, _) => Container(color: AppColors.surfaceAlt),
                      )
                    : Container(color: AppColors.surfaceAlt),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Action row
          Row(
            children: [
              Icon(PhosphorIcons.heart(PhosphorIconsStyle.regular), size: 22, color: AppColors.ink),
              const SizedBox(width: 16),
              Icon(PhosphorIcons.chatCircle(PhosphorIconsStyle.regular), size: 22, color: AppColors.ink),
              const SizedBox(width: 16),
              Icon(PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.regular), size: 22, color: AppColors.ink),
              const Spacer(),
              if (readTime != null && readTime > 0)
                Text(
                  '$readTime min read',
                  style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
                ),
            ],
          ),
          const SizedBox(height: 10),

          // Title + body preview
          Text(
            item.title,
            style: AppTypography.h4.copyWith(color: AppColors.ink, fontSize: 16),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: () => context.push('/posts/${item.id}'),
            child: Text(
              'Show all',
              style: AppTypography.label.copyWith(
                color: AppColors.inkSoft,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),

          if (location != null && location.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  PhosphorIcons.mapPin(PhosphorIconsStyle.fill),
                  size: 12,
                  color: AppColors.inkMuted,
                ),
                const SizedBox(width: 4),
                Text(
                  location,
                  style: AppTypography.caption.copyWith(color: AppColors.inkMuted),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String name;
  final String? url;
  const _Avatar({required this.name, this.url});

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    if (url != null && url!.isNotEmpty) {
      return CircleAvatar(
        radius: 18,
        backgroundColor: AppColors.surfaceAlt,
        backgroundImage: CachedNetworkImageProvider(url!),
      );
    }
    return CircleAvatar(
      radius: 18,
      backgroundColor: AppColors.surfaceAlt,
      child: Text(
        initial,
        style: AppTypography.label.copyWith(color: AppColors.ink, fontSize: 14),
      ),
    );
  }
}

class _LoadingList extends StatelessWidget {
  const _LoadingList();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: 3,
      separatorBuilder: (_, _) => const SizedBox(height: 24),
      itemBuilder: (_, _) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(radius: 18, backgroundColor: AppColors.surfaceAlt),
                SizedBox(width: 10),
                Expanded(child: SkeletonLine(height: 14)),
              ],
            ),
            SizedBox(height: 12),
            AspectRatio(aspectRatio: 4 / 5, child: SkeletonRect(borderRadius: 12)),
            SizedBox(height: 10),
            SkeletonLine(height: 14),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(32),
      children: [
        const SizedBox(height: 80),
        Icon(PhosphorIcons.warning(PhosphorIconsStyle.regular),
            size: 32, color: AppColors.inkSoft),
        const SizedBox(height: 12),
        Text("Couldn't load posts",
            textAlign: TextAlign.center,
            style: AppTypography.h4.copyWith(color: AppColors.ink)),
        const SizedBox(height: 4),
        Text('Pull down to retry.',
            textAlign: TextAlign.center,
            style: AppTypography.body.copyWith(color: AppColors.inkMuted)),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(32),
      children: [
        const SizedBox(height: 80),
        Icon(PhosphorIcons.article(PhosphorIconsStyle.regular),
            size: 32, color: AppColors.inkSoft),
        const SizedBox(height: 12),
        Text('No posts yet',
            textAlign: TextAlign.center,
            style: AppTypography.h4.copyWith(color: AppColors.ink)),
      ],
    );
  }
}
