import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/app_header.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../auth/providers/auth_provider.dart';
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
                  const SliverToBoxAdapter(child: SizedBox(height: Spacing.xl)),

                  // TAX-FR-005: Tax documents section
                  const SliverToBoxAdapter(child: _TaxDocumentsSection()),
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

// ── TAX-FR-005: Tax documents section ──────────────────────────────

class _TaxDocumentsSection extends ConsumerStatefulWidget {
  const _TaxDocumentsSection();

  @override
  ConsumerState<_TaxDocumentsSection> createState() =>
      _TaxDocumentsSectionState();
}

class _TaxDocumentsSectionState extends ConsumerState<_TaxDocumentsSection> {
  int? _selectedYear;
  bool _isDownloading = false;

  int get _currentFY {
    final now = DateTime.now();
    // FY starts April 1; if before April, current FY started last year
    return now.month >= 4 ? now.year : now.year - 1;
  }

  List<int> get _availableYears {
    final fy = _currentFY;
    return [fy, fy - 1, fy - 2];
  }

  String _fyLabel(int startYear) => 'FY ${startYear}–${(startYear + 1).toString().substring(2)}';

  Future<void> _download(String docType) async {
    if (_selectedYear == null) return;
    setState(() => _isDownloading = true);
    HapticFeedback.lightImpact();

    try {
      final dio = ref.read(authServiceProvider).dio;
      // TAX-FR-005: GET /api/v1/studio/tax-documents?type=form16a&fy=2024
      await dio.get(
        '/api/v1/studio/tax-documents',
        queryParameters: {'type': docType, 'fy': _selectedYear},
        options: Options(responseType: ResponseType.bytes),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$docType download started'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.statusCode == 404
            ? 'No ${docType} available for ${_fyLabel(_selectedYear!)}'
            : 'Download failed. Try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: AppColors.danger,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                PhosphorIcons.filePdf(PhosphorIconsStyle.regular),
                size: 18,
                color: AppColors.ink,
              ),
              const SizedBox(width: Spacing.xs),
              Text('Tax documents', style: AppTypography.h4),
            ],
          ),
          const SizedBox(height: Spacing.xs),
          Text(
            'Download Form 16A (TDS certificate) and GST summary for your tax filing.',
            style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.md),

          // Financial year selector
          Text(
            'Financial year',
            style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xs),
          Row(
            children: _availableYears.map((y) {
              final isSelected = y == _selectedYear;
              return Padding(
                padding: const EdgeInsets.only(right: Spacing.sm),
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _selectedYear = y);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.md,
                      vertical: Spacing.xs + 2,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.primaryTint
                          : AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color:
                            isSelected ? AppColors.coral : AppColors.hairline,
                        width: isSelected ? 1.5 : 1.0,
                      ),
                    ),
                    child: Text(
                      _fyLabel(y),
                      style: AppTypography.caption.copyWith(
                        color: isSelected ? AppColors.coral : AppColors.ink,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: Spacing.lg),

          // Document buttons
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Column(
              children: [
                _TaxDocTile(
                  icon: PhosphorIconsRegular.filePdf,
                  title: 'Form 16A',
                  subtitle: 'TDS certificate (Sec 194-O) issued by the platform',
                  enabled: _selectedYear != null && !_isDownloading,
                  onTap: () => _download('form16a'),
                ),
                const Divider(height: 1, color: AppColors.hairline),
                _TaxDocTile(
                  icon: PhosphorIconsRegular.fileText,
                  title: 'GSTR-1 / 3B Summary',
                  subtitle:
                      'GST collected summary for returns filing (if GST registered)',
                  enabled: _selectedYear != null && !_isDownloading,
                  onTap: () => _download('gstr'),
                ),
              ],
            ),
          ),

          if (_selectedYear == null)
            Padding(
              padding: const EdgeInsets.only(top: Spacing.sm),
              child: Text(
                'Select a financial year to enable downloads.',
                style:
                    AppTypography.caption.copyWith(color: AppColors.inkFaint),
              ),
            ),
        ],
      ),
    );
  }
}

class _TaxDocTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool enabled;
  final VoidCallback onTap;

  const _TaxDocTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Layout.cardPadding,
          vertical: Spacing.md,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: enabled ? AppColors.ink : AppColors.inkFaint,
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.body.copyWith(
                      fontWeight: FontWeight.w500,
                      color: enabled ? AppColors.ink : AppColors.inkFaint,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.caption.copyWith(
                        color: AppColors.inkSoft),
                  ),
                ],
              ),
            ),
            const SizedBox(width: Spacing.sm),
            Icon(
              PhosphorIcons.downloadSimple(PhosphorIconsStyle.regular),
              size: 18,
              color: enabled ? AppColors.coral : AppColors.inkFaint,
            ),
          ],
        ),
      ),
    );
  }
}
