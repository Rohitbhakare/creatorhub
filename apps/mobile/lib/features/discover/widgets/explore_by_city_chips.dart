import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../feed/providers/user_city_provider.dart';
import '../../feed/widgets/section_header.dart';
import '../providers/discover_home_providers.dart';

/// Horizontal chip rail of the most active creator cities. Tapping a
/// chip switches the user's city scope and jumps back to Home so the
/// rest of the app re-scopes immediately.
class ExploreByCityChips extends ConsumerWidget {
  const ExploreByCityChips({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverCitiesProvider);
    return async.when(
      loading: () => const _Skeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (cities) {
        if (cities.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(
              eyebrow: 'EXPLORE BY CITY',
              title: 'Where creators are building something',
            ),
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: cities.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) => _CityChip(
                  city: cities[i],
                  onTap: () async {
                    HapticFeedback.selectionClick();
                    await ref
                        .read(userCityProvider.notifier)
                        .updateCity(cities[i].cityId, cities[i].name);
                    if (!context.mounted) return;
                    context.go('/feed');
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        );
      },
    );
  }
}

class _CityChip extends StatelessWidget {
  final DiscoverCity city;
  final VoidCallback onTap;

  const _CityChip({required this.city, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIcons.mapPin(PhosphorIconsStyle.fill),
              size: 12,
              color: AppColors.coral,
            ),
            const SizedBox(width: 5),
            Text(
              city.name,
              style: AppTypography.body.copyWith(
                color: AppColors.ink,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 5),
            Text(
              '${city.contentCount}',
              style: AppTypography.caption.copyWith(
                color: AppColors.inkMuted,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
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
          eyebrow: 'EXPLORE BY CITY',
          title: 'Where creators are building something',
        ),
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 4,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (_, _) => const SkeletonRect(
              width: 90,
              height: 28,
              borderRadius: 18,
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
