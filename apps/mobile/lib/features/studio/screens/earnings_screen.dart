import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/app_header.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../providers/earnings_provider.dart';
import '../providers/linked_account_provider.dart';
import '../widgets/linked_account_banner.dart';
import '../widgets/payout_row.dart';
import '../widgets/payout_summary_card.dart';

class EarningsScreen extends ConsumerStatefulWidget {
  const EarningsScreen({super.key});

  @override
  ConsumerState<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends ConsumerState<EarningsScreen> {
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
      ref.read(earningsProvider.notifier).loadMore();
    }
  }

  Future<void> _onRefresh() async {
    await Future.wait([
      ref.read(earningsProvider.notifier).refresh(),
      ref.read(linkedAccountProvider.notifier).refresh(),
    ]);
  }

  void _openKyc() {
    HapticFeedback.lightImpact();
    context.push('/kyc');
  }

  @override
  Widget build(BuildContext context) {
    final earnings = ref.watch(earningsProvider);
    final linkedAccount = ref.watch(linkedAccountProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          AppHeader(
            title: 'Earnings',
            showBack: true,
            onBack: () => context.pop(),
          ),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.coral,
              onRefresh: _onRefresh,
              child: CustomScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  const SliverToBoxAdapter(child: SizedBox(height: Spacing.md)),
                  SliverToBoxAdapter(
                    child: _LinkedAccountSection(
                      state: linkedAccount,
                      onAction: _openKyc,
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: Spacing.lg)),
                  SliverToBoxAdapter(
                    child: _SummarySection(state: earnings),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: Spacing.xl)),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.mlg,
                      ),
                      child: Text(
                        'Recent payouts',
                        style: AppTypography.h4,
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: Spacing.sm)),
                  _PayoutListSliver(state: earnings),
                  const SliverToBoxAdapter(
                    child: SizedBox(height: Spacing.xxxl),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Linked account section ──────────────────────────────────────────

class _LinkedAccountSection extends StatelessWidget {
  final LinkedAccountState state;
  final VoidCallback onAction;

  const _LinkedAccountSection({required this.state, required this.onAction});

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && state.account == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: Spacing.mlg),
        child: SkeletonRect(height: 72, borderRadius: 12),
      );
    }
    final account = state.account;
    if (account == null) {
      return const SizedBox.shrink();
    }
    return LinkedAccountBanner(
      account: account,
      onTapLearnMore: onAction,
    );
  }
}

// ── Summary section ─────────────────────────────────────────────────

class _SummarySection extends StatelessWidget {
  final EarningsState state;

  const _SummarySection({required this.state});

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && state.items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: Spacing.mlg),
        child: SkeletonRect(height: 96, borderRadius: 14),
      );
    }
    return PayoutSummaryCard(totals: state.totals);
  }
}

// ── Payout list sliver ──────────────────────────────────────────────

class _PayoutListSliver extends ConsumerWidget {
  final EarningsState state;

  const _PayoutListSliver({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (state.isLoading && state.items.isEmpty) {
      return const SliverToBoxAdapter(child: _PayoutListSkeleton());
    }
    if (state.error != null && state.items.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Spacing.xl),
          child: EmptyState(
            icon: PhosphorIcons.warningCircle(PhosphorIconsStyle.regular),
            title: 'Could not load earnings',
            description: 'Check your connection and try again.',
            ctaLabel: 'Retry',
            onCtaPressed: () => ref.read(earningsProvider.notifier).refresh(),
          ),
        ),
      );
    }
    if (state.items.isEmpty) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: Spacing.xxl),
          child: _EmptyPayouts(),
        ),
      );
    }

    final itemCount = state.items.length + (state.isLoadingMore ? 1 : 0);
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index == state.items.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: Spacing.lg),
              child: Center(
                child: SkeletonRect(height: 48, borderRadius: 8),
              ),
            );
          }
          return Column(
            children: [
              PayoutRow(payout: state.items[index]),
              if (index < state.items.length - 1)
                const Divider(height: 1, color: AppColors.hairline),
            ],
          );
        },
        childCount: itemCount,
      ),
    );
  }
}

class _PayoutListSkeleton extends StatelessWidget {
  const _PayoutListSkeleton();

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        child: Column(
          children: List.generate(4, (_) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: Spacing.md),
              child: Row(
                children: [
                  SkeletonRect(width: 36, height: 36, borderRadius: 10),
                  SizedBox(width: Spacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        FractionallySizedBox(
                          widthFactor: 0.5,
                          child: SkeletonLine(height: 12),
                        ),
                        SizedBox(height: 6),
                        FractionallySizedBox(
                          widthFactor: 0.3,
                          child: SkeletonLine(height: 10),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: Spacing.sm),
                  SkeletonRect(width: 64, height: 14, borderRadius: 4),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _EmptyPayouts extends StatelessWidget {
  const _EmptyPayouts();

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: PhosphorIcons.wallet(PhosphorIconsStyle.regular),
      title: 'No payouts yet',
      description:
          'Payouts appear here after a booking completes. They settle 48 hours after the experience ends.',
    );
  }
}
