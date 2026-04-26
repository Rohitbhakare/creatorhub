import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../feed/providers/user_city_provider.dart';
import '../../feed/widgets/section_header.dart';
import '../providers/discover_home_providers.dart';

const double _kTileWidth = 200;
const double _kRailHeight = 312;

/// Horizontal rail of algorithmic "handpicked" collections. Each tile
/// routes to /discover/results with a serialized filter set so the
/// existing 13-filter results screen handles all rendering.
class HandpickedCollectionsRail extends ConsumerWidget {
  const HandpickedCollectionsRail({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cityId = ref.watch(userCityProvider).cityId;
    final async = ref.watch(handpickedCollectionsProvider(cityId));

    return async.when(
      loading: () => const _Skeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (collections) {
        if (collections.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(
              eyebrow: 'HANDPICKED',
              title: 'Handpicked collections',
              subtitle: 'Curated by the team · refreshed weekly',
            ),
            SizedBox(
              height: _kRailHeight,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                itemCount: collections.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) => _CollectionTile(
                  collection: collections[i],
                  onTap: () {
                    HapticFeedback.selectionClick();
                    final route = _routeFor(collections[i].kind, cityId);
                    if (route != null) context.push(route);
                  },
                ),
              ),
            ),
            const SizedBox(height: 28),
          ],
        );
      },
    );
  }

  String? _routeFor(String kind, String? cityId) {
    switch (kind) {
      case 'popular_in_city':
        if (cityId == null) return '/discover/results?sort=trending';
        return '/discover/results?starting_city_id=$cityId&sort=trending';
      case 'under_budget':
        return '/discover/results?budget_buckets=lt2k';
      case 'short_reads':
        return '/discover/results?type=post';
      case 'new_voices':
        return '/discover/results?sort=trending';
      default:
        return null;
    }
  }
}

class _CollectionTile extends StatelessWidget {
  final HandpickedCollection collection;
  final VoidCallback onTap;

  const _CollectionTile({required this.collection, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: SizedBox(
        width: _kTileWidth,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.hairline, width: 0.5),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F101828),
                blurRadius: 18,
                spreadRadius: -4,
                offset: Offset(0, 6),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 4 / 5,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _Cover(url: collection.coverUrl),
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding:
                            const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.ink.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${collection.count} ${_unitLabel(collection.kind)}',
                          style: AppTypography.label.copyWith(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      collection.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.h3.copyWith(
                        color: AppColors.ink,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      collection.subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.inkMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _unitLabel(String kind) {
    switch (kind) {
      case 'new_voices':
        return 'CREATORS';
      case 'short_reads':
        return 'READS';
      default:
        return 'TRIPS';
    }
  }
}

class _Cover extends StatelessWidget {
  final String? url;
  const _Cover({this.url});

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surfaceAlt, AppColors.hairline],
        ),
      ),
    );
    if (url == null || url!.isEmpty) return placeholder;
    return CachedNetworkImage(
      imageUrl: url!,
      fit: BoxFit.cover,
      placeholder: (_, _) => placeholder,
      errorWidget: (_, _, _) => placeholder,
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
          eyebrow: 'HANDPICKED',
          title: 'Handpicked collections',
        ),
        SizedBox(
          height: _kRailHeight,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: 2,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => const SizedBox(
              width: _kTileWidth,
              child: SkeletonRect(borderRadius: 14),
            ),
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}
