import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/near_you_provider.dart';
import '../providers/vertical_section_provider.dart';
import '../providers/discover_provider.dart';
import '../providers/for_you_provider.dart';
import '../providers/following_provider.dart';
import '../providers/hero_provider.dart';
import '../providers/user_city_provider.dart';
import '../utils/feed_navigation.dart';
import '../widgets/near_you_section.dart';
import '../widgets/vertical_section.dart';
import '../widgets/discover_section.dart';
import '../widgets/content_card.dart';
import '../widgets/hero_card.dart';
import '../widgets/segmented_tabs.dart';
import 'location_picker_screen.dart';

const _tabForYou = 'for_you';
const _tabFollowing = 'following';
const _tabNearYou = 'near_you';

const _segmentedTabs = <SegmentedTab>[
  SegmentedTab(id: _tabForYou, label: 'For you'),
  SegmentedTab(id: _tabFollowing, label: 'Following'),
  SegmentedTab(id: _tabNearYou, label: 'Near you'),
];

/// Home Feed v2 (E1.5b). Three-tab layout with tab-aware hero, hybrid
/// horizontal rails + vertical feed. All sections fetch independently.
class HomeFeedScreen extends ConsumerStatefulWidget {
  const HomeFeedScreen({super.key});

  @override
  ConsumerState<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends ConsumerState<HomeFeedScreen> {
  String _tab = _tabForYou;

  Future<void> _refresh() async {
    ref.invalidate(heroProvider(_tab));
    ref.invalidate(forYouProvider);
    ref.invalidate(followingProvider);
    ref.invalidate(nearYouProvider);
    ref.invalidate(verticalSectionProvider('travel'));
    ref.invalidate(verticalSectionProvider('stories'));
    ref.invalidate(discoverProvider);
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
              SliverPersistentHeader(
                pinned: true,
                delegate: _FeedTopBarDelegate(onLocationTap: _openLocationPicker),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 4, bottom: 18),
                  child: SegmentedTabs(
                    tabs: _segmentedTabs,
                    selectedId: _tab,
                    onSelect: (id) => setState(() => _tab = id),
                  ),
                ),
              ),
              SliverToBoxAdapter(child: _Hero(tab: _tab)),
              const SliverToBoxAdapter(child: SizedBox(height: 28)),
              ..._bodyFor(_tab),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _bodyFor(String tab) {
    switch (tab) {
      case _tabFollowing:
        return const [SliverToBoxAdapter(child: _FollowingBody())];
      case _tabNearYou:
        return const [
          SliverToBoxAdapter(child: NearYouSection()),
          SliverToBoxAdapter(
            child: VerticalSection(
              vertical: 'travel',
              eyebrow: 'TRAVEL',
              sectionTitle: 'Trips worth your weekend',
            ),
          ),
          SliverToBoxAdapter(
            child: VerticalSection(
              vertical: 'stories',
              eyebrow: 'STORIES WORTH READING',
              sectionTitle: 'From the people who go',
            ),
          ),
          SliverToBoxAdapter(child: DiscoverSection()),
        ];
      case _tabForYou:
      default:
        return const [
          SliverToBoxAdapter(child: _ForYouVerticalFeed()),
          SliverToBoxAdapter(
            child: VerticalSection(
              vertical: 'travel',
              eyebrow: 'TRAVEL',
              sectionTitle: 'Trips worth your weekend',
            ),
          ),
          SliverToBoxAdapter(
            child: VerticalSection(
              vertical: 'stories',
              eyebrow: 'STORIES WORTH READING',
              sectionTitle: 'From the people who go',
            ),
          ),
          SliverToBoxAdapter(child: DiscoverSection()),
        ];
    }
  }

  void _openLocationPicker() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const LocationPickerScreen(),
    );
  }
}

// ── Top Bar ─────────────────────────────────────────────────────

class _FeedTopBarDelegate extends SliverPersistentHeaderDelegate {
  final VoidCallback onLocationTap;
  const _FeedTopBarDelegate({required this.onLocationTap});

  @override
  double get minExtent => 56;
  @override
  double get maxExtent => 56;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      height: maxExtent,
      color: AppColors.bg,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(child: _LocationChip(onTap: onLocationTap)),
          const SizedBox(width: 12),
          const _IconBtn(icon: PhosphorIconsRegular.bell),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _FeedTopBarDelegate old) => false;
}

class _LocationChip extends ConsumerWidget {
  final VoidCallback onTap;
  const _LocationChip({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cityName = ref.watch(userCityProvider).cityName ?? 'Set location';
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(PhosphorIconsFill.mapPin, size: 14, color: AppColors.coral),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                cityName,
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.expand_more, size: 16, color: AppColors.inkSoft),
          ],
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  const _IconBtn({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: const BoxDecoration(
        color: AppColors.surfaceAlt,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 19, color: AppColors.ink),
    );
  }
}

// ── Hero slot (tab-aware) ───────────────────────────────────────

class _Hero extends ConsumerWidget {
  final String tab;
  const _Hero({required this.tab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(heroProvider(tab));
    return async.when(
      loading: () => const _HeroSkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (item) {
        if (item == null) return const SizedBox.shrink();
        return HeroCard(
          item: item,
          eyebrow: _eyebrowForTab(tab),
          onTap: () => openFeedItem(context, item),
        );
      },
    );
  }

  static String _eyebrowForTab(String tab) {
    switch (tab) {
      case _tabFollowing:
        return 'From your follows';
      case _tabNearYou:
        return 'Near you · this weekend';
      case _tabForYou:
      default:
        return 'Featured for you';
    }
  }
}

class _HeroSkeleton extends StatelessWidget {
  const _HeroSkeleton();
  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: ClipRRect(
        borderRadius: BorderRadius.all(Radius.circular(20)),
        child: SkeletonRect(height: 220),
      ),
    );
  }
}

// ── For-you vertical feed (top 6 ranked items) ─────────────────

class _ForYouVerticalFeed extends ConsumerWidget {
  const _ForYouVerticalFeed();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(forYouProvider);
    return async.when(
      loading: () => const _VerticalFeedSkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        // Skip index 0 — already rendered as hero
        final body = items.length > 1 ? items.sublist(1, items.length.clamp(1, 7)) : const [];
        if (body.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (int i = 0; i < body.length; i++) ...[
              ContentCard(
                item: body[i],
                variant: ContentCardVariant.vertical,
                onTap: () => openFeedItem(context, body[i]),
              ),
              if (i < body.length - 1) const SizedBox(height: 24),
            ],
            const SizedBox(height: 32),
          ],
        );
      },
    );
  }
}

// ── Following body (vertical feed or empty state) ──────────────

class _FollowingBody extends ConsumerWidget {
  const _FollowingBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(followingProvider);
    return async.when(
      loading: () => const _VerticalFeedSkeleton(),
      error: (e, st) => const _EmptyState(
        icon: PhosphorIconsRegular.warning,
        title: 'Couldn\u2019t load your follows',
        subtitle: 'Pull down to retry.',
      ),
      data: (items) {
        if (items.isEmpty) {
          return const _EmptyState(
            icon: PhosphorIconsRegular.users,
            title: 'Your follows live here',
            subtitle:
                'Follow creators to see their latest posts, trips, and experiences in one place.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (int i = 0; i < items.length; i++) ...[
              ContentCard(
                item: items[i],
                variant: ContentCardVariant.vertical,
                onTap: () => openFeedItem(context, items[i]),
              ),
              if (i < items.length - 1) const SizedBox(height: 24),
            ],
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }
}

class _VerticalFeedSkeleton extends StatelessWidget {
  const _VerticalFeedSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: List.generate(
          2,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonRect(height: 220, borderRadius: 16),
                SizedBox(height: 12),
                SkeletonLine(width: 240, height: 16),
                SizedBox(height: 6),
                SkeletonLine(width: 140, height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Empty state (shared for Following / For-you) ───────────────

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(32, 24, 32, 32),
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
            child: Icon(icon, size: 32, color: AppColors.inkSoft),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: AppTypography.h4.copyWith(color: AppColors.ink),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: AppTypography.body.copyWith(color: AppColors.inkMuted, height: 1.5),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
