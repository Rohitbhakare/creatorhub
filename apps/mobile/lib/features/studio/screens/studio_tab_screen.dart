import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/studio_provider.dart';

class StudioTabScreen extends ConsumerWidget {
  const StudioTabScreen({super.key});

  Future<void> _onRefresh(WidgetRef ref) async {
    ref.invalidate(studioAlertProvider);
    ref.invalidate(studioStatsProvider);
    ref.read(studioContentProvider.notifier).retry();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: () => _onRefresh(ref),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              const SliverToBoxAdapter(child: _StudioTopBar()),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.sm)),
              const SliverToBoxAdapter(child: _AlertHeroCard()),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.lg)),
              const SliverToBoxAdapter(child: _StatsGrid()),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.xl)),
              const SliverToBoxAdapter(child: _ContentSection()),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.lg)),
              const SliverToBoxAdapter(child: _EarningsInfoCard()),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.xxxl)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Top Bar ─────────────────────────────────────────────────────────

class _StudioTopBar extends StatelessWidget {
  const _StudioTopBar();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Studio',
            style: GoogleFonts.fraunces(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              // Notifications — no-op for M1
            },
            child: SizedBox(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              child: Center(
                child: Icon(
                  PhosphorIcons.bell(PhosphorIconsStyle.regular),
                  size: 24,
                  color: AppColors.ink,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Alert Hero Card ──────────────────────────────────────────────────

class _AlertHeroCard extends ConsumerWidget {
  const _AlertHeroCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alertAsync = ref.watch(studioAlertProvider);

    return alertAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(horizontal: Spacing.mlg),
        child: SkeletonRect(height: 140, borderRadius: 14),
      ),
      error: (_, __) => const _QuietStateCard(),
      data: (alert) {
        if (alert == null || alert.isQuietState) {
          return const _QuietStateCard();
        }
        return _ActionAlertCard(alert: alert);
      },
    );
  }
}

class _QuietStateCard extends StatelessWidget {
  const _QuietStateCard();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF2EEE8),
          borderRadius: BorderRadius.circular(14),
        ),
        padding: const EdgeInsets.all(Spacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  PhosphorIcons.pencilSimple(PhosphorIconsStyle.regular),
                  size: 16,
                  color: AppColors.coral,
                ),
                const SizedBox(width: Spacing.xs),
                Text(
                  'GET STARTED',
                  style: AppTypography.label.copyWith(
                    color: AppColors.coral,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              'Start your first piece',
              style: AppTypography.h4,
            ),
            const SizedBox(height: Spacing.xs),
            Text(
              'Post a short write-up or put together your first itinerary.',
              style: AppTypography.body.copyWith(color: AppColors.muted),
            ),
            const SizedBox(height: Spacing.lg),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Create',
                    variant: AppButtonVariant.primary,
                    size: AppButtonSize.small,
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      context.push('/content/create');
                    },
                  ),
                ),
                const SizedBox(width: Spacing.sm),
                Expanded(
                  child: AppButton(
                    label: 'See examples',
                    variant: AppButtonVariant.ghost,
                    size: AppButtonSize.small,
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      // No-op for M1
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionAlertCard extends ConsumerWidget {
  final StudioAlert alert;

  const _ActionAlertCard({required this.alert});

  Future<void> _dismiss(WidgetRef ref) async {
    HapticFeedback.lightImpact();
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/studio/alerts/${alert.id}/dismiss');
    } catch (_) {
      // Best-effort dismiss
    }
    ref.invalidate(studioAlertProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFFFF5F1),
          border: Border.all(color: const Color(0xFFF8C2B0)),
          borderRadius: BorderRadius.circular(14),
        ),
        padding: const EdgeInsets.all(Spacing.lg),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  alert.alertType.toUpperCase().replaceAll('_', ' '),
                  style: AppTypography.label.copyWith(
                    color: AppColors.coral,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: Spacing.sm),
                Padding(
                  padding: const EdgeInsets.only(right: 28),
                  child: Text(
                    alert.title,
                    style: AppTypography.h4,
                  ),
                ),
                const SizedBox(height: Spacing.xs),
                Text(
                  alert.body,
                  style: AppTypography.body.copyWith(color: AppColors.muted),
                ),
              ],
            ),
            Positioned(
              top: 0,
              right: 0,
              child: GestureDetector(
                onTap: () => _dismiss(ref),
                child: const SizedBox(
                  width: Layout.minTapTarget,
                  height: Layout.minTapTarget,
                  child: Icon(
                    Icons.close,
                    size: 18,
                    color: AppColors.muted,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Stats Grid ───────────────────────────────────────────────────────

class _StatsGrid extends ConsumerWidget {
  const _StatsGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(studioStatsProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: statsAsync.when(
        loading: () => Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i < 3 ? Spacing.sm : 0),
                child: const SkeletonRect(height: 72, borderRadius: 12),
              ),
            );
          }),
        ),
        error: (_, __) => const SizedBox.shrink(),
        data: (stats) => Row(
          children: [
            _StatTile(
              value: stats.views > 0 ? formatCount(stats.views) : '—',
              label: 'Views',
            ),
            const SizedBox(width: Spacing.sm),
            _StatTile(
              value: formatCount(stats.saves),
              label: 'Saves',
            ),
            const SizedBox(width: Spacing.sm),
            _StatTile(
              value: stats.bookings > 0 ? formatCount(stats.bookings) : '—',
              label: 'Books',
            ),
            const SizedBox(width: Spacing.sm),
            _StatTile(
              value: formatCount(stats.followers),
              label: 'Followers',
            ),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String value;
  final String label;

  const _StatTile({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.sm,
          vertical: Spacing.md,
        ),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: GoogleFonts.fraunces(
                fontSize: 19,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTypography.caption,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Content Section ──────────────────────────────────────────────────

class _ContentSection extends ConsumerStatefulWidget {
  const _ContentSection();

  @override
  ConsumerState<_ContentSection> createState() => _ContentSectionState();
}

class _ContentSectionState extends ConsumerState<_ContentSection> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(studioContentProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final contentState = ref.watch(studioContentProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Your content', style: AppTypography.h4),
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.push('/content/create');
                },
                child: SizedBox(
                  height: Layout.minTapTarget,
                  child: Center(
                    child: Text(
                      'Create',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.coral,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.md),

        // Filter chips
        _FilterChips(
          currentFilter: contentState.statusFilter,
          onChanged: (filter) {
            HapticFeedback.lightImpact();
            ref.read(studioContentProvider.notifier).setStatusFilter(filter);
          },
        ),
        const SizedBox(height: Spacing.lg),

        // Content list / loading / empty / error
        if (contentState.isLoading)
          _ContentSkeleton()
        else if (contentState.error != null && contentState.items.isEmpty)
          _ContentError(
            onRetry: () =>
                ref.read(studioContentProvider.notifier).retry(),
          )
        else if (contentState.items.isEmpty)
          _ContentEmpty(filter: contentState.statusFilter)
        else
          _ContentList(
            items: contentState.items,
            hasMore: contentState.hasMore,
            isLoadingMore: contentState.isLoadingMore,
            scrollController: _scrollController,
          ),
      ],
    );
  }
}

class _FilterChips extends StatelessWidget {
  final String currentFilter;
  final ValueChanged<String> onChanged;

  const _FilterChips({
    required this.currentFilter,
    required this.onChanged,
  });

  static const _filters = [
    ('all', 'All'),
    ('published', 'Published'),
    ('draft', 'Drafts'),
    ('archived', 'Archived'),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        scrollDirection: Axis.horizontal,
        itemCount: _filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: Spacing.sm),
        itemBuilder: (context, i) {
          final (value, label) = _filters[i];
          final isSelected = currentFilter == value;
          return GestureDetector(
            onTap: () => onChanged(value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.lg,
                vertical: Spacing.sm,
              ),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.coral : AppColors.white,
                borderRadius: BorderRadius.circular(Layout.chipRadius),
                border: Border.all(
                  color:
                      isSelected ? AppColors.coral : AppColors.border,
                ),
              ),
              child: Text(
                label,
                style: AppTypography.bodySmall.copyWith(
                  color: isSelected ? AppColors.white : AppColors.ink,
                  fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ContentList extends StatelessWidget {
  final List<StudioContentItem> items;
  final bool hasMore;
  final bool isLoadingMore;
  final ScrollController scrollController;

  const _ContentList({
    required this.items,
    required this.hasMore,
    required this.isLoadingMore,
    required this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      controller: scrollController,
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      itemCount: items.length + (isLoadingMore ? 1 : 0),
      separatorBuilder: (_, __) => const Divider(
        height: 1,
        color: AppColors.border,
      ),
      itemBuilder: (context, i) {
        if (i == items.length) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: Spacing.lg),
            child: Center(
              child: SkeletonRect(height: 56, borderRadius: 8),
            ),
          );
        }
        return _ContentRow(item: items[i]);
      },
    );
  }
}

class _ContentRow extends ConsumerWidget {
  final StudioContentItem item;

  const _ContentRow({required this.item});

  void _onTap(BuildContext context) {
    HapticFeedback.lightImpact();
    if (item.status == 'draft') {
      context.push('/content/wizard');
      return;
    }
    switch (item.contentType) {
      case 'post':
        context.push('/posts/${item.id}');
      case 'itinerary':
        context.push('/itineraries/${item.id}');
      case 'event':
        context.push('/events/${item.id}');
      default:
        context.push('/posts/${item.id}');
    }
  }

  String _subtitleText() {
    final type = switch (item.contentType) {
      'post' => 'Post',
      'itinerary' => 'Itinerary',
      'event' => 'Event',
      _ => item.contentType,
    };
    final status = switch (item.status) {
      'published' => 'Published',
      'draft' => 'Draft',
      'archived' => 'Archived',
      _ => item.status,
    };
    final price = item.isFree ? 'Free' : formatPrice(item.pricePaisa);
    return '$type · $status · $price';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => _onTap(context),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: 72,
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: item.coverUrl != null
                  ? CachedNetworkImage(
                      imageUrl: item.coverUrl!,
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        width: 56,
                        height: 56,
                        color: AppColors.sunken,
                      ),
                      errorWidget: (_, __, ___) => _ThumbnailPlaceholder(
                        contentType: item.contentType,
                      ),
                    )
                  : _ThumbnailPlaceholder(contentType: item.contentType),
            ),
            const SizedBox(width: Spacing.md),

            // Title + subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    item.title,
                    style: AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _subtitleText(),
                    style: AppTypography.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: Spacing.sm),

            // Like + comment micro counts
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  PhosphorIcons.heart(PhosphorIconsStyle.regular),
                  size: 13,
                  color: AppColors.softInk,
                ),
                const SizedBox(width: 3),
                Text(
                  formatCount(item.likeCount),
                  style: AppTypography.caption,
                ),
                const SizedBox(width: Spacing.sm),
                Icon(
                  PhosphorIcons.chatCircle(PhosphorIconsStyle.regular),
                  size: 13,
                  color: AppColors.softInk,
                ),
                const SizedBox(width: 3),
                Text(
                  formatCount(item.commentCount),
                  style: AppTypography.caption,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ThumbnailPlaceholder extends StatelessWidget {
  final String contentType;

  const _ThumbnailPlaceholder({required this.contentType});

  @override
  Widget build(BuildContext context) {
    final icon = switch (contentType) {
      'post' => PhosphorIcons.newspaper(PhosphorIconsStyle.regular),
      'itinerary' => PhosphorIcons.mapTrifold(PhosphorIconsStyle.regular),
      'event' => PhosphorIcons.calendarBlank(PhosphorIconsStyle.regular),
      _ => PhosphorIcons.file(PhosphorIconsStyle.regular),
    };

    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 20, color: AppColors.softInk),
    );
  }
}

class _ContentSkeleton extends StatelessWidget {
  const _ContentSkeleton();

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        child: Column(
          children: List.generate(4, (i) {
            return Padding(
              padding: const EdgeInsets.only(bottom: Spacing.md),
              child: Row(
                children: [
                  const SkeletonRect(width: 56, height: 56, borderRadius: 8),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        FractionallySizedBox(
                          widthFactor: 0.65,
                          child: SkeletonLine(height: 14),
                        ),
                        const SizedBox(height: Spacing.sm),
                        FractionallySizedBox(
                          widthFactor: 0.45,
                          child: SkeletonLine(height: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _ContentEmpty extends StatelessWidget {
  final String filter;

  const _ContentEmpty({required this.filter});

  @override
  Widget build(BuildContext context) {
    final description = filter == 'all'
        ? 'Create your first post, itinerary, or event to get started.'
        : "You don't have any ${filter == 'draft' ? 'drafts' : filter == 'published' ? 'published content' : 'archived content'} yet.";

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.mlg,
        vertical: Spacing.xl,
      ),
      child: EmptyState(
        icon: PhosphorIcons.pencilSimpleLine(PhosphorIconsStyle.regular),
        title: 'Nothing here yet',
        description: description,
        ctaLabel: filter == 'all' ? 'Create something' : null,
        onCtaPressed: filter == 'all'
            ? () {
                HapticFeedback.lightImpact();
                context.push('/content/create');
              }
            : null,
      ),
    );
  }
}

class _ContentError extends StatelessWidget {
  final VoidCallback onRetry;

  const _ContentError({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.mlg,
        vertical: Spacing.xl,
      ),
      child: EmptyState(
        icon: PhosphorIcons.warningCircle(PhosphorIconsStyle.regular),
        title: 'Could not load content',
        description: 'Check your connection and try again.',
        ctaLabel: 'Retry',
        onCtaPressed: onRetry,
      ),
    );
  }
}

// ── Earnings Info Card ────────────────────────────────────────────────

class _EarningsInfoCard extends StatelessWidget {
  const _EarningsInfoCard();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: Container(
        padding: const EdgeInsets.all(Spacing.lg),
        decoration: BoxDecoration(
          color: AppColors.white,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.sunken,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                PhosphorIcons.wallet(PhosphorIconsStyle.regular),
                size: 20,
                color: AppColors.muted,
              ),
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Payouts ready when you need them',
                    style: AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: Spacing.xs),
                  Text(
                    'Set up bank account payouts when you start publishing paid experiences.',
                    style:
                        AppTypography.caption.copyWith(color: AppColors.muted),
                  ),
                  const SizedBox(height: Spacing.sm),
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      // No-op for M1
                    },
                    child: Text(
                      'Learn more',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.coral,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
