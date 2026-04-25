import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';

// ── Models ─────────────────────────────────────────────────────────

enum InsightsPeriod { d7, d30, d90 }

extension InsightsPeriodX on InsightsPeriod {
  String get label => switch (this) {
        InsightsPeriod.d7 => '7 days',
        InsightsPeriod.d30 => '30 days',
        InsightsPeriod.d90 => '90 days',
      };

  String get queryParam => switch (this) {
        InsightsPeriod.d7 => '7d',
        InsightsPeriod.d30 => '30d',
        InsightsPeriod.d90 => '90d',
      };
}

class InsightsDataPoint {
  final DateTime date;
  final int views;
  final int followers;
  final int bookings;

  const InsightsDataPoint({
    required this.date,
    required this.views,
    required this.followers,
    required this.bookings,
  });

  factory InsightsDataPoint.fromJson(Map<String, dynamic> json) =>
      InsightsDataPoint(
        date: DateTime.tryParse(json['date'] as String? ?? '') ??
            DateTime.now(),
        views: (json['views'] as num?)?.toInt() ?? 0,
        followers: (json['followers'] as num?)?.toInt() ?? 0,
        bookings: (json['bookings'] as num?)?.toInt() ?? 0,
      );
}

class InsightsData {
  final List<InsightsDataPoint> series;
  final int totalViews;
  final int totalFollowersGained;
  final int totalBookings;
  final double viewsDelta;   // % change vs prior period
  final double followersDelta;
  final double bookingsDelta;

  const InsightsData({
    required this.series,
    required this.totalViews,
    required this.totalFollowersGained,
    required this.totalBookings,
    required this.viewsDelta,
    required this.followersDelta,
    required this.bookingsDelta,
  });

  factory InsightsData.fromJson(Map<String, dynamic> json) {
    final seriesList =
        (json['series'] as List<dynamic>? ?? [])
            .map((e) => InsightsDataPoint.fromJson(e as Map<String, dynamic>))
            .toList();
    return InsightsData(
      series: seriesList,
      totalViews: (json['total_views'] as num?)?.toInt() ?? 0,
      totalFollowersGained:
          (json['total_followers_gained'] as num?)?.toInt() ?? 0,
      totalBookings: (json['total_bookings'] as num?)?.toInt() ?? 0,
      viewsDelta: (json['views_delta'] as num?)?.toDouble() ?? 0,
      followersDelta: (json['followers_delta'] as num?)?.toDouble() ?? 0,
      bookingsDelta: (json['bookings_delta'] as num?)?.toDouble() ?? 0,
    );
  }

  // For M1 preview — synthesise sparkline data from totals when API not available.
  factory InsightsData.placeholder(InsightsPeriod period) {
    final days = switch (period) {
      InsightsPeriod.d7 => 7,
      InsightsPeriod.d30 => 30,
      InsightsPeriod.d90 => 90,
    };
    final now = DateTime.now();
    final series = List.generate(days, (i) {
      final d = now.subtract(Duration(days: days - 1 - i));
      return InsightsDataPoint(
        date: d,
        views: 0,
        followers: 0,
        bookings: 0,
      );
    });
    return InsightsData(
      series: series,
      totalViews: 0,
      totalFollowersGained: 0,
      totalBookings: 0,
      viewsDelta: 0,
      followersDelta: 0,
      bookingsDelta: 0,
    );
  }
}

// ── Provider ───────────────────────────────────────────────────────

class InsightsState {
  final InsightsPeriod period;
  final InsightsData? data;
  final bool isLoading;
  final String? error;

  const InsightsState({
    this.period = InsightsPeriod.d30,
    this.data,
    this.isLoading = false,
    this.error,
  });

  InsightsState copyWith({
    InsightsPeriod? period,
    InsightsData? data,
    bool? isLoading,
    String? error,
  }) =>
      InsightsState(
        period: period ?? this.period,
        data: data ?? this.data,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class InsightsNotifier extends Notifier<InsightsState> {
  @override
  InsightsState build() {
    Future.microtask(() => load(InsightsPeriod.d30));
    return const InsightsState(isLoading: true);
  }

  Future<void> load(InsightsPeriod period) async {
    state = state.copyWith(period: period, isLoading: true, error: null);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/studio/insights',
        queryParameters: {'period': period.queryParam},
      );
      final data = InsightsData.fromJson(
        (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>,
      );
      state = state.copyWith(data: data, isLoading: false);
    } on DioException catch (e) {
      state = state.copyWith(
        data: InsightsData.placeholder(period),
        isLoading: false,
        error: e.response?.statusMessage ?? 'Could not load insights',
      );
    } catch (_) {
      state = state.copyWith(
        data: InsightsData.placeholder(period),
        isLoading: false,
        error: 'Could not load insights',
      );
    }
  }

  void setPeriod(InsightsPeriod period) => load(period);
}

final insightsProvider =
    NotifierProvider.autoDispose<InsightsNotifier, InsightsState>(InsightsNotifier.new);

// ── Screen ─────────────────────────────────────────────────────────

/// H3 — Studio Insights (STUD-FR-002).
/// Views / followers gained / bookings over a selectable period.
class StudioInsightsScreen extends ConsumerWidget {
  const StudioInsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(insightsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
          behavior: HitTestBehavior.opaque,
          child: const SizedBox(
            width: 44,
            height: 44,
            child: Icon(
              PhosphorIconsRegular.arrowLeft,
              size: 22,
              color: AppColors.ink,
            ),
          ),
        ),
        title: Text('Insights', style: AppTypography.h3),
        centerTitle: false,
      ),
      body: SafeArea(
        top: false,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            const SliverToBoxAdapter(child: SizedBox(height: Spacing.lg)),

            // Period selector
            SliverToBoxAdapter(
              child: _PeriodSelector(
                current: state.period,
                onSelect: (p) {
                  HapticFeedback.selectionClick();
                  ref.read(insightsProvider.notifier).setPeriod(p);
                },
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: Spacing.xl)),

            // Error banner
            if (state.error != null && state.data != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH, 0, Layout.screenPaddingH, Spacing.md,
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(Spacing.sm),
                    decoration: BoxDecoration(
                      color: AppColors.warningSurface,
                      borderRadius: BorderRadius.circular(Layout.cardRadius),
                    ),
                    child: Text(
                      'Showing cached data — ${state.error}',
                      style: AppTypography.caption
                          .copyWith(color: AppColors.warning),
                    ),
                  ),
                ),
              ),

            // Metric cards
            SliverToBoxAdapter(
              child: state.isLoading && state.data == null
                  ? const _MetricsSkeleton()
                  : _MetricsRow(data: state.data!, period: state.period),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: Spacing.xl)),

            // Sparkline charts
            if (state.isLoading && state.data == null)
              const SliverToBoxAdapter(child: _ChartsSkeleton())
            else ...[
              SliverToBoxAdapter(
                child: _SparklineCard(
                  title: 'Views',
                  icon: PhosphorIconsFill.eye,
                  iconColor: const Color(0xFF7C5CFC),
                  series: state.data!.series,
                  getValue: (p) => p.views.toDouble(),
                  total: state.data!.totalViews,
                  delta: state.data!.viewsDelta,
                  period: state.period,
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.md)),
              SliverToBoxAdapter(
                child: _SparklineCard(
                  title: 'New followers',
                  icon: PhosphorIconsFill.users,
                  iconColor: AppColors.coral,
                  series: state.data!.series,
                  getValue: (p) => p.followers.toDouble(),
                  total: state.data!.totalFollowersGained,
                  delta: state.data!.followersDelta,
                  period: state.period,
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.md)),
              SliverToBoxAdapter(
                child: _SparklineCard(
                  title: 'Bookings',
                  icon: PhosphorIconsFill.calendarCheck,
                  iconColor: const Color(0xFF0EA5E9),
                  series: state.data!.series,
                  getValue: (p) => p.bookings.toDouble(),
                  total: state.data!.totalBookings,
                  delta: state.data!.bookingsDelta,
                  period: state.period,
                ),
              ),
            ],

            const SliverToBoxAdapter(child: SizedBox(height: Spacing.xxxl)),
          ],
        ),
      ),
    );
  }
}

// ── Period selector ────────────────────────────────────────────────

class _PeriodSelector extends StatelessWidget {
  final InsightsPeriod current;
  final ValueChanged<InsightsPeriod> onSelect;

  const _PeriodSelector({
    required this.current,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Row(
          children: InsightsPeriod.values.map((p) {
            final isActive = p == current;
            return Expanded(
              child: GestureDetector(
                onTap: () => onSelect(p),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.coral : Colors.transparent,
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Text(
                    p.label,
                    textAlign: TextAlign.center,
                    style: AppTypography.caption.copyWith(
                      color: isActive ? Colors.white : AppColors.inkSoft,
                      fontWeight: isActive
                          ? FontWeight.w700
                          : FontWeight.w500,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ── Metrics summary row ────────────────────────────────────────────

class _MetricsRow extends StatelessWidget {
  final InsightsData data;
  final InsightsPeriod period;

  const _MetricsRow({required this.data, required this.period});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Row(
        children: [
          _MetricTile(
            label: 'Views',
            value: formatCount(data.totalViews),
            delta: data.viewsDelta,
          ),
          const SizedBox(width: Spacing.sm),
          _MetricTile(
            label: 'Followers',
            value: '+${formatCount(data.totalFollowersGained)}',
            delta: data.followersDelta,
          ),
          const SizedBox(width: Spacing.sm),
          _MetricTile(
            label: 'Bookings',
            value: formatCount(data.totalBookings),
            delta: data.bookingsDelta,
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  final String label;
  final String value;
  final double delta;

  const _MetricTile({
    required this.label,
    required this.value,
    required this.delta,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = delta >= 0;
    final deltaColor = isPositive ? AppColors.success : AppColors.danger;
    final deltaIcon = isPositive
        ? PhosphorIconsFill.arrowUp
        : PhosphorIconsFill.arrowDown;

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
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.fraunces(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            if (delta != 0) ...[
              const SizedBox(height: 3),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(deltaIcon, size: 10, color: deltaColor),
                  const SizedBox(width: 2),
                  Text(
                    '${delta.abs().toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: deltaColor,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Sparkline chart card ───────────────────────────────────────────

class _SparklineCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final List<InsightsDataPoint> series;
  final double Function(InsightsDataPoint) getValue;
  final int total;
  final double delta;
  final InsightsPeriod period;

  const _SparklineCard({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.series,
    required this.getValue,
    required this.total,
    required this.delta,
    required this.period,
  });

  @override
  Widget build(BuildContext context) {
    final values = series.map(getValue).toList();
    final maxVal = values.isEmpty
        ? 1.0
        : values.reduce((a, b) => a > b ? a : b);
    final safeMax = maxVal == 0 ? 1.0 : maxVal;

    final isPositive = delta >= 0;
    final deltaColor = isPositive ? AppColors.success : AppColors.danger;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Container(
        padding: const EdgeInsets.all(Layout.cardPadding),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: iconColor.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 16, color: iconColor),
                ),
                const SizedBox(width: Spacing.sm),
                Expanded(
                  child: Text(title, style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                  )),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatCount(total),
                      style: GoogleFonts.fraunces(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                    if (delta != 0)
                      Text(
                        '${isPositive ? '+' : ''}${delta.toStringAsFixed(1)}% vs prior',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: deltaColor,
                        ),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: Spacing.lg),

            // Sparkline
            SizedBox(
              height: 64,
              child: total == 0
                  ? Center(
                      child: Text(
                        'No data yet for this period',
                        style: AppTypography.caption
                            .copyWith(color: AppColors.inkFaint),
                      ),
                    )
                  : CustomPaint(
                      size: const Size(double.infinity, 64),
                      painter: _SparklinePainter(
                        values: values,
                        maxVal: safeMax,
                        color: iconColor,
                      ),
                    ),
            ),

            // X-axis labels
            const SizedBox(height: Spacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (series.isNotEmpty)
                  Text(
                    _fmtDate(series.first.date),
                    style: AppTypography.caption.copyWith(color: AppColors.inkFaint),
                  ),
                Text(
                  'Today',
                  style: AppTypography.caption.copyWith(color: AppColors.inkFaint),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _fmtDate(DateTime dt) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${dt.day} ${months[dt.month - 1]}';
  }
}

class _SparklinePainter extends CustomPainter {
  final List<double> values;
  final double maxVal;
  final Color color;

  _SparklinePainter({
    required this.values,
    required this.maxVal,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (values.length < 2) return;

    final linePaint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [color.withValues(alpha: 0.15), color.withValues(alpha: 0.0)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    final step = size.width / (values.length - 1);

    Offset point(int i) {
      final x = i * step;
      final y = size.height - (values[i] / maxVal) * size.height;
      return Offset(x, y.clamp(2.0, size.height - 2.0));
    }

    final linePath = Path();
    final fillPath = Path();

    linePath.moveTo(point(0).dx, point(0).dy);
    fillPath.moveTo(point(0).dx, size.height);
    fillPath.lineTo(point(0).dx, point(0).dy);

    for (int i = 1; i < values.length; i++) {
      final prev = point(i - 1);
      final curr = point(i);
      final cpx = (prev.dx + curr.dx) / 2;
      linePath.cubicTo(cpx, prev.dy, cpx, curr.dy, curr.dx, curr.dy);
      fillPath.cubicTo(cpx, prev.dy, cpx, curr.dy, curr.dx, curr.dy);
    }

    fillPath.lineTo(point(values.length - 1).dx, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(linePath, linePaint);

    // Dot at last point
    canvas.drawCircle(
      point(values.length - 1),
      3.5,
      Paint()..color = color,
    );
  }

  @override
  bool shouldRepaint(_SparklinePainter old) =>
      old.values != values || old.maxVal != maxVal;
}

// ── Skeletons ──────────────────────────────────────────────────────

class _MetricsSkeleton extends StatelessWidget {
  const _MetricsSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
        child: Row(
          children: [
            Expanded(child: SkeletonRect(height: 72, borderRadius: 12)),
            SizedBox(width: Spacing.sm),
            Expanded(child: SkeletonRect(height: 72, borderRadius: 12)),
            SizedBox(width: Spacing.sm),
            Expanded(child: SkeletonRect(height: 72, borderRadius: 12)),
          ],
        ),
      ),
    );
  }
}

class _ChartsSkeleton extends StatelessWidget {
  const _ChartsSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
        child: Column(
          children: [
            SkeletonRect(height: 140, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.md),
            SkeletonRect(height: 140, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.md),
            SkeletonRect(height: 140, borderRadius: Layout.cardRadius),
          ],
        ),
      ),
    );
  }
}
