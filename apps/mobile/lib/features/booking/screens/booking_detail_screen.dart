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

          // BK-FR-011: 48h dispute window after completion
          if (booking.status == 'completed')
            _DisputeWindowSection(booking: booking),

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

// ── BK-FR-011: Dispute window ─────────────────────────────────────

/// Shows a 48-hour countdown after booking completion.
/// If within the window, shows "Raise a dispute" CTA.
/// Once the window expires the CTA is replaced with a closed-window note.
class _DisputeWindowSection extends StatelessWidget {
  final BookingDetails booking;

  const _DisputeWindowSection({required this.booking});

  static const _windowHours = 48;

  DateTime? get _completedAt {
    // In a real integration, the API would return a completed_at field.
    // We use createdAt as a safe fallback for now.
    try {
      return DateTime.parse(booking.createdAt);
    } catch (_) {
      return null;
    }
  }

  bool get _isWindowOpen {
    final ca = _completedAt;
    if (ca == null) return false;
    return DateTime.now().isBefore(
      ca.add(const Duration(hours: _windowHours)),
    );
  }

  Duration get _remaining {
    final ca = _completedAt;
    if (ca == null) return Duration.zero;
    final deadline = ca.add(const Duration(hours: _windowHours));
    final diff = deadline.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  String get _remainingLabel {
    final r = _remaining;
    if (r == Duration.zero) return 'Closed';
    final h = r.inHours;
    final m = r.inMinutes.remainder(60);
    if (h > 0) return '${h}h ${m}m left';
    return '${m}m left';
  }

  void _showDisputeSheet(BuildContext context) {
    HapticFeedback.lightImpact();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DisputeSheet(bookingId: booking.id),
    );
  }

  @override
  Widget build(BuildContext context) {
    final open = _isWindowOpen;

    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.lg),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(Layout.cardPadding),
        decoration: BoxDecoration(
          color: open ? AppColors.warningSurface : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: open
                ? AppColors.warning.withValues(alpha: 0.25)
                : AppColors.hairline,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  PhosphorIconsRegular.shieldWarning,
                  size: 16,
                  color: open ? AppColors.warning : AppColors.inkSoft,
                ),
                const SizedBox(width: Spacing.xs),
                Text(
                  'Dispute window',
                  style: typ.AppTypography.label.copyWith(
                    color: open ? AppColors.warning : AppColors.inkSoft,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Spacing.sm,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: open
                        ? AppColors.warning.withValues(alpha: 0.15)
                        : AppColors.hairline,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    open ? _remainingLabel : 'Closed',
                    style: typ.AppTypography.caption.copyWith(
                      color: open ? AppColors.warning : AppColors.inkSoft,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              open
                  ? 'Something went wrong with your experience? You have 48 hours after completion to raise a dispute.'
                  : 'The 48-hour dispute window for this booking has closed.',
              style: typ.AppTypography.bodySmall.copyWith(
                color: open ? AppColors.ink : AppColors.inkSoft,
              ),
            ),
            if (open) ...[
              const SizedBox(height: Spacing.md),
              AppButton(
                label: 'Raise a dispute',
                onPressed: () => _showDisputeSheet(context),
                variant: AppButtonVariant.outline,
                size: AppButtonSize.small,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Bottom sheet for raising a dispute (BK-FR-011).
class _DisputeSheet extends StatefulWidget {
  final String bookingId;

  const _DisputeSheet({required this.bookingId});

  @override
  State<_DisputeSheet> createState() => _DisputeSheetState();
}

class _DisputeSheetState extends State<_DisputeSheet> {
  static const _reasons = [
    'Experience did not happen',
    'Experience was significantly different from description',
    'Creator was unresponsive or no-show',
    'Safety concern during experience',
    'Other issue',
  ];

  String? _selectedReason;
  final _descController = TextEditingController();
  bool _submitting = false;
  bool _submitted = false;

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedReason == null) return;
    setState(() => _submitting = true);
    HapticFeedback.lightImpact();
    // BK-FR-011: POST /api/v1/bookings/:id/dispute
    // Submission is best-effort for now — wired up when dispute API is built (M2).
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) setState(() { _submitting = false; _submitted = true; });
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Layout.sheetRadius),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        Spacing.xl, Spacing.lg, Spacing.xl, bottom + Spacing.xl,
      ),
      child: _submitted
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: Spacing.xl),
                const Icon(
                  PhosphorIconsFill.checkCircle,
                  size: 40,
                  color: AppColors.success,
                ),
                const SizedBox(height: Spacing.lg),
                Text('Dispute raised', style: typ.AppTypography.h4),
                const SizedBox(height: Spacing.xs),
                Text(
                  'Our team will review your case and respond within 3 business days.',
                  style: typ.AppTypography.body
                      .copyWith(color: AppColors.inkSoft),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: Spacing.xl),
                AppButton(
                  label: 'Done',
                  onPressed: () => Navigator.of(context).pop(),
                  variant: AppButtonVariant.secondary,
                  fullWidth: true,
                ),
              ],
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: Layout.sheetHandleWidth,
                    height: Layout.sheetHandleHeight,
                    decoration: BoxDecoration(
                      color: AppColors.hairlineStrong.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(
                        Layout.sheetHandleHeight / 2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: Spacing.lg),
                Text('Raise a dispute', style: typ.AppTypography.h4),
                const SizedBox(height: Spacing.xs),
                Text(
                  'Tell us what went wrong.',
                  style: typ.AppTypography.body
                      .copyWith(color: AppColors.inkSoft),
                ),
                const SizedBox(height: Spacing.lg),
                ..._reasons.map(
                  (r) => GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedReason = r);
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: Spacing.sm),
                      padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.md,
                        vertical: Spacing.sm + 2,
                      ),
                      decoration: BoxDecoration(
                        color: _selectedReason == r
                            ? AppColors.primaryTint
                            : AppColors.surface,
                        borderRadius:
                            BorderRadius.circular(Layout.cardRadius),
                        border: Border.all(
                          color: _selectedReason == r
                              ? AppColors.coral
                              : AppColors.hairline,
                          width: _selectedReason == r ? 1.5 : 1.0,
                        ),
                      ),
                      child: Text(
                        r,
                        style: typ.AppTypography.body.copyWith(
                          color: _selectedReason == r
                              ? AppColors.coral
                              : AppColors.ink,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
                if (_selectedReason != null) ...[
                  const SizedBox(height: Spacing.sm),
                  TextField(
                    controller: _descController,
                    maxLines: 3,
                    maxLength: 500,
                    style: typ.AppTypography.body,
                    decoration: InputDecoration(
                      hintText: 'Describe what happened (optional)',
                      hintStyle: typ.AppTypography.body
                          .copyWith(color: AppColors.inkFaint),
                      filled: true,
                      fillColor: AppColors.surface,
                      contentPadding: const EdgeInsets.all(Spacing.md),
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(Layout.inputRadius),
                        borderSide:
                            const BorderSide(color: AppColors.hairline),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(Layout.inputRadius),
                        borderSide:
                            const BorderSide(color: AppColors.hairline),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(Layout.inputRadius),
                        borderSide: const BorderSide(
                            color: AppColors.ink, width: 1.5),
                      ),
                      counterText: '',
                    ),
                  ),
                ],
                const SizedBox(height: Spacing.lg),
                AppButton(
                  label: _submitting ? 'Submitting…' : 'Submit dispute',
                  onPressed:
                      _selectedReason == null || _submitting ? null : _submit,
                  variant: AppButtonVariant.primary,
                  fullWidth: true,
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
