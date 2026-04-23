import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../models/feed_models.dart';
import '../providers/near_you_provider.dart';
import '../utils/feed_navigation.dart';
import 'section_header.dart';
import 'content_card.dart';

/// Near You section with nearest-neighbor waterfall.
/// Includes honesty banner when fallback radius is used (DISC-FR-028).
/// Hidden entirely when items list is empty.
class NearYouSection extends ConsumerWidget {
  const NearYouSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(nearYouProvider);

    return async.when(
      loading: () => _NearYouSkeleton(),
      error: (_, _) => const SizedBox.shrink(), // hidden on error
      data: (result) {
        if (result.items.isEmpty) return const SizedBox.shrink();
        return _NearYouContent(result: result);
      },
    );
  }
}

class _NearYouContent extends StatelessWidget {
  final NearYouResult result;
  const _NearYouContent({required this.result});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          eyebrow: 'NEAR YOU · THIS WEEKEND',
          title: result.label,
          onSeeAll: () => context.push(
            '/feed/vertical/travel',
            extra: {'title': result.label},
          ),
        ),
        // Honesty banner when fallback radius is used (DISC-FR-028)
        if (result.fallbackLevel > 0 && result.fallbackCities.isNotEmpty)
          _FallbackBanner(cities: result.fallbackCities),
        SizedBox(
          height: 260,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: result.items.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, i) => ContentCard(
              item: result.items[i],
              variant: ContentCardVariant.rail,
              railWidth: 180,
              onTap: () => openFeedItem(context, result.items[i]),
            ),
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}

/// Warm-tinted honest fallback banner (DISC-FR-028).
/// Must NOT be hidden — it's a trust requirement.
class _FallbackBanner extends StatelessWidget {
  final List<String> cities;
  const _FallbackBanner({required this.cities});

  @override
  Widget build(BuildContext context) {
    final cityText = cities.length == 1
        ? cities.first
        : cities.length == 2
            ? '${cities[0]} and ${cities[1]}'
            : '${cities.take(cities.length - 1).join(', ')}, and ${cities.last}';

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2EE), // coral-wash
        border: Border.all(color: const Color(0xFFF8C2B0)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        'Nothing nearby yet — showing trips from $cityText within a few hours of you.',
        style: AppTypography.caption.copyWith(color: const Color(0xFF6E2412)),
      ),
    );
  }
}

class _NearYouSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonLine(width: 140, height: 11),
              SizedBox(height: 4),
              SkeletonLine(width: 200, height: 20),
            ],
          ),
        ),
        SizedBox(
          height: 260,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 3,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => const SizedBox(
              width: 180,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonRect(width: 180, height: 180, borderRadius: 14),
                  SizedBox(height: 10),
                  SkeletonLine(width: 160, height: 13),
                  SizedBox(height: 6),
                  SkeletonLine(width: 110, height: 13),
                  SizedBox(height: 8),
                  SkeletonLine(width: 90, height: 10),
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
