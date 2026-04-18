import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../providers/booking_provider.dart';

/// Detailed view of a single booking.
///
/// Route: /bookings/:id
class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;

  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingProvider(bookingId));

    return SafeArea(
      child: Scaffold(
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
          title: Text('Booking Details', style: typ.AppTypography.h3),
          centerTitle: false,
        ),
        body: bookingAsync.when(
          loading: () => const _LoadingSkeleton(),
          error: (error, _) => _ErrorView(
            message: error.toString(),
            onRetry: () => ref.invalidate(bookingProvider(bookingId)),
          ),
          data: (booking) => _BookingDetailContent(booking: booking),
        ),
      ),
    );
  }
}

// ── Booking Detail Content ────────────────────────────────────────

class _BookingDetailContent extends StatelessWidget {
  final BookingDetails booking;

  const _BookingDetailContent({required this.booking});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.xl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status section
          _SectionCard(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Booking Status', style: typ.AppTypography.h4),
                  ),
                  _StatusBadge(status: booking.status),
                ],
              ),
              const SizedBox(height: Spacing.md),
              _InfoRow(
                label: 'Booking ID',
                value: '#${booking.id.substring(0, 8).toUpperCase()}',
              ),
              const SizedBox(height: Spacing.sm),
              _InfoRow(
                label: 'Created',
                value: _formatDate(booking.createdAt),
              ),
            ],
          ),
          const SizedBox(height: Spacing.lg),

          // Price breakdown section
          Text('Price Breakdown', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.md),
          _SectionCard(
            children: [
              _PriceLine(
                label: 'Base Price',
                amount: formatPrice(booking.basePricePaisa),
              ),
              const SizedBox(height: Spacing.sm),
              _PriceLine(
                label: 'Platform Fee (17%)',
                amount: formatPrice(booking.platformFeePaisa),
              ),
              const SizedBox(height: Spacing.sm),
              _PriceLine(
                label: 'GST (18% on fee)',
                amount: formatPrice(booking.gstPaisa),
              ),
              if (booking.tdsPaisa > 0) ...[
                const SizedBox(height: Spacing.sm),
                _PriceLine(
                  label: 'TDS (1%)',
                  amount: formatPrice(booking.tdsPaisa),
                ),
              ],
              const SizedBox(height: Spacing.md),
              const Divider(color: AppColors.hairline, height: 1),
              const SizedBox(height: Spacing.md),
              _PriceLine(
                label: 'Total Paid',
                amount: formatPrice(booking.totalPaisa),
                isTotal: true,
              ),
            ],
          ),
          const SizedBox(height: Spacing.lg),

          // Meeting point note
          if (booking.status == 'confirmed' || booking.status == 'in_progress')
            _MeetingPointNote(),

          const SizedBox(height: Spacing.xxxl),

          // Back to my bookings
          AppButton(
            label: 'All Bookings',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/bookings');
            },
            variant: AppButtonVariant.secondary,
            fullWidth: true,
          ),
        ],
      ),
    );
  }

  String _formatDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      return formatDate(dt);
    } catch (_) {
      return '';
    }
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final List<Widget> children;

  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
        ),
        const Spacer(),
        Text(
          value,
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _PriceLine extends StatelessWidget {
  final String label;
  final String amount;
  final bool isTotal;

  const _PriceLine({
    required this.label,
    required this.amount,
    this.isTotal = false,
  });

  @override
  Widget build(BuildContext context) {
    final labelStyle = isTotal
        ? typ.AppTypography.h4
        : typ.AppTypography.body.copyWith(color: AppColors.inkSoft);
    final amountStyle = isTotal
        ? typ.AppTypography.h4
        : typ.AppTypography.body.copyWith(color: AppColors.ink);

    return Row(
      children: [
        Expanded(child: Text(label, style: labelStyle)),
        Text(amount, style: amountStyle),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color, bgColor) = switch (status) {
      'pending_payment' => (
          'Pending Payment',
          AppColors.warning,
          AppColors.warningSurface,
        ),
      'confirmed' => (
          'Confirmed',
          AppColors.info,
          AppColors.infoSurface,
        ),
      // Coral DD-013 context #8: "In Progress" booking status
      'in_progress' => (
          'In Progress',
          AppColors.coral,
          AppColors.coralSurface,
        ),
      'completed' => (
          'Completed',
          AppColors.success,
          AppColors.successSurface,
        ),
      'cancelled' => (
          'Cancelled',
          AppColors.inkSoft,
          AppColors.surfaceAlt,
        ),
      'refunded' => (
          'Refunded',
          AppColors.inkSoft,
          AppColors.surfaceAlt,
        ),
      _ => (
          'Unknown',
          AppColors.inkSoft,
          AppColors.surfaceAlt,
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.xs,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
      ),
      child: Text(
        label,
        style: typ.AppTypography.label.copyWith(color: color),
      ),
    );
  }
}

class _MeetingPointNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.lg),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(Layout.cardPadding),
        decoration: BoxDecoration(
          color: AppColors.infoSurface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.info.withValues(alpha: 0.2)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('📍', style: TextStyle(fontSize: 18)),
            const SizedBox(width: Spacing.sm),
            Expanded(
              child: Text(
                'Meeting point will be shared 24h before the experience',
                style: typ.AppTypography.bodySmall.copyWith(
                  color: AppColors.info,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Loading Skeleton ──────────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: Layout.screenPaddingH,
          vertical: Spacing.xl,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SkeletonRect(height: 100, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.lg),
            SkeletonLine(width: 140, height: 16),
            SizedBox(height: Spacing.md),
            SkeletonRect(height: 160, borderRadius: Layout.cardRadius),
          ],
        ),
      ),
    );
  }
}

// ── Error View ────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Layout.screenPaddingH),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              PhosphorIconsFill.warningCircle,
              size: 48,
              color: AppColors.danger,
            ),
            const SizedBox(height: Spacing.lg),
            Text('Failed to load booking', style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              message,
              style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.xl),
            AppButton(
              label: 'Retry',
              onPressed: onRetry,
              variant: AppButtonVariant.primary,
            ),
          ],
        ),
      ),
    );
  }
}
