import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/components/skeleton.dart';
import '../models/feed_models.dart';
import '../utils/feed_navigation.dart';
import 'content_card.dart';
import 'section_header.dart';

/// Generic horizontal-rail section: header + horizontal scroll of ContentCards.
///
/// Hides itself entirely when the provider returns 0 items (matches the
/// existing NearYou behavior).
class HorizontalRailSection extends StatelessWidget {
  final AsyncValue<List<FeedContentItem>> async;
  final String eyebrow;
  final String title;
  final VoidCallback? onSeeAll;
  final double railHeight;
  final double railWidth;

  const HorizontalRailSection({
    super.key,
    required this.async,
    required this.eyebrow,
    required this.title,
    this.onSeeAll,
    this.railHeight = 310,
    this.railWidth = 170,
  });

  @override
  Widget build(BuildContext context) {
    return async.when(
      loading: () => _RailSkeleton(eyebrow: eyebrow, title: title, height: railHeight),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(eyebrow: eyebrow, title: title, onSeeAll: onSeeAll),
            SizedBox(
              height: railHeight,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) => ContentCard(
                  item: items[i],
                  variant: ContentCardVariant.rail,
                  railWidth: railWidth,
                  onTap: () => openFeedItem(context, items[i]),
                ),
              ),
            ),
            const SizedBox(height: 28),
          ],
        );
      },
    );
  }
}

class _RailSkeleton extends StatelessWidget {
  final String eyebrow;
  final String title;
  final double height;
  const _RailSkeleton({
    required this.eyebrow,
    required this.title,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(eyebrow: eyebrow, title: title),
        SizedBox(
          height: height,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: 4,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => const SizedBox(
              width: 170,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AspectRatio(
                    aspectRatio: 4 / 5,
                    child: SkeletonRect(borderRadius: 12),
                  ),
                  SizedBox(height: 8),
                  SkeletonLine(height: 13),
                  SizedBox(height: 6),
                  SkeletonLine(width: 110, height: 11),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}
