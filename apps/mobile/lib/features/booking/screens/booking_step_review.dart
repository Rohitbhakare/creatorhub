import 'dart:async' show unawaited;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/hold_timer_banner.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../../../shared/utils/toast.dart';
import '../providers/booking_intent_provider.dart';
import '../providers/booking_provider.dart';
import 'booking_step_travellers.dart';

/// Step 3 (final) of the booking flow: hold + price breakdown + pay.
///
/// On mount, POSTs to `/booking-intents` to reserve inventory; the timer
/// banner counts down to expiry. On dispose (back navigation), DELETEs
/// the intent so seats are released.
///
/// Pricing is computed mobile-side (Base × N + 18% GST = Total) and sent
/// to the backend at booking-creation time — the API treats it as a hint
/// and recomputes server-side.
class BookingStepReview extends ConsumerStatefulWidget {
  /// `experience` | `event` | `itinerary`
  final String contentType;
  final String contentId;
  final String? scheduledDateId;
  final String? eventOccurrenceId;
  final String title;
  final String creatorName;
  final String? coverImageUrl;
  final String? dateLabel;
  final int basePricePaisa;
  final TravellerInfo traveller;

  /// Called after Razorpay verifies; the shell pops to the confirmation
  /// route.
  final ValueChanged<String> onBookingConfirmed;

  /// Called when the hold expires before the user pays; the shell should
  /// bounce the user back to Step 1 (date) so they can re-pick.
  final VoidCallback onHoldExpired;

  const BookingStepReview({
    super.key,
    required this.contentType,
    required this.contentId,
    required this.title,
    required this.creatorName,
    required this.basePricePaisa,
    required this.traveller,
    required this.onBookingConfirmed,
    required this.onHoldExpired,
    this.scheduledDateId,
    this.eventOccurrenceId,
    this.coverImageUrl,
    this.dateLabel,
  });

  @override
  ConsumerState<BookingStepReview> createState() => _BookingStepReviewState();
}

class _BookingStepReviewState extends ConsumerState<BookingStepReview> {
  late final Razorpay _razorpay;
  bool _tncAccepted = false;
  bool _processing = false;
  bool _holdRequested = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);

    // Reserve the hold once on entry.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted || _holdRequested) return;
      _holdRequested = true;
      final intent = await ref.read(bookingIntentProvider.notifier).create(
            contentId: widget.contentId,
            scheduledDateId: widget.scheduledDateId,
            eventOccurrenceId: widget.eventOccurrenceId,
            travellers: widget.traveller.count,
          );
      if (!mounted) return;
      if (intent == null) {
        final err = ref.read(bookingIntentProvider).error ??
            'Could not reserve spots';
        showAppToast(context, err);
      }
    });
  }

  @override
  void dispose() {
    _razorpay.clear();
    // Best-effort release of the hold when leaving the step.
    final notifier = ref.read(bookingIntentProvider.notifier);
    unawaited(notifier.release());
    super.dispose();
  }

  // ── Pricing math (paisa) ────────────────────────────────────────

  int get _baseSubtotalPaisa =>
      widget.basePricePaisa * widget.traveller.count;
  int get _gstPaisa => (_baseSubtotalPaisa * 0.18).round();
  int get _totalPaisa => _baseSubtotalPaisa + _gstPaisa;

  // ── Razorpay handlers ───────────────────────────────────────────

  Future<void> _onPay() async {
    if (!_tncAccepted) return;
    final intent = ref.read(bookingIntentProvider).intent;
    if (intent == null) {
      showAppToast(context, 'Hold expired — please try again.');
      return;
    }
    unawaited(HapticFeedback.lightImpact());
    setState(() => _processing = true);

    final created = await ref.read(bookingFlowProvider.notifier).createBooking(
          contentId: widget.contentId,
          scheduledDateId: widget.scheduledDateId,
          eventOccurrenceId: widget.eventOccurrenceId,
          intentId: intent.intentId,
          travellers: widget.traveller.count,
        );

    if (!mounted) return;
    if (created == null) {
      setState(() => _processing = false);
      final flow = ref.read(bookingFlowProvider).value;
      final err = flow?.error ?? 'Could not create booking';
      // Capacity-full bounce-back signal — shell handles re-pick.
      if (err.toLowerCase().contains('capacity') ||
          err.toLowerCase().contains('sold out')) {
        showAppToast(context, 'That slot just sold out. Please pick another.');
        widget.onHoldExpired();
      } else {
        showAppToast(context, err);
      }
      return;
    }

    final options = <String, dynamic>{
      'key': created.keyId,
      'amount': _totalPaisa,
      'order_id': created.razorpayOrderId,
      'name': 'CreatorHub',
      'description': widget.title,
      'prefill': {
        'contact': widget.traveller.phone,
        'email': '',
      },
      'theme': {
        'color': '#E15A41',
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
      setState(() => _processing = false);
      showAppToast(context, 'Could not open payment. Please try again.');
    }
  }

  Future<void> _onPaymentSuccess(PaymentSuccessResponse response) async {
    if (!mounted) return;
    setState(() => _processing = true);

    final flow = ref.read(bookingFlowProvider).value;
    final result = flow?.result;
    if (result == null) {
      setState(() => _processing = false);
      showAppToast(context, 'Payment session expired. Please try again.');
      return;
    }

    final verified =
        await ref.read(bookingFlowProvider.notifier).verifyPayment(
              razorpayOrderId: response.orderId ?? result.razorpayOrderId,
              razorpayPaymentId: response.paymentId ?? '',
              razorpaySignature: response.signature ?? '',
            );

    if (!mounted) return;
    setState(() => _processing = false);

    if (verified != null) {
      // Hold has been consumed by booking creation — clear local state
      // so dispose() doesn't fire a stale DELETE.
      ref.read(bookingIntentProvider.notifier).clearLocal();
      widget.onBookingConfirmed(verified.id);
    } else {
      final err = ref.read(bookingFlowProvider).value?.error ??
          'Payment verification failed';
      showAppToast(context, err);
    }
  }

  void _onPaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() => _processing = false);
    showAppToast(context, response.message ?? 'Payment failed.');
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    // Razorpay handles wallet flows internally.
  }

  // ── Build ───────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final intentState = ref.watch(bookingIntentProvider);
    final intent = intentState.intent;

    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            Layout.screenPaddingH,
            Spacing.xl,
            Layout.screenPaddingH,
            120, // leave room for sticky pay button
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Review and pay', style: typ.AppTypography.h3),
              const SizedBox(height: Spacing.lg),

              // Hold timer (coral allowed under DD-013 #8 — critical signal)
              if (intent != null) ...[
                HoldTimerBanner(
                  expiresAt: intent.expiresAt,
                  onExpiry: () {
                    ref.read(bookingIntentProvider.notifier).clearLocal();
                    if (!mounted) return;
                    showAppToast(context, 'Hold expired. Please try again.');
                    widget.onHoldExpired();
                  },
                ),
                const SizedBox(height: Spacing.lg),
              ],

              // Mini-card summary
              _MiniCard(
                title: widget.title,
                creatorName: widget.creatorName,
                coverImageUrl: widget.coverImageUrl,
                dateLabel: widget.dateLabel,
                travellers: widget.traveller.count,
              ),
              const SizedBox(height: Spacing.xl),

              // Price breakdown
              _PriceBreakdown(
                basePricePaisa: widget.basePricePaisa,
                travellers: widget.traveller.count,
                baseSubtotalPaisa: _baseSubtotalPaisa,
                gstPaisa: _gstPaisa,
                totalPaisa: _totalPaisa,
              ),
              const SizedBox(height: Spacing.xl),

              // T&Cs
              _TncCheckbox(
                value: _tncAccepted,
                onChanged: (v) => setState(() => _tncAccepted = v),
              ),
            ],
          ),
        ),

        // Sticky pay bar
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: EdgeInsets.fromLTRB(
              Layout.screenPaddingH,
              Spacing.md,
              Layout.screenPaddingH,
              Spacing.md + MediaQuery.of(context).padding.bottom,
            ),
            decoration: const BoxDecoration(
              color: AppColors.bg,
              border: Border(top: BorderSide(color: AppColors.hairline)),
            ),
            child: AppButton(
              label: _processing
                  ? 'Processing…'
                  : 'Pay ${formatPrice(_totalPaisa)}',
              onPressed: (_tncAccepted && intent != null && !_processing)
                  ? _onPay
                  : null,
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              fullWidth: true,
              isLoading: _processing,
            ),
          ),
        ),
      ],
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────

class _MiniCard extends StatelessWidget {
  final String title;
  final String creatorName;
  final String? coverImageUrl;
  final String? dateLabel;
  final int travellers;

  const _MiniCard({
    required this.title,
    required this.creatorName,
    required this.coverImageUrl,
    required this.dateLabel,
    required this.travellers,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPaddingCompact),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: (coverImageUrl != null && coverImageUrl!.isNotEmpty)
                      ? CachedNetworkImage(
                          imageUrl: coverImageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, _) =>
                              Container(color: AppColors.shimmerBase),
                          errorWidget: (_, _, _) => Container(
                            color: AppColors.surfaceAlt,
                            child: const Icon(
                              PhosphorIconsFill.image,
                              size: 18,
                              color: AppColors.inkMuted,
                            ),
                          ),
                        )
                      : Container(
                          color: AppColors.surfaceSunk,
                          child: const Icon(
                            PhosphorIconsFill.image,
                            size: 18,
                            color: AppColors.inkMuted,
                          ),
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
          const SizedBox(height: Spacing.md),
          Row(
            children: [
              if (dateLabel != null) ...[
                Icon(
                  PhosphorIconsFill.calendarBlank,
                  size: 14,
                  color: AppColors.inkSoft,
                ),
                const SizedBox(width: Spacing.xs),
                Text(
                  dateLabel!,
                  style: typ.AppTypography.caption,
                ),
                const SizedBox(width: Spacing.md),
              ],
              Icon(
                PhosphorIconsFill.users,
                size: 14,
                color: AppColors.inkSoft,
              ),
              const SizedBox(width: Spacing.xs),
              Text(
                '$travellers ${travellers == 1 ? "traveller" : "travellers"}',
                style: typ.AppTypography.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PriceBreakdown extends StatelessWidget {
  final int basePricePaisa;
  final int travellers;
  final int baseSubtotalPaisa;
  final int gstPaisa;
  final int totalPaisa;

  const _PriceBreakdown({
    required this.basePricePaisa,
    required this.travellers,
    required this.baseSubtotalPaisa,
    required this.gstPaisa,
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
        children: [
          _row(
            '${formatPrice(basePricePaisa)} × $travellers',
            formatPrice(baseSubtotalPaisa),
          ),
          const SizedBox(height: Spacing.sm),
          _row('GST (18%)', formatPrice(gstPaisa)),
          const SizedBox(height: Spacing.md),
          const Divider(color: AppColors.hairline, height: 1),
          const SizedBox(height: Spacing.md),
          _row('Total', formatPrice(totalPaisa), bold: true),
        ],
      ),
    );
  }

  Widget _row(String label, String value, {bool bold = false}) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: bold
                ? typ.AppTypography.h4
                : typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
        ),
        Text(
          value,
          style: bold
              ? typ.AppTypography.h4
              : typ.AppTypography.body.copyWith(color: AppColors.ink),
        ),
      ],
    );
  }
}

class _TncCheckbox extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;

  const _TncCheckbox({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onChanged(!value);
      },
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: Spacing.xs),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: Checkbox(
                value: value,
                onChanged: (v) => onChanged(v ?? false),
                activeColor: AppColors.ink,
                checkColor: AppColors.surface,
                side: const BorderSide(
                  color: AppColors.hairlineStrong,
                  width: 1.5,
                ),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: typ.AppTypography.bodySmall
                      .copyWith(color: AppColors.inkSoft),
                  children: [
                    const TextSpan(text: 'I agree to the '),
                    TextSpan(
                      text: 'Booking Terms',
                      style: typ.AppTypography.bodySmall.copyWith(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                    const TextSpan(text: ' and the cancellation policy.'),
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

