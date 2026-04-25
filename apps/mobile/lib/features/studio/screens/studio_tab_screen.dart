import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/guest_tab_placeholder.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/widgets/soft_auth_sheet.dart';
import '../../kyc/providers/kyc_provider.dart';
import '../providers/earnings_provider.dart';
import '../providers/studio_provider.dart';
import '../widgets/studio_content_widgets.dart';

class StudioTabScreen extends ConsumerWidget {
  const StudioTabScreen({super.key});

  Future<void> _onRefresh(WidgetRef ref) async {
    ref.invalidate(studioAlertProvider);
    ref.invalidate(studioStatsProvider);
    ref.read(studioContentProvider.notifier).retry();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isGuest = ref.watch(authProvider.select((s) => s.isGuest));
    if (isGuest) {
      return const GuestTabPlaceholder(
        icon: PhosphorIconsFill.uploadSimple,
        title: 'Start creating with CreatorHub',
        description:
            'Sign in to publish posts, itineraries, experiences, and events.',
        ctaLabel: 'Sign in to publish',
        trigger: SoftAuthTrigger.publish,
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
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

  void _showExamplesSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _ExamplesSheet(),
    );
  }

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
              style: AppTypography.body.copyWith(color: AppColors.inkSoft),
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
                      _showExamplesSheet(context);
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

  void _onCardTap(BuildContext context) {
    final target = alert.ctaTarget;
    if (target == null || target.isEmpty) return;
    HapticFeedback.lightImpact();
    context.push(target);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: GestureDetector(
        onTap: () => _onCardTap(context),
        behavior: HitTestBehavior.opaque,
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
                  style: AppTypography.body.copyWith(color: AppColors.inkSoft),
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
                    color: AppColors.inkSoft,
                  ),
                ),
              ),
            ),
          ],
        ),
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
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.hairline),
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

const _kPreviewLimit = 5;

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
    final hasMore =
        contentState.hasMore || contentState.items.length > _kPreviewLimit;
    final preview = contentState.items.take(_kPreviewLimit).toList();

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
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (hasMore && !contentState.isLoading)
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        context.push('/studio/content-list');
                      },
                      child: SizedBox(
                        height: Layout.minTapTarget,
                        child: Center(
                          child: Text(
                            'See all',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.inkSoft,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ),
                  if (hasMore && !contentState.isLoading)
                    const SizedBox(width: Spacing.sm),
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
            ],
          ),
        ),
        const SizedBox(height: Spacing.md),

        // Filter chips with counts
        StudioFilterChips(
          currentFilter: contentState.statusFilter,
          onChanged: (filter) {
            HapticFeedback.lightImpact();
            ref.read(studioContentProvider.notifier).setStatusFilter(filter);
          },
        ),
        const SizedBox(height: Spacing.lg),

        // Content list / loading / empty / error
        if (contentState.isLoading)
          const StudioContentSkeleton()
        else if (contentState.error != null && contentState.items.isEmpty)
          StudioContentError(
            onRetry: () =>
                ref.read(studioContentProvider.notifier).retry(),
          )
        else if (contentState.items.isEmpty)
          StudioContentEmpty(filter: contentState.statusFilter)
        else
          _ContentCardList(
            items: preview,
            scrollController: _scrollController,
          ),

        // "See all" footer link
        if (hasMore && !contentState.isLoading && contentState.items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(
                Spacing.mlg, Spacing.sm, Spacing.mlg, 0),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                context.push('/studio/content-list');
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Text(
                  'See all content →',
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.inkSoft,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// _FilterChips, _ContentCard, _EngageStat, _ThumbnailPlaceholder,
// _ContentSkeleton, _ContentEmpty, _ContentError are extracted to
// studio_content_widgets.dart as public classes (StudioFilterChips, etc.)

class _ContentCardList extends StatelessWidget {
  final List<StudioContentItem> items;
  final ScrollController? scrollController;

  const _ContentCardList({
    required this.items,
    this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      controller: scrollController,
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: Spacing.sm),
      itemBuilder: (context, i) => StudioContentCard(item: items[i]),
    );
  }
}


// ── Earnings Entry Card ──────────────────────────────────────────────

// ── STUD-FR-004: Earnings Card ────────────────────────────────────────

class _EarningsInfoCard extends ConsumerWidget {
  const _EarningsInfoCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final earnings = ref.watch(earningsProvider);
    final kycAsync = ref.watch(kycStatusProvider);

    final totals = earnings.totals;
    final pendingPaisa = totals.pendingPaisa + totals.processingPaisa;
    final hasPending = pendingPaisa > 0;

    // Next payout: earliest scheduledAt among pending/scheduled items
    final nextPayoutItem = earnings.items
        .where((i) =>
            i.status == PayoutStatus.pending ||
            i.status == PayoutStatus.scheduled)
        .fold<PayoutSummary?>(
          null,
          (acc, i) => acc == null || i.scheduledAt.isBefore(acc.scheduledAt)
              ? i
              : acc,
        );

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.push('/studio/earnings');
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        child: Container(
          padding: const EdgeInsets.all(Spacing.lg),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.hairline),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // KYC badge (STUD-FR-004)
              kycAsync.when(
                loading: () => const SkeletonRect(height: 28, width: 130),
                error: (_, __) => const SizedBox.shrink(),
                data: (kyc) => _KycBadge(status: kyc.status),
              ),
              const SizedBox(height: Spacing.md),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Pending Payout',
                          style: AppTypography.caption
                              .copyWith(color: AppColors.inkSoft),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          hasPending ? formatPrice(pendingPaisa) : '—',
                          style: AppTypography.h4,
                        ),
                        if (nextPayoutItem != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Transfer · ${_fmtDate(nextPayoutItem.scheduledAt)}',
                            style: AppTypography.caption
                                .copyWith(color: AppColors.inkSoft),
                          ),
                        ] else if (!hasPending) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Appears after your first booking completes',
                            style: AppTypography.caption
                                .copyWith(color: AppColors.inkFaint),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Icon(
                    PhosphorIcons.caretRight(),
                    size: 16,
                    color: AppColors.inkSoft,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _fmtDate(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${dt.day} ${months[dt.month - 1]}';
  }
}

class _KycBadge extends StatelessWidget {
  const _KycBadge({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final isVerified = status == 'verified';
    final isPending = status == 'pending';

    final bgColor = isVerified
        ? const Color(0xFFECFDF5)
        : isPending
            ? const Color(0xFFFFF8ED)
            : AppColors.coral.withValues(alpha: 0.08);
    final fgColor = isVerified
        ? const Color(0xFF16A34A)
        : isPending
            ? const Color(0xFFD97706)
            : AppColors.coral;
    final icon = isVerified
        ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill)
        : PhosphorIcons.warning(PhosphorIconsStyle.fill);
    final label = isVerified
        ? 'KYC Verified'
        : isPending
            ? 'KYC Under Review'
            : 'KYC Required';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fgColor),
          const SizedBox(width: 5),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w600,
              color: fgColor,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Examples Sheet ─────────────────────────────────────────────────────────

class _ExampleItem {
  final String type;
  final String title;
  final String excerpt;
  final int likes;
  final int views;
  final String emoji;

  const _ExampleItem({
    required this.type,
    required this.title,
    required this.excerpt,
    required this.likes,
    required this.views,
    required this.emoji,
  });
}

const _kExamples = [
  _ExampleItem(
    type: 'post',
    title: '3 days in Coorg: what nobody tells you',
    excerpt:
        "Skip the resorts. Here's the hidden waterfall trail most tourists never find, plus a family-run homestay that'll change how you see travel.",
    likes: 412,
    views: 3200,
    emoji: '☕',
  ),
  _ExampleItem(
    type: 'itinerary',
    title: 'Spiti Valley in 10 days — complete budget guide',
    excerpt:
        'Day-by-day plan covering Kaza, Kibber, Langza & Key monastery. Includes bus schedules, permit info, and off-the-beaten-path campsites.',
    likes: 1840,
    views: 22000,
    emoji: '🏔️',
  ),
  _ExampleItem(
    type: 'post',
    title: 'Why I quit my job to walk the Camino de Santiago',
    excerpt:
        '800 km. 35 days. One pair of broken boots. This is the story of how a month of walking became the best decision of my life.',
    likes: 2100,
    views: 18500,
    emoji: '🚶',
  ),
  _ExampleItem(
    type: 'event',
    title: 'Monsoon trek to Naneghat — small group, big views',
    excerpt:
        'Join 8 fellow travelers for a guided morning trek. Breakfast at the top, photography walk on the descent. All skill levels welcome.',
    likes: 290,
    views: 5100,
    emoji: '🌿',
  ),
];

class _ExamplesSheet extends StatelessWidget {
  const _ExamplesSheet();

  String _typeLabel(String type) => switch (type) {
        'itinerary' => 'Itinerary',
        'event' => 'Event',
        _ => 'Post',
      };

  Color _typeColor(String type) => switch (type) {
        'itinerary' => const Color(0xFF7C5CFC),
        'event' => const Color(0xFF0EA5E9),
        _ => AppColors.coral,
      };

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (_, scrollController) => Container(
        decoration: const BoxDecoration(
          color: AppColors.bg,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.hairline,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'INSPIRATION',
                    style: AppTypography.label.copyWith(
                      color: AppColors.coral,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'What great content looks like.',
                    style: GoogleFonts.fraunces(
                      fontSize: 22,
                      fontWeight: FontWeight.w500,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Your first piece could be just as good.',
                    style: AppTypography.bodySmall
                        .copyWith(color: AppColors.inkSoft),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Spacing.lg),
            Expanded(
              child: ListView.separated(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(
                    Spacing.mlg, 0, Spacing.mlg, Spacing.xxxl),
                itemCount: _kExamples.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: Spacing.md),
                itemBuilder: (_, i) => _ExampleCard(
                  item: _kExamples[i],
                  typeLabel: _typeLabel(_kExamples[i].type),
                  typeColor: _typeColor(_kExamples[i].type),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExampleCard extends StatelessWidget {
  final _ExampleItem item;
  final String typeLabel;
  final Color typeColor;

  const _ExampleCard({
    required this.item,
    required this.typeLabel,
    required this.typeColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: typeColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  typeLabel.toUpperCase(),
                  style: AppTypography.caption.copyWith(
                    color: typeColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 10,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
              const Spacer(),
              Text(item.emoji, style: const TextStyle(fontSize: 20)),
            ],
          ),
          const SizedBox(height: Spacing.sm),
          Text(
            item.title,
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: Spacing.xs),
          Text(
            item.excerpt,
            style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: Spacing.md),
          Row(
            children: [
              Icon(
                PhosphorIcons.heart(PhosphorIconsStyle.fill),
                size: 13,
                color: AppColors.coral,
              ),
              const SizedBox(width: 4),
              Text(
                formatCount(item.likes),
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.inkSoft,
                ),
              ),
              const SizedBox(width: Spacing.md),
              Icon(
                PhosphorIcons.eye(PhosphorIconsStyle.regular),
                size: 13,
                color: AppColors.inkMuted,
              ),
              const SizedBox(width: 4),
              Text(
                formatCount(item.views),
                style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
