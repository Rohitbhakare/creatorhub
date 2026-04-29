import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/posts_feed_provider.dart';
import '../providers/user_city_provider.dart';
import '../utils/feed_navigation.dart';
import 'post_rail_card.dart';
import 'section_header.dart';

/// Posts-only rail near user. Reuses [ContentCard] rail variant — no new card design.
class StoriesRailSection extends ConsumerWidget {
  const StoriesRailSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cityState = ref.watch(userCityProvider);
    final cityId = cityState.cityId;
    final cityLabel = cityState.cityName ?? 'you';
    final async = ref.watch(storiesRailProvider(cityId));

    return async.when(
      loading: () => _StoriesSkeleton(cityLabel: cityLabel),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              eyebrow: 'STORIES',
              title: 'Stories from $cityLabel',
              onSeeAll: () => context.push(
                '/feed/posts?scope=near${cityId != null ? '&city_id=$cityId' : ''}',
              ),
            ),
            SizedBox(
              height: 285,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) => PostRailCard(
                  item: items[i],
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

class _StoriesSkeleton extends StatelessWidget {
  final String cityLabel;
  const _StoriesSkeleton({required this.cityLabel});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(eyebrow: 'STORIES', title: 'Stories from $cityLabel'),
        SizedBox(
          height: 310,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: 4,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => const SizedBox(
              width: 170,
              child: AspectRatio(
                aspectRatio: 4 / 5,
                child: SkeletonRect(borderRadius: 12),
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}
