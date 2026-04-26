import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/utils/format.dart';
import '../models/discover_filters.dart';
import '../models/discover_models.dart';
import '../providers/discover_tab_provider.dart';
import '../widgets/editorial_tile.dart';
import 'search_overlay.dart';
import 'filter_sheet.dart';

/// Discover tab — editorial browse (DISC-FR-032..037).
///
/// Structure (top → bottom):
///   Sticky header: "Discover" Fraunces title + search pill + filter icon
///   Editorial themes grid (2-col, algorithmic)
///   Creators near city (horizontal rail)
///   Upcoming experiences (compact list cards)
class DiscoverTabScreen extends ConsumerStatefulWidget {
  const DiscoverTabScreen({super.key});

  @override
  ConsumerState<DiscoverTabScreen> createState() => _DiscoverTabScreenState();
}

class _DiscoverTabScreenState extends ConsumerState<DiscoverTabScreen> {
  DiscoverFilters _filters = const DiscoverFilters();

  Future<void> _refresh() async {
    ref.invalidate(discoverThemesProvider);
    ref.invalidate(discoverCreatorsProvider);
    ref.invalidate(discoverExperiencesProvider);
  }

  void _openSearch() {
    HapticFeedback.selectionClick();
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => SearchOverlay(
          onQuerySubmitted: (_) => Navigator.of(context).pop(),
          onContentTap: (id, type) {
            Navigator.of(context).pop();
            _navigateToContent(id, type);
          },
          onCityTap: (_, __) => Navigator.of(context).pop(),
          onCreatorTap: (id) {
            Navigator.of(context).pop();
            context.push('/profile/$id');
          },
        ),
        transitionsBuilder: (_, anim, __, child) => FadeTransition(
          opacity: anim,
          child: child,
        ),
        transitionDuration: const Duration(milliseconds: 200),
      ),
    );
  }

  void _navigateToContent(String id, String type) {
    switch (type) {
      case 'post':
        context.push('/posts/$id');
      case 'self_paced_itinerary':
        context.push('/itineraries/$id');
      case 'scheduled_experience':
        context.push('/experiences/$id');
      case 'event':
        context.push('/events/$id');
    }
  }

  Future<void> _openFilters() async {
    HapticFeedback.selectionClick();
    final result = await DiscoverFilterSheet.show(context, _filters);
    if (result != null && mounted) {
      setState(() => _filters = result);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: _refresh,
          child: CustomScrollView(
            slivers: [
              // ── Sticky header ────────────────────────────────────────
              SliverPersistentHeader(
                pinned: true,
                delegate: _DiscoverHeaderDelegate(
                  filters: _filters,
                  onSearchTap: _openSearch,
                  onFilterTap: _openFilters,
                ),
              ),

              // ── Creators (top) ───────────────────────────────────────
              const SliverToBoxAdapter(child: _CreatorsSection()),

              // ── Themes this week ─────────────────────────────────────
              SliverToBoxAdapter(child: _ThemesSection(filters: _filters)),

              // ── Upcoming experiences ─────────────────────────────────
              const SliverToBoxAdapter(child: _ExperiencesSection()),

              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Sticky header delegate ────────────────────────────────────────────────────

class _DiscoverHeaderDelegate extends SliverPersistentHeaderDelegate {
  final DiscoverFilters filters;
  final VoidCallback onSearchTap;
  final VoidCallback onFilterTap;

  const _DiscoverHeaderDelegate({
    required this.filters,
    required this.onSearchTap,
    required this.onFilterTap,
  });

  @override
  double get minExtent => 124;
  @override
  double get maxExtent => 124;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'Discover',
                style: AppTypography.h1.copyWith(fontSize: 28),
              ),
              const Spacer(),
              if (filters.activeCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  margin: const EdgeInsets.only(right: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primaryTint,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${filters.activeCount} filter${filters.activeCount > 1 ? 's' : ''}',
                    style: AppTypography.label.copyWith(
                      color: AppColors.coral,
                      fontSize: 11,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          // Search pill with filter icon
          GestureDetector(
            onTap: onSearchTap,
            child: Container(
              height: 46,
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.hairline, width: 0.5),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  Icon(
                    PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
                    size: 17,
                    color: AppColors.inkMuted,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Try "Coorg coffee trails"',
                      style: AppTypography.body.copyWith(color: AppColors.inkFaint),
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 22,
                    color: AppColors.hairline,
                    margin: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  GestureDetector(
                    onTap: onFilterTap,
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: Icon(
                        PhosphorIcons.slidersHorizontal(PhosphorIconsStyle.regular),
                        size: 17,
                        color: filters.activeCount > 0 ? AppColors.coral : AppColors.inkMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _DiscoverHeaderDelegate old) =>
      old.filters != filters;
}

// ── Themes grid ───────────────────────────────────────────────────────────────

class _ThemesSection extends ConsumerWidget {
  final DiscoverFilters filters;
  const _ThemesSection({required this.filters});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverThemesProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _EyebrowHeader(label: 'Themes this week'),
          const SizedBox(height: 14),
          async.when(
            loading: () => _ThemesGridSkeleton(),
            error: (_, _) => const SizedBox.shrink(),
            data: (themes) {
              if (themes.isEmpty) return const SizedBox.shrink();
              return GridView.builder(
                shrinkWrap: true,
                primary: false,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 3 / 4,
                ),
                itemCount: themes.length.clamp(0, 6),
                itemBuilder: (context, i) {
                  final theme = themes[i];
                  final countLabel =
                      '${theme.contentCount} chapter${theme.contentCount == 1 ? '' : 's'}';
                  return EditorialTile(
                    title: theme.displayName,
                    subtitle: countLabel.toUpperCase(),
                    coverImageUrl: theme.coverImageUrl,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      // sub_category is 'vertical.slug' — extract vertical prefix
                      final vertical = theme.subCategory.split('.').first;
                      context.push(
                        '/discover/category/$vertical',
                        extra: {'sub_category_id': theme.subCategory},
                      );
                    },
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ThemesGridSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      primary: false,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 3 / 4,
      children: List.generate(
        4,
        (_) => const SkeletonRect(borderRadius: 16),
      ),
    );
  }
}

// ── Creators rail ─────────────────────────────────────────────────────────────

class _CreatorsSection extends ConsumerWidget {
  const _CreatorsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverCreatorsProvider);

    return async.when(
      loading: () => _CreatorsSkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (result) {
        if (result.creators.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 14),
              child: _EyebrowHeader(label: result.label),
            ),
            SizedBox(
              height: 186,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: result.creators.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (context, i) =>
                    _CreatorChip(creator: result.creators[i]),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _CreatorChip extends StatelessWidget {
  final DiscoverCreator creator;
  const _CreatorChip({required this.creator});

  @override
  Widget build(BuildContext context) {
    final name = creator.displayName ?? creator.username ?? 'Creator';
    final followerLabel = creator.followerCount > 0
        ? '${formatCount(creator.followerCount)} followers'
        : creator.vertical[0].toUpperCase() + creator.vertical.substring(1);

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        context.push('/profile/${creator.id}');
      },
      child: Container(
        width: 120,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.hairline, width: 0.5),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A101828),
              blurRadius: 10,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _CreatorAvatar(name: name, avatarUrl: creator.avatarUrl),
            const SizedBox(height: 10),
            Text(
              name,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 3),
            Text(
              followerLabel,
              style: AppTypography.label.copyWith(
                color: AppColors.inkMuted,
                fontSize: 10,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 30,
              child: OutlinedButton(
                onPressed: () => HapticFeedback.selectionClick(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.coral,
                  side: const BorderSide(color: AppColors.coral, width: 1.25),
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  textStyle: AppTypography.label.copyWith(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: const Text('Follow'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CreatorAvatar extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  const _CreatorAvatar({required this.name, this.avatarUrl});

  static const _palette = [
    Color(0xFFB8860B), Color(0xFF5A7247), Color(0xFF7C5CBF),
    Color(0xFFE15A41), Color(0xFF3B7DD8), Color(0xFF2D8F6F),
    Color(0xFF8B4F8B), Color(0xFF888888),
  ];

  @override
  Widget build(BuildContext context) {
    final color = _palette[name.hashCode.abs() % _palette.length];
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final fallback = Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(initial,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
    );

    if (avatarUrl == null || avatarUrl!.isEmpty) return fallback;
    return ClipOval(
      child: SizedBox(
        width: 48,
        height: 48,
        child: CachedNetworkImage(
          imageUrl: avatarUrl!,
          fit: BoxFit.cover,
          placeholder: (_, _) => fallback,
          errorWidget: (_, _, _) => fallback,
        ),
      ),
    );
  }
}

class _CreatorsSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 28, 20, 14),
          child: SkeletonLine(width: 160, height: 13),
        ),
        SizedBox(
          height: 186,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 5,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (_, _) => const SkeletonRect(width: 120, height: 186, borderRadius: 16),
          ),
        ),
      ],
    );
  }
}

// ── Experiences list ──────────────────────────────────────────────────────────

class _ExperiencesSection extends ConsumerWidget {
  const _ExperiencesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverExperiencesProvider);

    return async.when(
      loading: () => _ExperiencesSkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (experiences) {
        if (experiences.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 28, 20, 14),
              child: _EyebrowHeader(label: 'Experiences'),
            ),
            ...experiences.map((e) => _ExperienceCard(experience: e)),
          ],
        );
      },
    );
  }
}

class _ExperienceCard extends StatelessWidget {
  final DiscoverExperience experience;
  const _ExperienceCard({required this.experience});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        context.push('/experiences/${experience.id}');
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.hairline, width: 0.5),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A101828),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 76,
                height: 76,
                child: experience.coverImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: experience.coverImageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => const _ThumbPlaceholder(),
                        errorWidget: (_, _, _) => const _ThumbPlaceholder(),
                      )
                    : const _ThumbPlaceholder(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (experience.cityName != null)
                    Text(
                      experience.cityName!.toUpperCase(),
                      style: AppTypography.label.copyWith(
                        color: AppColors.inkMuted,
                        fontSize: 9,
                        letterSpacing: 0.5,
                      ),
                    ),
                  const SizedBox(height: 3),
                  Text(
                    experience.title,
                    style: AppTypography.h2.copyWith(fontSize: 15, height: 1.2),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        formatPrice(experience.pricePaisa),
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.ink,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (experience.seatsRemaining != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceAlt,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '${experience.seatsRemaining} seats left',
                            style: AppTypography.label.copyWith(
                              color: AppColors.inkMuted,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Icon(
              PhosphorIcons.caretRight(PhosphorIconsStyle.regular),
              size: 14,
              color: AppColors.inkFaint,
            ),
          ],
        ),
      ),
    );
  }
}

class _ThumbPlaceholder extends StatelessWidget {
  const _ThumbPlaceholder();
  @override
  Widget build(BuildContext context) => const ColoredBox(color: AppColors.surfaceAlt);
}

class _ExperiencesSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 28, 20, 14),
          child: SkeletonLine(width: 120, height: 13),
        ),
        ...List.generate(3, (_) => const Padding(
          padding: EdgeInsets.fromLTRB(20, 0, 20, 10),
          child: SkeletonRect(height: 100, borderRadius: 16),
        )),
      ],
    );
  }
}

// ── Eyebrow header ────────────────────────────────────────────────────────────

class _EyebrowHeader extends StatelessWidget {
  final String label;
  const _EyebrowHeader({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: AppTypography.label.copyWith(
        color: AppColors.inkMuted,
        fontSize: 10,
        letterSpacing: 0.8,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

