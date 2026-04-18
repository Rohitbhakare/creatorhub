import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/utils/format.dart';
import '../providers/saved_provider.dart';

/// Detail screen for a single saved list — shows items with sort + type filter.
class SavedListDetailScreen extends ConsumerWidget {
  final String listId;

  const SavedListDetailScreen({super.key, required this.listId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(listItemsProvider(listId));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(PhosphorIconsFill.arrowLeft, color: AppColors.ink, size: 22),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: Text(
          state.listName.isEmpty ? 'Saved list' : state.listName,
          style: typ.AppTypography.h4,
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Filter bar (sort + type chips)
          _FilterBar(listId: listId, state: state),
          const Divider(height: 1, color: AppColors.hairline),

          // Content
          Expanded(
            child: switch (state) {
              ListItemsState(isLoading: true) => const _ListItemsSkeleton(),
              ListItemsState(error: final e) when e != null => _ListItemsError(
                  error: e,
                  onRetry: () => ref.read(listItemsProvider(listId).notifier).retry(),
                ),
              _ => state.items.isEmpty
                  ? const _ListItemsEmpty()
                  : _ListItemsContent(listId: listId, state: state),
            },
          ),
        ],
      ),
    );
  }
}

// ── Filter Bar ────────────────────────────────────────────────────

class _FilterBar extends ConsumerWidget {
  final String listId;
  final ListItemsState state;

  const _FilterBar({required this.listId, required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(listItemsProvider(listId).notifier);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.sm,
      ),
      child: Row(
        children: [
          // Sort dropdown
          _SortChip(
            current: state.sort,
            onChanged: (sort) => notifier.setSort(sort),
          ),
          const SizedBox(width: Spacing.sm),
          const _Divider(),
          const SizedBox(width: Spacing.sm),
          // Type filters
          ...[null, 'post', 'itinerary', 'event'].map(
            (type) => Padding(
              padding: const EdgeInsets.only(right: Spacing.xs),
              child: _TypeChip(
                label: type == null ? 'All' : _typeLabel(type),
                isActive: state.typeFilter == type,
                onTap: () => notifier.setTypeFilter(type),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _typeLabel(String type) {
    return switch (type) {
      'post' => 'Posts',
      'itinerary' => 'Itineraries',
      'event' => 'Events',
      _ => type,
    };
  }
}

class _SortChip extends StatelessWidget {
  final String current;
  final ValueChanged<String> onChanged;

  const _SortChip({required this.current, required this.onChanged});

  static const _options = {
    'recently_added': 'Recently added',
    'oldest': 'Oldest',
    'a_z': 'A–Z',
    'price_asc': 'Price: low',
    'price_desc': 'Price: high',
  };

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        showModalBottomSheet<String>(
          context: context,
          backgroundColor: AppColors.bg,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
          ),
          builder: (_) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: Spacing.lg),
              ..._options.entries.map(
                (e) => ListTile(
                  title: Text(e.value, style: typ.AppTypography.body),
                  trailing: current == e.key
                      ? const Icon(PhosphorIconsFill.check, size: 18, color: AppColors.coral)
                      : null,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop(e.key);
                  },
                ),
              ),
              const SizedBox(height: Spacing.xl),
            ],
          ),
        ).then((val) {
          if (val != null) onChanged(val);
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.md, vertical: Spacing.sm),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _options[current] ?? 'Sort',
              style: typ.AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w500),
            ),
            const SizedBox(width: Spacing.xs),
            const Icon(PhosphorIconsFill.caretDown, size: 14, color: AppColors.inkSoft),
          ],
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _TypeChip({required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.md, vertical: Spacing.sm),
        decoration: BoxDecoration(
          color: isActive ? AppColors.coral : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(
            color: isActive ? AppColors.surface : AppColors.ink,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 20, color: AppColors.hairline);
  }
}

// ── Items List ────────────────────────────────────────────────────

class _ListItemsContent extends ConsumerWidget {
  final String listId;
  final ListItemsState state;

  const _ListItemsContent({required this.listId, required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200) {
          ref.read(listItemsProvider(listId).notifier).loadMore();
        }
        return false;
      },
      child: ListView.separated(
        padding: const EdgeInsets.all(Layout.screenPaddingH),
        itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: Spacing.md),
        itemBuilder: (context, index) {
          if (index >= state.items.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(Spacing.lg),
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.coral),
              ),
            );
          }
          return _SavedItemCard(
            item: state.items[index],
            onRemove: () => ref.read(listItemsProvider(listId).notifier).removeItem(state.items[index].contentId),
          );
        },
      ),
    );
  }
}

class _SavedItemCard extends StatelessWidget {
  final SavedListItem item;
  final VoidCallback onRemove;

  const _SavedItemCard({required this.item, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        _navigateToContent(context);
      },
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.hairline),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            // Thumbnail
            SizedBox(
              width: 100,
              height: 100,
              child: item.coverImageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: item.coverImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => const SkeletonRect(height: double.infinity, borderRadius: 0),
                      errorWidget: (_, _, _) => _ThumbnailPlaceholder(type: item.contentType),
                    )
                  : _ThumbnailPlaceholder(type: item.contentType),
            ),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(Spacing.md, Spacing.md, Spacing.sm, Spacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (item.contentType != null)
                          Text(
                            item.contentType!.toUpperCase(),
                            style: typ.AppTypography.caption.copyWith(
                              color: AppColors.coral,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        const SizedBox(height: 2),
                        Text(
                          item.title ?? 'Untitled',
                          style: typ.AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          item.isFree ? 'FREE' : formatPrice(item.pricePaisa),
                          style: typ.AppTypography.caption.copyWith(
                            color: item.isFree ? AppColors.success : AppColors.ink,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        // Remove from list
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            onRemove();
                          },
                          child: Container(
                            width: 32,
                            height: 32,
                            alignment: Alignment.center,
                            child: const Icon(
                              PhosphorIconsFill.bookmarkSimple,
                              size: 18,
                              color: AppColors.coral,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToContent(BuildContext context) {
    final type = item.contentType;
    if (type == null) return;
    switch (type) {
      case 'post':
        context.push('/posts/${item.contentId}');
      case 'itinerary':
        context.push('/itineraries/${item.contentId}');
      case 'event':
        context.push('/events/${item.contentId}');
      default:
        break;
    }
  }
}

class _ThumbnailPlaceholder extends StatelessWidget {
  final String? type;

  const _ThumbnailPlaceholder({this.type});

  @override
  Widget build(BuildContext context) {
    final icon = switch (type) {
      'post' => PhosphorIconsFill.article,
      'itinerary' => PhosphorIconsFill.mapTrifold,
      'event' => PhosphorIconsFill.calendarBlank,
      _ => PhosphorIconsFill.bookmarkSimple,
    };
    return Container(
      color: AppColors.surfaceAlt,
      child: Center(child: Icon(icon, size: 24, color: AppColors.inkMuted)),
    );
  }
}

// ── Empty / Error / Skeleton ──────────────────────────────────────

class _ListItemsEmpty extends StatelessWidget {
  const _ListItemsEmpty();

  @override
  Widget build(BuildContext context) {
    return const EmptyState(
      icon: PhosphorIconsFill.bookmarkSimple,
      title: 'Nothing here yet',
      description: 'Tap the bookmark icon on any post, itinerary or event to save it here.',
    );
  }
}

class _ListItemsError extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ListItemsError({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: PhosphorIconsFill.wifiSlash,
      title: 'Could not load',
      description: error,
      ctaLabel: 'Try again',
      onCtaPressed: onRetry,
    );
  }
}

class _ListItemsSkeleton extends StatelessWidget {
  const _ListItemsSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(Layout.screenPaddingH),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: Spacing.md),
      itemBuilder: (_, __) => const SkeletonLoader(
        child: SkeletonRect(height: 100),
      ),
    );
  }
}
