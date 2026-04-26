import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/following_provider.dart';
import '../providers/posts_feed_provider.dart';
import '../providers/section_rails_provider.dart';
import '../providers/sub_categories_provider.dart';
import '../providers/user_city_provider.dart';
import '../providers/vertical_section_provider.dart';
import '../utils/feed_navigation.dart';
import '../models/feed_models.dart';
import '../widgets/browse_by_interest_grid.dart';
import '../widgets/content_card.dart';
import '../widgets/feed_chip_rail.dart';
import '../widgets/happening_this_weekend_section.dart';
import '../widgets/horizontal_rail_section.dart';
import '../widgets/quick_intent_strip.dart';
import '../widgets/stories_rail_section.dart';
import '../widgets/sub_cat_filtered_grid.dart';
import 'location_picker_screen.dart';

const _kGuestLocationPromptedKey = 'guest.location_prompted';

/// Home feed — Travel-only launch.
///
/// Chip rail: [Near you][Following] | [All][Posts][🚗][🏍️][🥾][🍜]
/// All sub-cat = 9-section editorial body.
/// Posts sub-cat = inline Instagram-style vertical posts feed.
/// Specific sub-cat = 2-col filtered grid.
class HomeFeedScreen extends ConsumerStatefulWidget {
  const HomeFeedScreen({super.key});

  @override
  ConsumerState<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends ConsumerState<HomeFeedScreen> {
  FeedChipSelection _selection = const FeedChipSelection(
    navId: kFeedNavNearYou,
    subCatId: kFeedSubCatAll,
  );
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybePromptGuestLocation());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _maybePromptGuestLocation() async {
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (!auth.isGuest) return;
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_kGuestLocationPromptedKey) ?? false) return;
    await prefs.setBool(_kGuestLocationPromptedKey, true);
    if (!mounted) return;
    _openLocationPicker(showSkip: true);
  }

  Future<void> _refresh() async {
    final cityId = ref.read(userCityProvider).cityId;
    final params = SectionRailParams(cityId: cityId);
    ref.invalidate(hotNearYouProvider(params));
    ref.invalidate(tripsFromCityProvider(params));
    ref.invalidate(thisWeekendProvider(params));
    ref.invalidate(upcomingEventsProvider(params));
    ref.invalidate(dayTripsProvider(params));
    ref.invalidate(weekendGetawaysProvider(params));
    ref.invalidate(happeningThisWeekendProvider(params));
    ref.invalidate(storiesRailProvider(cityId));
    ref.invalidate(subCategoriesProvider);
    ref.invalidate(followingProvider);
  }

  void _onSelectionChange(FeedChipSelection next) {
    setState(() => _selection = next);
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = _bodyForSelection(_selection);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: _refresh,
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverPersistentHeader(
                pinned: true,
                delegate: _FeedTopBarDelegate(
                  onLocationTap: _openLocationPicker,
                  onSearchTap: () => context.go('/discover'),
                  onBellTap: () => context.push('/notifications/preferences'),
                ),
              ),
              SliverPersistentHeader(
                pinned: true,
                delegate: _ChipRailDelegate(
                  selection: _selection,
                  onChange: _onSelectionChange,
                ),
              ),
              ...body,
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
        ),
      ),
    );
  }

  void _openLocationPicker({bool showSkip = false}) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => LocationPickerScreen(showSkip: showSkip),
    );
  }

  // ── Body composition ────────────────────────────────────────────────────────

  List<Widget> _bodyForSelection(FeedChipSelection sel) {
    // Posts chip: vertical Instagram-style feed inline as a SliverList.
    if (sel.subCatId == kFeedSubCatPosts) {
      final cityId = ref.watch(userCityProvider).cityId;
      return [
        SliverToBoxAdapter(
          child: _InlinePostsFeed(
            scope: sel.navId,
            cityId: cityId,
            scrollController: _scrollController,
          ),
        ),
      ];
    }

    // Specific sub-cat chip: single 2-col grid filtered to that sub-cat.
    if (sel.subCatId != kFeedSubCatAll) {
      return [
        SliverToBoxAdapter(
          child: SubCatFilteredGrid(
            subCategoryId: sel.subCatId,
            scope: sel.navId,
          ),
        ),
      ];
    }

    // Following + All: chronological grid of followed creators' content.
    if (sel.navId == kFeedNavFollowing) {
      return const [SliverToBoxAdapter(child: _FollowingBody())];
    }

    // Near you + All: 9-section editorial layout.
    final cityId = ref.watch(userCityProvider).cityId;
    final cityName = ref.watch(userCityProvider).cityName;
    final railParams = SectionRailParams(cityId: cityId);
    final cityLabel = cityName ?? 'you';

    return [
      const SliverToBoxAdapter(child: SizedBox(height: 12)),
      const SliverToBoxAdapter(child: QuickIntentStrip()),

      const SliverToBoxAdapter(child: HappeningThisWeekendSection()),

      const SliverToBoxAdapter(child: StoriesRailSection()),

      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(hotNearYouProvider(railParams)),
          eyebrow: 'TRENDING',
          title: "What's hot near $cityLabel",
          onSeeAll: () => context.push('/feed/section/hot-near-you'),
        ),
      ),

      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(tripsFromCityProvider(railParams)),
          eyebrow: 'TRIPS',
          title: 'Trips starting from $cityLabel',
          onSeeAll: () => context.push('/feed/section/trips-from-city'),
        ),
      ),

      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(thisWeekendProvider(railParams)),
          eyebrow: 'WEEKEND',
          title: 'This weekend in $cityLabel',
          onSeeAll: () => context.push('/feed/section/this-weekend'),
        ),
      ),

      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(verticalSectionProvider(
            const VerticalSectionParams('travel',
                subCategoryId: kFeedSubCatRoadTrips),
          )),
          eyebrow: 'ROAD TRIPS',
          title: 'Road Trips near $cityLabel',
          onSeeAll: () =>
              context.push('/feed/section/sub-cat/$kFeedSubCatRoadTrips'),
        ),
      ),
      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(verticalSectionProvider(
            const VerticalSectionParams('travel',
                subCategoryId: kFeedSubCatBiking),
          )),
          eyebrow: 'BIKING',
          title: 'Biking near $cityLabel',
          onSeeAll: () =>
              context.push('/feed/section/sub-cat/$kFeedSubCatBiking'),
        ),
      ),
      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(verticalSectionProvider(
            const VerticalSectionParams('travel',
                subCategoryId: kFeedSubCatTrekking),
          )),
          eyebrow: 'TREKKING',
          title: 'Trekking near $cityLabel',
          onSeeAll: () =>
              context.push('/feed/section/sub-cat/$kFeedSubCatTrekking'),
        ),
      ),
      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(verticalSectionProvider(
            const VerticalSectionParams('travel',
                subCategoryId: kFeedSubCatFoodTrails),
          )),
          eyebrow: 'FOOD TRAILS',
          title: 'Food Trails near $cityLabel',
          onSeeAll: () =>
              context.push('/feed/section/sub-cat/$kFeedSubCatFoodTrails'),
        ),
      ),

      SliverToBoxAdapter(
        child: HorizontalRailSection(
          async: ref.watch(upcomingEventsProvider(railParams)),
          eyebrow: 'EVENTS',
          title: 'Upcoming events',
          onSeeAll: () => context.push('/feed/section/upcoming-events'),
        ),
      ),

      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
          child: Text(
            'Browse by interest',
            style: AppTypography.h2.copyWith(fontSize: 21),
          ),
        ),
      ),
      SliverToBoxAdapter(
        child: BrowseByInterestGrid(
          onSelectSubCat: (slug) =>
              _onSelectionChange(_selection.copyWith(subCatId: slug)),
        ),
      ),
    ];
  }
}

// ── Sticky top bar ────────────────────────────────────────────────────────────

class _FeedTopBarDelegate extends SliverPersistentHeaderDelegate {
  final VoidCallback onLocationTap;
  final VoidCallback onSearchTap;
  final VoidCallback onBellTap;

  const _FeedTopBarDelegate({
    required this.onLocationTap,
    required this.onSearchTap,
    required this.onBellTap,
  });

  @override
  double get minExtent => 56;
  @override
  double get maxExtent => 56;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      height: maxExtent,
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(child: _LocationChip(onTap: onLocationTap)),
          const SizedBox(width: 10),
          _IconBtn(
            icon: PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
            onTap: onSearchTap,
          ),
          const SizedBox(width: 8),
          _IconBtn(
            icon: PhosphorIcons.bell(PhosphorIconsStyle.regular),
            onTap: onBellTap,
          ),
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
    final cityName = ref.watch(userCityProvider).cityName ?? 'Select city';
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            PhosphorIcons.mapPin(PhosphorIconsStyle.fill),
            size: 14,
            color: AppColors.coral,
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              cityName,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.ink,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            PhosphorIcons.caretDown(PhosphorIconsStyle.regular),
            size: 14,
            color: AppColors.inkSoft,
          ),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _IconBtn({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap?.call();
      },
      child: Container(
        width: 38,
        height: 38,
        decoration: const BoxDecoration(
          color: AppColors.surfaceAlt,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 18, color: AppColors.ink),
      ),
    );
  }
}

// ── Chip rail delegate (sticky below top bar) ─────────────────────────────────

class _ChipRailDelegate extends SliverPersistentHeaderDelegate {
  final FeedChipSelection selection;
  final ValueChanged<FeedChipSelection> onChange;

  const _ChipRailDelegate({required this.selection, required this.onChange});

  @override
  double get minExtent => 52;
  @override
  double get maxExtent => 52;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.hairline, width: 0.5)),
      ),
      child: FeedChipRail(
        selection: selection,
        onSelectionChange: onChange,
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _ChipRailDelegate old) =>
      old.selection != selection;
}

// ── Following body (chronological grid) ───────────────────────────────────────

class _FollowingBody extends ConsumerWidget {
  const _FollowingBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(followingProvider);
    return async.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 80),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.coral),
        ),
      ),
      error: (_, _) => const _EmptyState(
        icon: PhosphorIconsRegular.warning,
        title: "Couldn't load your follows",
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
            itemCount: items.length,
            itemBuilder: (context, i) => ContentCard(
              item: items[i],
              variant: ContentCardVariant.grid,
              onTap: () => openFeedItem(context, items[i]),
            ),
          ),
        );
      },
    );
  }
}

// ── Inline posts feed (used when Posts chip is active) ───────────────────────

class _InlinePostsFeed extends ConsumerStatefulWidget {
  final String scope;
  final String? cityId;
  final ScrollController scrollController;

  const _InlinePostsFeed({
    required this.scope,
    required this.cityId,
    required this.scrollController,
  });

  @override
  ConsumerState<_InlinePostsFeed> createState() => _InlinePostsFeedState();
}

class _InlinePostsFeedState extends ConsumerState<_InlinePostsFeed> {
  late final PostsFeedParams _params = PostsFeedParams(
    scope: widget.scope,
    cityId: widget.cityId,
  );

  @override
  void initState() {
    super.initState();
    widget.scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    super.dispose();
  }

  void _onScroll() {
    final c = widget.scrollController;
    if (!c.hasClients) return;
    if (c.position.pixels >= c.position.maxScrollExtent - 600) {
      ref.read(postsFeedProvider(_params).notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(postsFeedProvider(_params));
    return async.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 80),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.coral),
        ),
      ),
      error: (_, _) => const _EmptyState(
        icon: PhosphorIconsRegular.warning,
        title: "Couldn't load posts",
        subtitle: 'Pull down to retry.',
      ),
      data: (state) {
        if (state.items.isEmpty) {
          return const _EmptyState(
            icon: PhosphorIconsRegular.article,
            title: 'No posts yet',
            subtitle: 'Pull down to refresh.',
          );
        }
        return Column(
          children: [
            for (final it in state.items) ...[
              _PostRow(item: it),
              Divider(color: AppColors.hairline, height: 24),
            ],
            if (state.isLoadingMore)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.coral,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _PostRow extends StatelessWidget {
  final FeedContentItem item;
  const _PostRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/posts/${item.id}'),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: ContentCard(
          item: item,
          variant: ContentCardVariant.grid,
          onTap: () => openFeedItem(context, item),
        ),
      ),
    );
  }
}

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
      padding: const EdgeInsets.fromLTRB(32, 64, 32, 32),
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
            style: AppTypography.body
                .copyWith(color: AppColors.inkMuted, height: 1.5),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
