import 'dart:async' show unawaited;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../../../shared/utils/toast.dart';
import '../../itineraries/providers/itinerary_detail_provider.dart';
import '../providers/booking_provider.dart';

/// Single-screen purchase flow for paid self-paced itineraries.
///
/// No date picker, no traveller stepper, no inventory hold — itineraries
/// are evergreen content. Just: cover + title + price breakdown + T&Cs +
/// pay → Razorpay → confirmation.
class BookingSelfPacedScreen extends ConsumerStatefulWidget {
  final String contentId;

  const BookingSelfPacedScreen({super.key, required this.contentId});

  @override
  ConsumerState<BookingSelfPacedScreen> createState() =>
      _BookingSelfPacedScreenState();
}

class _BookingSelfPacedScreenState
    extends ConsumerState<BookingSelfPacedScreen> {
  late final Razorpay _razorpay;
  bool _tncAccepted = false;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _onPay({
    required String title,
    required int basePricePaisa,
  }) async {
    if (!_tncAccepted) return;
    unawaited(HapticFeedback.lightImpact());
    setState(() => _processing = true);

    final created = await ref.read(bookingFlowProvider.notifier).createBooking(
          contentId: widget.contentId,
          travellers: 1,
        );

    if (!mounted) return;
    if (created == null) {
      setState(() => _processing = false);
      final err = ref.read(bookingFlowProvider).value?.error ??
          'Could not create booking';
      showAppToast(context, err);
      return;
    }

    final gst = (basePricePaisa * 0.18).round();
    final total = basePricePaisa + gst;

    final options = <String, dynamic>{
      'key': created.keyId,
      'amount': total,
      'order_id': created.razorpayOrderId,
      'name': 'CreatorHub',
      'description': title,
      'prefill': {'contact': '', 'email': ''},
      'theme': {'color': '#E15A41'},
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
      Navigator.of(context).pop(verified.id);
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

  void _onExternalWallet(ExternalWalletResponse response) {}

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(itineraryDetailProvider(widget.contentId));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: Text('Unlock trip', style: typ.AppTypography.h4),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(PhosphorIconsRegular.x, color: AppColors.ink),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: detailAsync.when(
          loading: () => const _Loading(),
          error: (e, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(Layout.screenPaddingH),
              child: Text(
                'Could not load itinerary.\n$e',
                style: typ.AppTypography.bodySmall
                    .copyWith(color: AppColors.inkSoft),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          data: (detail) {
            final base = detail.pricePaisa;
            final gst = (base * 0.18).round();
            final total = base + gst;
            final coverUrl = detail.mediaUrls.isNotEmpty
                ? detail.mediaUrls.first
                : null;

            return Stack(
              children: [
                SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.lg,
                    Layout.screenPaddingH,
                    120,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _Hero(
                        title: detail.title,
                        creatorName: detail.creator.displayName,
                        coverUrl: coverUrl,
                      ),
                      const SizedBox(height: Spacing.xl),
                      _BreakdownCard(
                        baseSubtotalPaisa: base,
                        gstPaisa: gst,
                        totalPaisa: total,
                      ),
                      const SizedBox(height: Spacing.lg),
                      _TncRow(
                        value: _tncAccepted,
                        onChanged: (v) => setState(() => _tncAccepted = v),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: EdgeInsets.fromLTRB(
                      Layout.screenPaddingH,
                      Spacing.md,
                      Layout.screenPaddingH,
                      Spacing.md +
                          MediaQuery.of(context).padding.bottom,
                    ),
                    decoration: const BoxDecoration(
                      color: AppColors.bg,
                      border: Border(
                          top: BorderSide(color: AppColors.hairline)),
                    ),
                    child: AppButton(
                      label: _processing
                          ? 'Processing…'
                          : 'Pay ${formatPrice(total)}',
                      onPressed: (_tncAccepted && !_processing)
                          ? () => _onPay(
                                title: detail.title,
                                basePricePaisa: base,
                              )
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
          },
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────

class _Hero extends StatelessWidget {
  final String title;
  final String creatorName;
  final String? coverUrl;

  const _Hero({
    required this.title,
    required this.creatorName,
    required this.coverUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: (coverUrl != null && coverUrl!.isNotEmpty)
                ? CachedNetworkImage(
                    imageUrl: coverUrl!,
                    fit: BoxFit.cover,
                    placeholder: (_, _) =>
                        Container(color: AppColors.shimmerBase),
                    errorWidget: (_, _, _) =>
                        Container(color: AppColors.surfaceAlt),
                  )
                : Container(color: AppColors.surfaceAlt),
          ),
        ),
        const SizedBox(height: Spacing.md),
        Text(title, style: typ.AppTypography.h3),
        const SizedBox(height: Spacing.xs),
        Text(
          'by $creatorName',
          style: typ.AppTypography.bodySmall
              .copyWith(color: AppColors.inkSoft),
        ),
      ],
    );
  }
}

class _BreakdownCard extends StatelessWidget {
  final int baseSubtotalPaisa;
  final int gstPaisa;
  final int totalPaisa;

  const _BreakdownCard({
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
          _row('Base price', formatPrice(baseSubtotalPaisa)),
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

class _TncRow extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;

  const _TncRow({required this.value, required this.onChanged});

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
              child: Text(
                'I agree to the Booking Terms and refund policy.',
                style: typ.AppTypography.bodySmall
                    .copyWith(color: AppColors.inkSoft),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          Layout.screenPaddingH,
          Spacing.lg,
          Layout.screenPaddingH,
          Spacing.xl,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SkeletonRect(height: 180, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.lg),
            SkeletonLine(width: 240, height: 24),
            SizedBox(height: Spacing.sm),
            SkeletonLine(width: 120, height: 14),
            SizedBox(height: Spacing.xl),
            SkeletonRect(height: 160, borderRadius: Layout.cardRadius),
          ],
        ),
      ),
    );
  }
}
