import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/near_you_provider.dart';
import '../providers/vertical_section_provider.dart';
import '../providers/discover_provider.dart';
import '../providers/editors_picks_provider.dart';
import '../providers/for_you_provider.dart';
import '../providers/following_provider.dart';
import '../providers/hero_provider.dart';
import '../providers/user_city_provider.dart';
import '../utils/feed_navigation.dart';
import '../models/feed_models.dart';
import '../widgets/near_you_section.dart';
import '../widgets/vertical_section.dart';
import '../widgets/discover_section.dart';
import '../widgets/editors_picks_section.dart';
import '../widgets/content_card.dart';
import '../widgets/hero_card.dart';
import '../widgets/feed_chip_rail.dart';
import 'location_picker_screen.dart';

const _kGuestLocationPromptedKey = 'guest.location_prompted';

/// Home feed — chip rail navigation + editorial section layout (DD-007, DISC-FR-021).
///
/// Nav chips: For you / Following / Near you.
/// Category chips: Travel / Stories — tap jumps to that section in the For-you view.
/// Hero card anchors every view; section headers use monospace eyebrow + Fraunces title.
class HomeFeedScreen extends ConsumerStatefulWidget {
  const HomeFeedScreen({super.key});

  @override
  ConsumerState<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends ConsumerState<HomeFeedScreen> {
  String _navId = kFeedNavForYou;
  final _scrollController = ScrollController();

  // Section keys for scroll-jump (category chips)
  final _travelKey = GlobalKey();
  final _storiesKey = GlobalKey();

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
    ref.invalidate(heroProvider(_navId));
    ref.invalidate(forYouProvider);
    ref.invalidate(followingProvider);
    ref.invalidate(nearYouProvider);
    ref.invalidate(verticalSectionProvider('travel'));
    ref.invalidate(verticalSectionProvider('stories'));
    ref.invalidate(discoverProvider);
    ref.invalidate(editorPicksProvider);
  }

  void _handleNavSelect(String navId) {
    setState(() => _navId = navId);
    // Scroll back to top when switching nav
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _handleCategoryJump(String vertical) {
    // Switch to For-you if not already there
    if (_navId != kFeedNavForYou) {
      setState(() => _navId = kFeedNavForYou);
    }
    // Scroll to the section after the frame is laid out
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final key = vertical == kFeedCatTravel ? _travelKey : _storiesKey;
      final ctx = key.currentContext;
      if (ctx != null) {
        Scrollable.ensureVisible(
          ctx,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
          alignment: 0.0,
        );
      }
    });
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
            controller: _scrollController,
            slivers: [
              // ── Sticky top bar ────────────────────────────────────
              SliverPersistentHeader(
                pinned: true,
                delegate: _FeedTopBarDelegate(
                  onLocationTap: _openLocationPicker,
                  onSearchTap: () => context.go('/discover'),
                  onBellTap: () => context.push('/notifications/preferences'),
                ),
              ),

              // ── Chip rail (sticky just below top bar) ─────────────
              SliverPersistentHeader(
                pinned: true,
                delegate: _ChipRailDelegate(
                  selectedNavId: _navId,
                  onNavSelect: _handleNavSelect,
                  onCategoryJump: _handleCategoryJump,
                ),
              ),

              // ── Body ──────────────────────────────────────────────
              ..._bodyFor(_navId),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _bodyFor(String navId) {
    switch (navId) {
      case kFeedNavFollowing:
        return [
          SliverToBoxAdapter(child: _Hero(tab: navId)),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
          const SliverToBoxAdapter(child: _FollowingBody()),
        ];

      case kFeedNavNearYou:
        return [
          SliverToBoxAdapter(child: _Hero(tab: navId)),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
          const SliverToBoxAdapter(child: NearYouSection()),
          SliverToBoxAdapter(
            child: _SectionBlock(
              eyebrow: 'TRAVEL',
              title: 'Trips worth your weekend',
              onSeeAll: () => context.push('/feed/vertical/travel', extra: {'title': 'Trips worth your weekend'}),
              child: VerticalSection(vertical: 'travel', eyebrow: '', sectionTitle: ''),
            ),
          ),
          SliverToBoxAdapter(
            child: _SectionBlock(
              eyebrow: 'STORIES',
              title: 'From the people who go',
              onSeeAll: () => context.push('/feed/vertical/stories', extra: {'title': 'From the people who go'}),
              child: VerticalSection(vertical: 'stories', eyebrow: '', sectionTitle: ''),
            ),
          ),
          const SliverToBoxAdapter(child: DiscoverSection()),
        ];

      case kFeedNavForYou:
      default:
        return [
          // Hero — editorial pull
          SliverToBoxAdapter(child: _Hero(tab: navId)),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),

          // For-you ranked grid
          const SliverToBoxAdapter(child: _ForYouVerticalFeed()),

          // Editor's picks — hidden when empty (DISC-FR-039)
          const SliverToBoxAdapter(child: EditorPicksSection()),

          // Travel section (scroll-jump target)
          SliverToBoxAdapter(
            key: _travelKey,
            child: _SectionBlock(
              eyebrow: 'TRAVEL',
              title: 'Trips worth your weekend',
              onSeeAll: () => context.push('/feed/vertical/travel', extra: {'title': 'Trips worth your weekend'}),
              child: VerticalSection(vertical: 'travel', eyebrow: '', sectionTitle: ''),
            ),
          ),

          // Stories section (scroll-jump target)
          SliverToBoxAdapter(
            key: _storiesKey,
            child: _SectionBlock(
              eyebrow: 'STORIES',
              title: 'From the people who go',
              onSeeAll: () => context.push('/feed/vertical/stories', extra: {'title': 'From the people who go'}),
              child: VerticalSection(vertical: 'stories', eyebrow: '', sectionTitle: ''),
            ),
          ),

          // Serendipity
          const SliverToBoxAdapter(child: DiscoverSection()),
        ];
    }
  }

  void _openLocationPicker({bool showSkip = false}) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => LocationPickerScreen(showSkip: showSkip),
    );
  }
}

// ── Section block — eyebrow + Fraunces title + "See all" + content ──────────────

class _SectionBlock extends StatelessWidget {
  final String eyebrow;
  final String title;
  final Widget child;
  final VoidCallback? onSeeAll;

  const _SectionBlock({
    required this.eyebrow,
    required this.title,
    required this.child,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      eyebrow,
                      style: AppTypography.label.copyWith(
                        color: AppColors.inkMuted,
                        fontSize: 10,
                        letterSpacing: 0.8,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      style: AppTypography.h2.copyWith(fontSize: 21),
                    ),
                  ],
                ),
              ),
              if (onSeeAll != null)
                GestureDetector(
                  onTap: onSeeAll,
                  child: Row(
                    children: [
                      Text(
                        'See all',
                        style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
                      ),
                      const SizedBox(width: 2),
                      const Icon(Icons.chevron_right, size: 14, color: AppColors.inkSoft),
                    ],
                  ),
                ),
            ],
          ),
        ),
        child,
      ],
    );
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
  final String selectedNavId;
  final void Function(String) onNavSelect;
  final void Function(String) onCategoryJump;

  const _ChipRailDelegate({
    required this.selectedNavId,
    required this.onNavSelect,
    required this.onCategoryJump,
  });

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
        selectedNavId: selectedNavId,
        onNavSelect: onNavSelect,
        onCategoryJump: onCategoryJump,
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _ChipRailDelegate old) =>
      old.selectedNavId != selectedNavId;
}

// ── Hero card (tab-aware eyebrow) ─────────────────────────────────────────────

class _Hero extends ConsumerWidget {
  final String tab;
  const _Hero({required this.tab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(heroProvider(tab));
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: async.when(
        loading: () => const _HeroSkeleton(),
        error: (_, _) => const SizedBox.shrink(),
        data: (item) {
          if (item == null) return const SizedBox.shrink();
          return HeroCard(
            item: item,
            eyebrow: _eyebrowFor(tab),
            onTap: () => openFeedItem(context, item),
          );
        },
      ),
    );
  }

  static String _eyebrowFor(String tab) {
    switch (tab) {
      case kFeedNavFollowing: return 'From your follows';
      case kFeedNavNearYou:   return 'Near you · this weekend';
      default:                return 'Featured for you';
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

// ── For-you 2-col grid ────────────────────────────────────────────────────────

class _ForYouVerticalFeed extends ConsumerWidget {
  const _ForYouVerticalFeed();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(forYouProvider);
    return async.when(
      loading: () => const _FeedGridSkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        // Skip index 0 — rendered as hero
        final body = items.length > 1
            ? items.sublist(1, items.length.clamp(1, 7))
            : const <FeedContentItem>[];
        if (body.isEmpty) return const SizedBox.shrink();
        return _FeedGrid(items: body);
      },
    );
  }
}

// ── Following grid or empty state ─────────────────────────────────────────────

class _FollowingBody extends ConsumerWidget {
  const _FollowingBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(followingProvider);
    return async.when(
      loading: () => const _FeedGridSkeleton(),
      error: (_, _) => const _EmptyState(
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
        return _FeedGrid(items: items);
      },
    );
  }
}

// ── Shared 2-col grid ─────────────────────────────────────────────────────────

class _FeedGrid extends StatelessWidget {
  final List<FeedContentItem> items;
  const _FeedGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
      child: GridView.builder(
        shrinkWrap: true,
        primary: false,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 18,
          crossAxisSpacing: 12,
          childAspectRatio: 0.633,
        ),
        itemCount: items.length,
        itemBuilder: (context, i) => ContentCard(
          item: items[i],
          variant: ContentCardVariant.grid,
          onTap: () => openFeedItem(context, items[i]),
        ),
      ),
    );
  }
}

class _FeedGridSkeleton extends StatelessWidget {
  const _FeedGridSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
      child: GridView.builder(
        shrinkWrap: true,
        primary: false,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 18,
          crossAxisSpacing: 12,
          childAspectRatio: 0.633,
        ),
        itemCount: 4,
        itemBuilder: (_, _) => const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: SkeletonRect(borderRadius: 12),
            ),
            SizedBox(height: 8),
            SkeletonLine(height: 13),
            SizedBox(height: 6),
            SkeletonLine(width: 100, height: 11),
          ],
        ),
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

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
