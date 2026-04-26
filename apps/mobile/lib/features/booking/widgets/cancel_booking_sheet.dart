import 'dart:async' show unawaited;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/dio_errors.dart';
import '../../../shared/utils/format.dart';
import '../../../shared/utils/toast.dart';
import '../../auth/providers/auth_provider.dart';

/// Modal bottom sheet for cancelling a booking. Shows the cancellation
/// policy summary, lets the user pick a reason from a fixed list, and
/// previews the estimated refund based on policy + time-to-event.
///
/// On confirm, calls POST /api/v1/bookings/:id/cancel with
/// `{reason, reason_text?}`. Returns `true` to caller on success.
Future<bool?> showCancelBookingSheet(
  BuildContext context, {
  required String bookingId,
  required int totalPaisa,
  required String cancellationPolicy,
  required DateTime? eventStartAt,
}) {
  HapticFeedback.lightImpact();
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _CancelBookingSheet(
      bookingId: bookingId,
      totalPaisa: totalPaisa,
      cancellationPolicy: cancellationPolicy,
      eventStartAt: eventStartAt,
    ),
  );
}

class _CancelBookingSheet extends ConsumerStatefulWidget {
  final String bookingId;
  final int totalPaisa;
  final String cancellationPolicy;
  final DateTime? eventStartAt;

  const _CancelBookingSheet({
    required this.bookingId,
    required this.totalPaisa,
    required this.cancellationPolicy,
    required this.eventStartAt,
  });

  @override
  ConsumerState<_CancelBookingSheet> createState() =>
      _CancelBookingSheetState();
}

class _CancelBookingSheetState extends ConsumerState<_CancelBookingSheet> {
  String? _selectedReason;
  bool _submitting = false;

  // Five fixed reasons + freeform "Other" trigger.
  static const _reasons = <_Reason>[
    _Reason(code: 'plans_changed', label: 'Plans changed'),
    _Reason(code: 'found_better', label: 'Found a better option'),
    _Reason(code: 'health_issue', label: 'Health issue'),
    _Reason(code: 'travel_restrictions', label: 'Travel restrictions'),
    _Reason(code: 'other', label: 'Other'),
  ];

  Future<void> _confirm() async {
    if (_selectedReason == null) return;
    unawaited(HapticFeedback.lightImpact());
    setState(() => _submitting = true);
    final dio = ref.read(authServiceProvider).dio;
    try {
      await dio.post('/api/v1/bookings/${widget.bookingId}/cancel', data: {
        'reason': _selectedReason,
      });
      if (!mounted) return;
      showAppToast(context, 'Booking cancelled. Refund initiated.');
      Navigator.of(context).pop(true);
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      final msg = extractDioErrorMessage(e) ?? 'Could not cancel booking';
      showAppToast(context, msg);
    }
  }

  @override
  Widget build(BuildContext context) {
    final estimatedRefundPaisa = _estimateRefund(
      totalPaisa: widget.totalPaisa,
      policy: widget.cancellationPolicy,
      eventStartAt: widget.eventStartAt,
    );
    final policyLabel = _policyLabel(widget.cancellationPolicy);

    return Container(
      margin: const EdgeInsets.only(top: 60),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Layout.sheetRadius),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            Layout.screenPaddingH,
            Spacing.md,
            Layout.screenPaddingH,
            Spacing.lg + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: Layout.sheetHandleWidth,
                  height: Layout.sheetHandleHeight,
                  margin: const EdgeInsets.only(bottom: Spacing.lg),
                  decoration: BoxDecoration(
                    color: AppColors.hairlineStrong,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              Text('Cancel booking', style: typ.AppTypography.h3),
              const SizedBox(height: Spacing.sm),
              Text(
                'Tell us why you\'re cancelling. We\'ll process your refund per policy.',
                style: typ.AppTypography.bodySmall
                    .copyWith(color: AppColors.inkSoft),
              ),
              const SizedBox(height: Spacing.xl),

              // Policy summary
              _PolicyCard(
                policyLabel: policyLabel,
                estimatedRefundPaisa: estimatedRefundPaisa,
                totalPaisa: widget.totalPaisa,
              ),
              const SizedBox(height: Spacing.xl),

              Text('Reason', style: typ.AppTypography.h4),
              const SizedBox(height: Spacing.md),

              // Reason picker
              ..._reasons.map(
                (r) => _ReasonTile(
                  label: r.label,
                  selected: _selectedReason == r.code,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _selectedReason = r.code);
                  },
                ),
              ),

              const SizedBox(height: Spacing.xl),

              // Buttons
              AppButton(
                label: 'Cancel booking',
                onPressed:
                    (_selectedReason != null && !_submitting) ? _confirm : null,
                variant: AppButtonVariant.danger,
                size: AppButtonSize.large,
                fullWidth: true,
                isLoading: _submitting,
              ),
              const SizedBox(height: Spacing.sm),
              AppButton(
                label: 'Keep my booking',
                onPressed: _submitting
                    ? null
                    : () => Navigator.of(context).pop(false),
                variant: AppButtonVariant.secondary,
                size: AppButtonSize.large,
                fullWidth: true,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _policyLabel(String policy) {
    return switch (policy) {
      'flexible' => 'Flexible',
      'moderate' => 'Moderate',
      'strict' => 'Strict',
      _ => 'Standard',
    };
  }

  /// Estimate buyer-side refund based on policy + days-until-event.
  /// Mirrors the server-side rules used in BOOK-FR-014:
  ///   flexible: 100% > 7d, 50% ≤ 7d
  ///   moderate: 100% > 14d, 50% ≤ 14d, 0% ≤ 2d
  ///   strict:   100% > 30d, 50% ≤ 30d, 0% ≤ 7d
  int _estimateRefund({
    required int totalPaisa,
    required String policy,
    required DateTime? eventStartAt,
  }) {
    if (eventStartAt == null) return totalPaisa; // self-paced — full refund
    final daysUntil = eventStartAt.difference(DateTime.now()).inHours / 24.0;

    int pct = 0;
    switch (policy) {
      case 'flexible':
        pct = daysUntil > 7 ? 100 : 50;
        break;
      case 'moderate':
        if (daysUntil > 14) {
          pct = 100;
        } else if (daysUntil > 2) {
          pct = 50;
        } else {
          pct = 0;
        }
        break;
      case 'strict':
        if (daysUntil > 30) {
          pct = 100;
        } else if (daysUntil > 7) {
          pct = 50;
        } else {
          pct = 0;
        }
        break;
      default:
        pct = 100;
    }
    return (totalPaisa * pct / 100).round();
  }
}

class _Reason {
  final String code;
  final String label;
  const _Reason({required this.code, required this.label});
}

class _PolicyCard extends StatelessWidget {
  final String policyLabel;
  final int estimatedRefundPaisa;
  final int totalPaisa;

  const _PolicyCard({
    required this.policyLabel,
    required this.estimatedRefundPaisa,
    required this.totalPaisa,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
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
              Icon(
                PhosphorIcons.shieldCheck(),
                size: 16,
                color: AppColors.inkSoft,
              ),
              const SizedBox(width: Spacing.sm),
              Text(
                'Cancellation policy: $policyLabel',
                style: typ.AppTypography.bodySmall.copyWith(
                  color: AppColors.inkSoft,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.md),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Estimated refund',
                  style: typ.AppTypography.body
                      .copyWith(color: AppColors.inkSoft),
                ),
              ),
              Text(
                formatPrice(estimatedRefundPaisa),
                style: typ.AppTypography.h4.copyWith(
                  color: estimatedRefundPaisa > 0
                      ? AppColors.success
                      : AppColors.danger,
                ),
              ),
            ],
          ),
          if (estimatedRefundPaisa < totalPaisa) ...[
            const SizedBox(height: Spacing.xs),
            Text(
              'You paid ${formatPrice(totalPaisa)}. Final amount may vary slightly.',
              style: typ.AppTypography.caption,
            ),
          ],
        ],
      ),
    );
  }
}

class _ReasonTile extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _ReasonTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        margin: const EdgeInsets.only(bottom: Spacing.sm),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.md,
        ),
        constraints: const BoxConstraints(minHeight: Layout.minTapTarget),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryTint : AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: selected ? AppColors.coral : AppColors.hairline,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: typ.AppTypography.body.copyWith(
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                  color: AppColors.ink,
                ),
              ),
            ),
            Icon(
              selected
                  ? PhosphorIconsFill.checkCircle
                  : PhosphorIconsRegular.circle,
              size: 18,
              color: selected ? AppColors.coral : AppColors.inkFaint,
            ),
          ],
        ),
      ),
    );
  }
}
