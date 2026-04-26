import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/colors.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// Content type the bar is rendered under — determines copy.
enum StickyBookingContentType { experience, itinerary, event, post }

/// Floating bottom-anchored CTA bar shown on detail screens. Variants
/// per [contentType]:
/// - experience → "Check availability" + "from ₹X / person" sublabel
/// - itinerary paid → "Unlock trip · ₹X"
/// - itinerary free → renders nothing (`SizedBox.shrink`)
/// - event free → "RSVP"
/// - event paid → "Reserve seat · ₹X"
/// - post → renders nothing
///
/// The bar is wrapped in a `SafeArea(top: false)` and is intended to be
/// stacked at the bottom of the detail screen (e.g. via `Stack` or a
/// `bottomNavigationBar`).
class StickyBookingBar extends StatelessWidget {
  final StickyBookingContentType contentType;

  /// Price label such as "₹1,499". When null and the variant requires
  /// a price (paid itinerary, paid event), the bar still renders without
  /// the bullet/price suffix.
  final String? priceLabel;

  /// Optional secondary label, e.g. "for 1 traveller" or "Free".
  final String? subLabel;

  /// Disable the CTA (still shows the price).
  final bool disabled;

  /// Tap handler. Caller wires actual flow (e.g. opens availability sheet).
  final VoidCallback? onTap;

  /// Override price assumption (paid vs free) for itinerary/event when
  /// only a label is available. Defaults to `priceLabel != null`.
  final bool? isPaid;

  const StickyBookingBar({
    super.key,
    required this.contentType,
    this.priceLabel,
    this.subLabel,
    this.disabled = false,
    this.onTap,
    this.isPaid,
  });

  bool get _isPaid => isPaid ?? (priceLabel != null && priceLabel!.isNotEmpty);

  String? get _ctaLabel {
    switch (contentType) {
      case StickyBookingContentType.experience:
        return 'Check availability';
      case StickyBookingContentType.itinerary:
        if (!_isPaid) return null;
        return priceLabel == null ? 'Unlock trip' : 'Unlock trip · $priceLabel';
      case StickyBookingContentType.event:
        if (!_isPaid) return 'RSVP';
        return priceLabel == null
            ? 'Reserve seat'
            : 'Reserve seat · $priceLabel';
      case StickyBookingContentType.post:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cta = _ctaLabel;
    if (cta == null) return const SizedBox.shrink();

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.hairline),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x14101828),
            offset: Offset(0, -2),
            blurRadius: 12,
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            Spacing.lg,
            Spacing.md,
            Spacing.lg,
            Spacing.md,
          ),
          child: Row(
            children: [
              if (contentType == StickyBookingContentType.experience &&
                  (priceLabel != null || subLabel != null)) ...[
                Expanded(child: _buildPriceColumn()),
                const SizedBox(width: Spacing.md),
              ],
              Expanded(
                flex: 2,
                child: _PrimaryCta(
                  label: cta,
                  disabled: disabled,
                  onTap: onTap,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (priceLabel != null)
          Text(
            priceLabel!,
            style: AppTypography.h4,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        if (subLabel != null)
          Text(
            subLabel!,
            style: AppTypography.caption,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
      ],
    );
  }
}

class _PrimaryCta extends StatelessWidget {
  final String label;
  final bool disabled;
  final VoidCallback? onTap;

  const _PrimaryCta({
    required this.label,
    required this.disabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = !disabled && onTap != null;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: enabled
          ? () {
              HapticFeedback.lightImpact();
              onTap!.call();
            }
          : null,
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          color: enabled
              ? AppColors.coral
              : AppColors.coral.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: Spacing.lg),
        child: Text(
          label,
          style: AppTypography.bodyLarge.copyWith(
            color: AppColors.surface,
            fontWeight: FontWeight.w600,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}
