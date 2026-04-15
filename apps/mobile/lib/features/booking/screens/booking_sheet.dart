import 'dart:async' show unawaited;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../providers/booking_provider.dart';

/// Shows the booking/payment sheet as a modal bottom sheet.
///
/// Call [BookingSheet.show] from the experience detail page after the user
/// has selected a date.
class BookingSheet extends ConsumerStatefulWidget {
  /// ID of the experience (content) being booked.
  final String contentId;

  /// ID of the specific scheduled date the user selected.
  final String scheduledDateId;

  /// Cover thumbnail URL of the experience.
  final String? coverImageUrl;

  /// Experience title.
  final String title;

  /// Creator display name.
  final String creatorName;

  /// Human-readable date range, e.g. "12 Apr – 15 Apr 2026 • 5 spots left".
  final String dateLabel;

  /// Base price in paisa.
  final int basePricePaisa;

  /// Platform fee in paisa (17% of base).
  final int platformFeePaisa;

  /// GST in paisa (18% of platform fee).
  final int gstPaisa;

  /// Total in paisa (base + fee + gst).
  final int totalPaisa;

  const BookingSheet({
    super.key,
    required this.contentId,
    required this.scheduledDateId,
    this.coverImageUrl,
    required this.title,
    required this.creatorName,
    required this.dateLabel,
    required this.basePricePaisa,
    required this.platformFeePaisa,
    required this.gstPaisa,
    required this.totalPaisa,
  });

  /// Convenience method to push the sheet as a modal bottom sheet.
  static Future<void> show(
    BuildContext context, {
    required String contentId,
    required String scheduledDateId,
    String? coverImageUrl,
    required String title,
    required String creatorName,
    required String dateLabel,
    required int basePricePaisa,
    required int platformFeePaisa,
    required int gstPaisa,
    required int totalPaisa,
  }) {
    HapticFeedback.lightImpact();
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BookingSheet(
        contentId: contentId,
        scheduledDateId: scheduledDateId,
        coverImageUrl: coverImageUrl,
        title: title,
        creatorName: creatorName,
        dateLabel: dateLabel,
        basePricePaisa: basePricePaisa,
        platformFeePaisa: platformFeePaisa,
        gstPaisa: gstPaisa,
        totalPaisa: totalPaisa,
      ),
    );
  }

  @override
  ConsumerState<BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends ConsumerState<BookingSheet> {
  late final Razorpay _razorpay;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  // ── Razorpay event handlers ───────────────────────────────────

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (!mounted) return;
    setState(() => _isProcessing = true);

    final bookingResult =
        ref.read(bookingFlowProvider).value?.result;
    if (bookingResult == null) {
      _showError('Booking session expired. Please try again.');
      setState(() => _isProcessing = false);
      return;
    }

    final verified = await ref.read(bookingFlowProvider.notifier).verifyPayment(
          razorpayOrderId: response.orderId ?? bookingResult.razorpayOrderId,
          razorpayPaymentId: response.paymentId ?? '',
          razorpaySignature: response.signature ?? '',
        );

    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (verified != null) {
      Navigator.of(context).pop(); // close the sheet
      unawaited(context.push('/bookings/${verified.id}/confirmed'));
    } else {
      final err =
          ref.read(bookingFlowProvider).value?.error ?? 'Payment verification failed';
      _showError(err);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() => _isProcessing = false);
    _showError(response.message ?? 'Payment failed. Please try again.');
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // External wallet selected — Razorpay handles the rest
  }

  // ── Pay button action ─────────────────────────────────────────

  Future<void> _onPayPressed() async {
    unawaited(HapticFeedback.lightImpact());
    setState(() => _isProcessing = true);

    final result = await ref.read(bookingFlowProvider.notifier).createBooking(
          contentId: widget.contentId,
          scheduledDateId: widget.scheduledDateId,
        );

    if (!mounted) return;

    if (result == null) {
      setState(() => _isProcessing = false);
      final err = ref.read(bookingFlowProvider).value?.error ??
          'Failed to create booking';
      _showError(err);
      return;
    }

    // Launch Razorpay
    final options = {
      'key': result.keyId,
      'amount': widget.totalPaisa, // in paisa
      'order_id': result.razorpayOrderId,
      'name': 'CreatorHub',
      'description': widget.title,
      'prefill': {
        'contact': '',
        'email': '',
      },
      'theme': {
        'color': '#E15A41', // AppColors.coral
      },
      'method': {
        'upi': true,
        'card': true,
        'netbanking': true,
        'wallet': true,
      },
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      _showError('Could not launch payment. Please try again.');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.danger,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom +
        MediaQuery.of(context).padding.bottom;

    return Container(
      margin: const EdgeInsets.only(top: 60),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Layout.sheetRadius),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            _DragHandle(),

            // Scrollable content
            Flexible(
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  Layout.screenPaddingH,
                  0,
                  Layout.screenPaddingH,
                  bottomPadding + Spacing.lg,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header row
                    _SheetHeader(
                      onClose: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).pop();
                      },
                    ),
                    const SizedBox(height: Spacing.lg),

                    // Experience card
                    _ExperienceCard(
                      coverImageUrl: widget.coverImageUrl,
                      title: widget.title,
                      creatorName: widget.creatorName,
                    ),
                    const SizedBox(height: Spacing.lg),

                    // Selected date
                    _DateRow(label: widget.dateLabel),
                    const SizedBox(height: Spacing.xl),

                    // Price breakdown
                    _PriceBreakdown(
                      basePricePaisa: widget.basePricePaisa,
                      platformFeePaisa: widget.platformFeePaisa,
                      gstPaisa: widget.gstPaisa,
                      totalPaisa: widget.totalPaisa,
                    ),
                    const SizedBox(height: Spacing.lg),

                    // Payment method badge
                    _PaymentMethodRow(),
                    const SizedBox(height: Spacing.xl),

                    // Pay button
                    AppButton(
                      label: _isProcessing
                          ? 'Processing…'
                          : 'Pay ${formatPrice(widget.totalPaisa)}',
                      onPressed: _isProcessing ? null : _onPayPressed,
                      variant: AppButtonVariant.primary,
                      fullWidth: true,
                      size: AppButtonSize.large,
                      isLoading: _isProcessing,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────

class _DragHandle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: Spacing.md, bottom: Spacing.sm),
      child: Center(
        child: Container(
          width: Layout.sheetHandleWidth,
          height: Layout.sheetHandleHeight,
          decoration: BoxDecoration(
            color: AppColors.line,
            borderRadius: BorderRadius.circular(Layout.sheetHandleHeight / 2),
          ),
        ),
      ),
    );
  }
}

class _SheetHeader extends StatelessWidget {
  final VoidCallback onClose;

  const _SheetHeader({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text('Confirm Booking', style: typ.AppTypography.h3),
        ),
        GestureDetector(
          onTap: onClose,
          behavior: HitTestBehavior.opaque,
          child: const SizedBox(
            width: 44,
            height: 44,
            child: Icon(
              PhosphorIconsRegular.x,
              size: 22,
              color: AppColors.muted,
            ),
          ),
        ),
      ],
    );
  }
}

class _ExperienceCard extends StatelessWidget {
  final String? coverImageUrl;
  final String title;
  final String creatorName;

  const _ExperienceCard({
    required this.coverImageUrl,
    required this.title,
    required this.creatorName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPaddingCompact),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 64,
              height: 64,
              child: coverImageUrl != null && coverImageUrl!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: coverImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(color: AppColors.shimmerBase),
                      errorWidget: (_, _, _) => _ImagePlaceholder(),
                    )
                  : _ImagePlaceholder(),
            ),
          ),
          const SizedBox(width: Spacing.md),

          // Title + creator
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: typ.AppTypography.h4,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: Spacing.xs),
                Text(
                  creatorName,
                  style: typ.AppTypography.caption,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.sunken,
      child: const Center(
        child: Icon(
          PhosphorIconsFill.mountains,
          size: 24,
          color: AppColors.softInk,
        ),
      ),
    );
  }
}

class _DateRow extends StatelessWidget {
  final String label;

  const _DateRow({required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(
          PhosphorIconsFill.calendarBlank,
          size: 18,
          color: AppColors.muted,
        ),
        const SizedBox(width: Spacing.sm),
        Expanded(
          child: Text(
            label,
            style: typ.AppTypography.bodySmall.copyWith(color: AppColors.muted),
          ),
        ),
      ],
    );
  }
}

class _PriceBreakdown extends StatelessWidget {
  final int basePricePaisa;
  final int platformFeePaisa;
  final int gstPaisa;
  final int totalPaisa;

  const _PriceBreakdown({
    required this.basePricePaisa,
    required this.platformFeePaisa,
    required this.gstPaisa,
    required this.totalPaisa,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _PriceLine(
            label: 'Base Price',
            amount: formatPrice(basePricePaisa),
          ),
          const SizedBox(height: Spacing.sm),
          _PriceLine(
            label: 'Platform Fee (17%)',
            amount: formatPrice(platformFeePaisa),
          ),
          const SizedBox(height: Spacing.sm),
          _PriceLine(
            label: 'GST (18% on fee)',
            amount: formatPrice(gstPaisa),
          ),
          const SizedBox(height: Spacing.md),
          const Divider(color: AppColors.border, height: 1),
          const SizedBox(height: Spacing.md),
          _PriceLine(
            label: 'Total',
            amount: formatPrice(totalPaisa),
            isTotal: true,
          ),
        ],
      ),
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
        : typ.AppTypography.body.copyWith(color: AppColors.muted);
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

class _PaymentMethodRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(
          PhosphorIconsFill.creditCard,
          size: 18,
          color: AppColors.muted,
        ),
        const SizedBox(width: Spacing.sm),
        Text(
          'Payment method',
          style: typ.AppTypography.bodySmall.copyWith(color: AppColors.muted),
        ),
        const Spacer(),
        // UPI badge
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Spacing.md,
            vertical: Spacing.xs,
          ),
          decoration: BoxDecoration(
            color: AppColors.infoSurface,
            borderRadius: BorderRadius.circular(Layout.chipRadius),
            border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                PhosphorIconsFill.deviceMobile,
                size: 14,
                color: AppColors.info,
              ),
              const SizedBox(width: Spacing.xs),
              Text(
                'UPI',
                style: typ.AppTypography.label.copyWith(color: AppColors.info),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
