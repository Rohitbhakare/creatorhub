import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/booking_provider.dart';

/// Success screen shown after a booking is confirmed and payment verified.
///
/// Route: /bookings/:id/confirmed
class BookingConfirmationScreen extends ConsumerWidget {
  final String bookingId;

  const BookingConfirmationScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingProvider(bookingId));

    return SafeArea(
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: bookingAsync.when(
          loading: () => const _LoadingSkeleton(),
          error: (error, _) => _ErrorView(
            message: error.toString(),
            onRetry: () => ref.invalidate(bookingProvider(bookingId)),
          ),
          data: (booking) => _ConfirmationContent(booking: booking),
        ),
      ),
    );
  }
}

// ── Confirmation Content ──────────────────────────────────────────

class _ConfirmationContent extends StatelessWidget {
  final BookingDetails booking;

  const _ConfirmationContent({required this.booking});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.xl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: Spacing.xxl),

          // Green checkmark animation
          _AnimatedCheckmark()
              .animate()
              .scale(
                begin: const Offset(0.5, 0.5),
                end: const Offset(1.0, 1.0),
                duration: 350.ms,
                curve: Curves.elasticOut,
              )
              .fadeIn(duration: 200.ms),

          const SizedBox(height: Spacing.xl),

          // Headline
          Text(
            'Booking Confirmed!',
            style: typ.AppTypography.h2,
            textAlign: TextAlign.center,
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: 200.ms)
              .slideY(begin: 0.1, end: 0, delay: 200.ms, duration: 200.ms),

          const SizedBox(height: Spacing.xl),

          // Details card
          _DetailsCard(booking: booking)
              .animate()
              .fadeIn(delay: 350.ms, duration: 200.ms)
              .slideY(begin: 0.05, end: 0, delay: 350.ms, duration: 200.ms),

          const SizedBox(height: Spacing.lg),

          // Meeting point note
          _MeetingPointNote()
              .animate()
              .fadeIn(delay: 450.ms, duration: 200.ms),

          const SizedBox(height: Spacing.xxxl),

          // "View Booking" button
          AppButton(
            label: 'View Booking',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/bookings/${booking.id}');
            },
            variant: AppButtonVariant.primary,
            fullWidth: true,
            size: AppButtonSize.large,
          )
              .animate()
              .fadeIn(delay: 550.ms, duration: 200.ms),

          const SizedBox(height: Spacing.md),

          // "Explore More" ghost button
          AppButton(
            label: 'Explore More',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/home');
            },
            variant: AppButtonVariant.ghost,
            fullWidth: true,
            size: AppButtonSize.medium,
          )
              .animate()
              .fadeIn(delay: 620.ms, duration: 200.ms),
        ],
      ),
    );
  }
}

// ── Animated Checkmark ────────────────────────────────────────────

class _AnimatedCheckmark extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        color: AppColors.successSurface,
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.success.withValues(alpha: 0.3),
          width: 2,
        ),
      ),
      child: const Icon(
        PhosphorIconsFill.checkCircle,
        size: 52,
        color: AppColors.success,
      ),
    );
  }
}

// ── Details Card ──────────────────────────────────────────────────

class _DetailsCard extends StatelessWidget {
  final BookingDetails booking;

  const _DetailsCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2C2823),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Booking status badge
          _StatusBadge(status: booking.status),
          const SizedBox(height: Spacing.md),

          // Booking ID
          _DetailRow(
            icon: PhosphorIconsFill.hash,
            label: 'Booking ID',
            value: '#${booking.id.substring(0, 8).toUpperCase()}',
          ),
          const SizedBox(height: Spacing.sm),

          // Amount paid
          _DetailRow(
            icon: PhosphorIconsFill.currencyInr,
            label: 'Amount Paid',
            value: _formatPrice(booking.totalPaisa),
          ),
        ],
      ),
    );
  }

  String _formatPrice(int paisa) {
    if (paisa <= 0) return 'FREE';
    final rupees = paisa / 100;
    final formatted = rupees.toStringAsFixed(0);
    // Simple comma formatting
    return '₹$formatted';
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color, bgColor) = switch (status) {
      'confirmed' => ('Confirmed', AppColors.success, AppColors.successSurface),
      'pending_payment' => (
          'Pending Payment',
          AppColors.warning,
          AppColors.warningSurface
        ),
      'completed' => ('Completed', AppColors.success, AppColors.successSurface),
      'cancelled' => ('Cancelled', AppColors.danger, AppColors.dangerSurface),
      _ => ('Processing', AppColors.info, AppColors.infoSurface),
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

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.softInk),
        const SizedBox(width: Spacing.sm),
        Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(color: AppColors.muted),
        ),
        const Spacer(),
        Text(
          value,
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.ink,
          ),
        ),
      ],
    );
  }
}

// ── Meeting Point Note ────────────────────────────────────────────

class _MeetingPointNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
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
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(height: Spacing.xxl),
            SkeletonCircle(size: 96),
            SizedBox(height: Spacing.xl),
            SkeletonLine(width: 200, height: 24),
            SizedBox(height: Spacing.xl),
            SkeletonRect(height: 120, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.lg),
            SkeletonRect(height: 64, borderRadius: Layout.cardRadius),
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
