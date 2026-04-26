import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/vertical_section_provider.dart';
import '../providers/user_city_provider.dart';
import '../utils/feed_navigation.dart';
import 'content_card.dart';

const _kSubCatLabels = <String, String>{
  'travel.road_trips': 'Road Trips',
  'travel.biking': 'Biking',
  'travel.trekking': 'Trekking',
  'travel.food_trails': 'Food Trails',
};

/// Single 2-col grid filtered to a specific sub-category. Used on home when
/// a sub-cat chip is active. Calls the existing /feed/vertical/travel
/// endpoint with sub_category_id query param.
class SubCatFilteredGrid extends ConsumerWidget {
  final String subCategoryId;

  /// 'near' or 'following' — currently filters the source endpoint vertical-wide;
  /// 'following' would need a different endpoint and is treated the same here for v1.
  final String scope;

  const SubCatFilteredGrid({
    super.key,
    required this.subCategoryId,
    required this.scope,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final params = VerticalSectionParams('travel', subCategoryId: subCategoryId);
    final async = ref.watch(verticalSectionProvider(params));
    final cityName = ref.watch(userCityProvider).cityName;
    final label = _kSubCatLabels[subCategoryId] ?? subCategoryId;

    return async.when(
      loading: () => const _GridSkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) {
          return _Empty(label: label, cityName: cityName ?? 'you');
        }
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                cityName != null ? '$label near $cityName' : label,
                style: AppTypography.h3,
              ),
              const SizedBox(height: 4),
              Text(
                '${items.length} result${items.length == 1 ? '' : 's'}',
                style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                primary: false,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 18,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.65,
                ),
                itemCount: items.length,
                itemBuilder: (context, i) => ContentCard(
                  item: items[i],
                  variant: ContentCardVariant.grid,
                  onTap: () => openFeedItem(context, items[i]),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _GridSkeleton extends StatelessWidget {
  const _GridSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: GridView.builder(
        shrinkWrap: true,
        primary: false,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 18,
          crossAxisSpacing: 12,
          childAspectRatio: 0.65,
        ),
        itemCount: 4,
        itemBuilder: (_, _) => const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            AspectRatio(aspectRatio: 1, child: SkeletonRect(borderRadius: 12)),
            SizedBox(height: 8),
            SkeletonLine(height: 13),
          ],
        ),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  final String label;
  final String cityName;
  const _Empty({required this.label, required this.cityName});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(32, 32, 32, 32),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              color: AppColors.surfaceAlt,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Icon(
              PhosphorIcons.compass(PhosphorIconsStyle.regular),
              size: 32,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'No $label content near $cityName yet',
            style: AppTypography.h4.copyWith(color: AppColors.ink),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Try another sub-category, or browse from elsewhere.',
            style: AppTypography.body.copyWith(color: AppColors.inkMuted, height: 1.5),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
