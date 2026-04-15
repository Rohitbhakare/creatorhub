import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../providers/booking_provider.dart';

/// List of the current user's bookings.
///
/// Route: /bookings
class MyBookingsScreen extends ConsumerWidget {
  const MyBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(userBookingsProvider);

    return SafeArea(
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation: 0,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.transparent,
          leading: GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              Navigator.of(context).pop();
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
          title: Text('My Bookings', style: typ.AppTypography.h3),
          centerTitle: false,
        ),
        body: bookingsAsync.when(
          loading: () => const _LoadingSkeleton(),
          error: (error, _) => _ErrorView(
            message: error.toString(),
            onRetry: () => ref.invalidate(userBookingsProvider),
          ),
          data: (bookings) {
            if (bookings.isEmpty) {
              return EmptyState(
                icon: PhosphorIconsFill.calendarBlank,
                title: 'No bookings yet',
                description:
                    'Explore experiences and book your next adventure.',
                ctaLabel: 'Explore experiences',
                onCtaPressed: () {
                  HapticFeedback.lightImpact();
                  context.go('/home');
                },
              );
            }
            return RefreshIndicator(
              color: AppColors.coral,
              onRefresh: () async {
                ref.invalidate(userBookingsProvider);
              },
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                  vertical: Spacing.lg,
                ),
                itemCount: bookings.length,
                separatorBuilder: (context, index) => const SizedBox(height: Spacing.md),
                itemBuilder: (context, index) {
                  return _BookingCard(
                    booking: bookings[index],
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.push('/bookings/${bookings[index].id}');
                    },
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

// ── Booking Card ──────────────────────────────────────────────────

class _BookingCard extends StatelessWidget {
  final BookingDetails booking;
  final VoidCallback onTap;

  const _BookingCard({required this.booking, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A2C2823),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Cover image placeholder (real data would need content lookup)
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(Layout.cardRadius),
                bottomLeft: Radius.circular(Layout.cardRadius),
              ),
              child: SizedBox(
                width: 80,
                height: 88,
                child: Container(
                  color: AppColors.sunken,
                  child: const Center(
                    child: Icon(
                      PhosphorIconsFill.mountains,
                      size: 28,
                      color: AppColors.softInk,
                    ),
                  ),
                ),
              ),
            ),

            // Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(Layout.cardPaddingCompact),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Booking short ID
                    Text(
                      'Booking #${booking.id.substring(0, 8).toUpperCase()}',
                      style: typ.AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: Spacing.xs),

                    // Date (from createdAt)
                    Text(
                      _formatBookingDate(booking.createdAt),
                      style: typ.AppTypography.caption,
                    ),
                    const SizedBox(height: Spacing.sm),

                    // Status badge + price
                    Row(
                      children: [
                        _StatusBadge(status: booking.status),
                        const Spacer(),
                        Text(
                          formatPrice(booking.totalPaisa),
                          style: typ.AppTypography.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Chevron
            const Padding(
              padding: EdgeInsets.only(right: Spacing.md),
              child: Icon(
                PhosphorIconsRegular.caretRight,
                size: 18,
                color: AppColors.softInk,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatBookingDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      return formatDate(dt);
    } catch (_) {
      return '';
    }
  }
}

// ── Status Badge ──────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color, bgColor) = _resolve(status);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.sm,
        vertical: 2,
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

  (String, Color, Color) _resolve(String status) {
    return switch (status) {
      'pending_payment' => (
          'Pending',
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
      'cancelled' || 'refunded' => (
          status == 'refunded' ? 'Refunded' : 'Cancelled',
          AppColors.muted,
          AppColors.sunken,
        ),
      _ => (
          'Unknown',
          AppColors.muted,
          AppColors.sunken,
        ),
    };
  }
}

// ── Loading Skeleton ──────────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Layout.screenPaddingH,
          vertical: Spacing.lg,
        ),
        child: Column(
          children: List.generate(4, (i) {
            return Padding(
              padding: EdgeInsets.only(bottom: i < 3 ? Spacing.md : 0),
              child: Container(
                height: 88,
                decoration: BoxDecoration(
                  color: AppColors.shimmerBase,
                  borderRadius: BorderRadius.circular(Layout.cardRadius),
                ),
              ),
            );
          }),
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
            Text('Failed to load bookings', style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              message,
              style: typ.AppTypography.body.copyWith(color: AppColors.muted),
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
