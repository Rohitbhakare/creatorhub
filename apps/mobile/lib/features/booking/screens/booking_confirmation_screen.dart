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
import '../../../shared/utils/toast.dart';
import '../providers/booking_provider.dart';
import '../widgets/cancel_booking_sheet.dart';

/// Success screen after a booking is confirmed and payment verified.
///
/// Routes: /bookings/:id/confirmation (canonical) and /bookings/:id/confirmed
/// (legacy alias). Shows a de-emphasized check, "What happens next" 3-step
/// numbered hero, mono booking ID, and secondary actions for calendar /
/// invoice / cancel.
class BookingConfirmationScreen extends ConsumerWidget {
  final String bookingId;

  const BookingConfirmationScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingProvider(bookingId));

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: bookingAsync.when(
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
    final shortId = booking.id.length >= 8
        ? booking.id.substring(0, 8).toUpperCase()
        : booking.id.toUpperCase();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        Layout.screenPaddingH,
        Spacing.xl,
        Layout.screenPaddingH,
        Spacing.xxl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // De-emphasized check + headline
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: AppColors.surfaceAlt,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Icon(
                  PhosphorIconsRegular.check,
                  size: 20,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: Text(
                  'Booking confirmed',
                  style: typ.AppTypography.h2,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.sm),
          Text(
            "We've sent a confirmation to your phone.",
            style: typ.AppTypography.body
                .copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xxl),

          // Booking ID + amount
          _IdCard(
            shortId: shortId,
            fullId: booking.id,
            totalPaisa: booking.totalPaisa,
          ),
          const SizedBox(height: Spacing.xxl),

          // What happens next
          Text('What happens next', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.lg),
          const _StepRow(
            number: 1,
            title: 'Watch your phone',
            body: 'A WhatsApp confirmation will arrive in a few minutes.',
          ),
          const SizedBox(height: Spacing.md),
          const _StepRow(
            number: 2,
            title: 'Meeting point unlocks 24h before',
            body: 'The exact start location is shared the day before your trip.',
          ),
          const SizedBox(height: Spacing.md),
          const _StepRow(
            number: 3,
            title: 'Your host will reach out',
            body: 'Expect a message from the creator before the event.',
          ),
          const SizedBox(height: Spacing.xxxl),

          // Secondary actions
          _SecondaryAction(
            icon: PhosphorIconsRegular.calendarPlus,
            label: 'Add to calendar',
            onTap: () {
              HapticFeedback.lightImpact();
              showAppToast(context, 'Calendar export is coming soon.');
            },
          ),
          const _SecondaryDivider(),
          _SecondaryAction(
            icon: PhosphorIconsRegular.fileText,
            label: 'Download invoice',
            onTap: () {
              HapticFeedback.lightImpact();
              showAppToast(context, 'Invoice will be ready shortly.');
            },
          ),
          const _SecondaryDivider(),
          _SecondaryAction(
            icon: PhosphorIconsRegular.xCircle,
            label: 'Cancel booking',
            destructive: true,
            onTap: () async {
              HapticFeedback.lightImpact();
              final cancelled = await showCancelBookingSheet(
                context,
                bookingId: booking.id,
                totalPaisa: booking.totalPaisa,
                cancellationPolicy: 'flexible',
                eventStartAt: null,
              );
              if (cancelled == true && context.mounted) {
                context.go('/bookings');
              }
            },
          ),
          const SizedBox(height: Spacing.xxxl),

          // Primary "Back to home"
          AppButton(
            label: 'Back to home',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/home');
            },
            variant: AppButtonVariant.primary,
            fullWidth: true,
            size: AppButtonSize.large,
          ),
          const SizedBox(height: Spacing.md),
          AppButton(
            label: 'View booking',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/bookings/${booking.id}');
            },
            variant: AppButtonVariant.ghost,
            fullWidth: true,
            size: AppButtonSize.medium,
          ),
        ],
      ),
    );
  }
}

// ── Booking ID + Amount card ──────────────────────────────────────

class _IdCard extends StatelessWidget {
  final String shortId;
  final String fullId;
  final int totalPaisa;

  const _IdCard({
    required this.shortId,
    required this.fullId,
    required this.totalPaisa,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Booking ID',
                style: typ.AppTypography.caption,
              ),
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () async {
                  HapticFeedback.selectionClick();
                  await Clipboard.setData(ClipboardData(text: fullId));
                  if (context.mounted) {
                    showAppToast(context, 'Copied');
                  }
                },
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Copy',
                      style: typ.AppTypography.caption
                          .copyWith(color: AppColors.ink),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      PhosphorIconsRegular.copy,
                      size: 14,
                      color: AppColors.ink,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.xs),
          Text(
            '#$shortId',
            style: typ.AppTypography.h3.copyWith(
              fontFamily: 'monospace',
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: Spacing.lg),
          const Divider(color: AppColors.hairline, height: 1),
          const SizedBox(height: Spacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Amount paid',
                style: typ.AppTypography.bodySmall
                    .copyWith(color: AppColors.inkSoft),
              ),
              Text(
                formatPrice(totalPaisa),
                style: typ.AppTypography.h4,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Numbered step row ─────────────────────────────────────────────

class _StepRow extends StatelessWidget {
  final int number;
  final String title;
  final String body;

  const _StepRow({
    required this.number,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.surfaceAlt,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.hairline),
          ),
          child: Text(
            '$number',
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
        ),
        const SizedBox(width: Spacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: typ.AppTypography.body
                    .copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                body,
                style: typ.AppTypography.bodySmall
                    .copyWith(color: AppColors.inkSoft),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Secondary actions ────────────────────────────────────────────

class _SecondaryAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool destructive;
  final VoidCallback onTap;

  const _SecondaryAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.destructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = destructive ? AppColors.danger : AppColors.ink;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: Layout.minTapTarget,
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Text(
                label,
                style: typ.AppTypography.body.copyWith(
                  color: color,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const Icon(
              PhosphorIconsRegular.caretRight,
              size: 16,
              color: AppColors.inkMuted,
            ),
          ],
        ),
      ),
    );
  }
}

class _SecondaryDivider extends StatelessWidget {
  const _SecondaryDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(color: AppColors.hairline, height: 1);
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
            SkeletonLine(width: 220, height: 26),
            SizedBox(height: Spacing.md),
            SkeletonLine(height: 14),
            SizedBox(height: Spacing.xxl),
            SkeletonRect(height: 120, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.xxl),
            SkeletonLine(width: 180, height: 20),
            SizedBox(height: Spacing.lg),
            SkeletonRect(height: 56, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.md),
            SkeletonRect(height: 56, borderRadius: Layout.cardRadius),
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
