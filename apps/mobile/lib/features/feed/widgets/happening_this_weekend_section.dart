import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../providers/section_rails_provider.dart';
import '../providers/user_city_provider.dart';
import '../utils/feed_navigation.dart';
import 'event_card.dart';
import 'section_header.dart';

/// Date-block rail of events + scheduled experiences happening on the
/// upcoming Sat–Sun within ~90km. Hides itself when 0 items.
class HappeningThisWeekendSection extends ConsumerWidget {
  const HappeningThisWeekendSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cityState = ref.watch(userCityProvider);
    final cityId = cityState.cityId;
    final cityLabel = cityState.cityName ?? 'you';
    final params = SectionRailParams(cityId: cityId);
    final async = ref.watch(happeningThisWeekendProvider(params));

    return async.when(
      loading: () => const _Skeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              eyebrow: 'THIS WEEKEND',
              title: 'Happening this weekend',
              subtitle: 'In and around $cityLabel · ${items.length} '
                  '${items.length == 1 ? 'event' : 'events'}',
              onSeeAll: () => context.push('/feed/section/upcoming-events'),
            ),
            SizedBox(
              height: 132,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) => EventCard(
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

class _Skeleton extends StatelessWidget {
  const _Skeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          eyebrow: 'THIS WEEKEND',
          title: 'Happening this weekend',
        ),
        SizedBox(
          height: 132,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: 3,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => Container(
              width: 280,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.hairline, width: 0.5),
              ),
              padding: const EdgeInsets.all(12),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 52,
                    height: 64,
                    child: SkeletonRect(borderRadius: 10),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonLine(height: 10, width: 60),
                        SizedBox(height: 6),
                        SkeletonLine(height: 14),
                        SizedBox(height: 6),
                        SkeletonLine(height: 11, width: 140),
                        SizedBox(height: 6),
                        SkeletonLine(height: 11, width: 100),
                      ],
                    ),
                  ),
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
