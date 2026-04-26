import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/typography.dart' as typ;
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/theme/layout.dart';
import '../../../../shared/components/input.dart';
import '../../../../shared/utils/format.dart';
import '../../../events/providers/event_wizard_provider.dart';
import '../../providers/wizard_provider.dart';
import '../inclusions_exclusions_block.dart';

/// Pricing step for itinerary/experience content types.
///
/// Provides a free/paid toggle. When paid, shows a price input
/// with live GST, platform fee, TDS, and take-home calculations.
class PricingStep extends ConsumerStatefulWidget {
  const PricingStep({super.key});

  @override
  ConsumerState<PricingStep> createState() => _PricingStepState();
}

class _PricingStepState extends ConsumerState<PricingStep> {
  late final TextEditingController _priceController;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final wizard = ref.read(wizardProvider);
    final rupees = wizard.pricePaisa > 0 ? (wizard.pricePaisa / 100) : 0;
    _priceController = TextEditingController(
      text: rupees > 0 ? rupees.toStringAsFixed(0) : '',
    );
  }

  @override
  void dispose() {
    _priceController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onPriceChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      final rupees = double.tryParse(value) ?? 0;
      final paisa = (rupees * 100).toInt();
      ref.read(wizardProvider.notifier).setPricing('paid', paisa);
    });
  }

  void _selectFree() {
    HapticFeedback.lightImpact();
    _priceController.clear();
    ref.read(wizardProvider.notifier).setPricing('free', 0);
  }

  void _selectPaid() {
    HapticFeedback.lightImpact();
    final currentPaisa = ref.read(wizardProvider).pricePaisa;
    ref
        .read(wizardProvider.notifier)
        .setPricing('paid', currentPaisa > 0 ? currentPaisa : 0);
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final isPaid = wizard.pricingModel == 'paid';
    final pricePaisa = wizard.pricePaisa;
    final showInclusions = wizard.contentType == ContentType.selfPacedItinerary ||
        wizard.contentType == ContentType.scheduledExperience;

    // Pricing calculations (all in paisa)
    final basePaisa = pricePaisa;
    final gstPaisa = (basePaisa * 0.18).round();
    final buyerTotalPaisa = basePaisa + gstPaisa;
    final platformFeePaisa = (basePaisa * 0.17).round();
    final tdsPaisa = (basePaisa * 0.01).round();
    final takeHomePaisa = basePaisa - platformFeePaisa - tdsPaisa;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          Text('Pricing', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            'Choose how to price your content',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),

          // Free / Paid selection tiles
          Row(
            children: [
              Expanded(
                child: _PricingTile(
                  icon: Icons.lock_open_rounded,
                  label: 'Free',
                  subtitle: 'Anyone can access',
                  selected: !isPaid,
                  onTap: _selectFree,
                ),
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: _PricingTile(
                  icon: Icons.sell_rounded,
                  label: 'Paid',
                  subtitle: 'Set your own price',
                  selected: isPaid,
                  onTap: _selectPaid,
                ),
              ),
            ],
          ),

          // Paid pricing details
          if (isPaid) ...[
            const SizedBox(height: Spacing.xl),

            // Price input
            AppInput(
              controller: _priceController,
              label: 'Price (INR)',
              hint: 'e.g. 500',
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                _MaxValueFormatter(10000),
              ],
              prefix: Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Text(
                  '\u20B9',
                  style: typ.AppTypography.h4.copyWith(
                    color: AppColors.inkSoft,
                  ),
                ),
              ),
              onChanged: _onPriceChanged,
            ),
            const SizedBox(height: Spacing.xs),
            Text(
              'Maximum \u20B910,000',
              style: typ.AppTypography.caption,
            ),

            // Pricing breakdown
            if (pricePaisa > 0) ...[
              const SizedBox(height: Spacing.xl),

              Container(
                padding: const EdgeInsets.all(Layout.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(Layout.cardRadius),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pricing breakdown',
                      style: typ.AppTypography.h4,
                    ),
                    const SizedBox(height: Spacing.lg),

                    // Base price
                    _PricingRow(
                      label: 'Base price',
                      value: formatPrice(basePaisa),
                    ),
                    const SizedBox(height: Spacing.sm),

                    // GST
                    _PricingRow(
                      label: '+ GST (18%)',
                      value: formatPrice(gstPaisa),
                      valueColor: AppColors.inkSoft,
                    ),
                    const SizedBox(height: Spacing.sm),

                    const Divider(color: AppColors.hairline),
                    const SizedBox(height: Spacing.sm),

                    // Buyer total
                    _PricingRow(
                      label: 'Buyer pays',
                      value: formatPrice(buyerTotalPaisa),
                      isBold: true,
                    ),

                    const SizedBox(height: Spacing.lg),

                    // Platform fee
                    _PricingRow(
                      label: '- Platform fee (17%)',
                      value: '- ${formatPrice(platformFeePaisa)}',
                      valueColor: AppColors.inkSoft,
                    ),
                    const SizedBox(height: Spacing.sm),

                    // TDS
                    _PricingRow(
                      label: '- TDS (1%)',
                      value: '- ${formatPrice(tdsPaisa)}',
                      valueColor: AppColors.inkSoft,
                    ),
                    const SizedBox(height: Spacing.sm),

                    const Divider(color: AppColors.hairline),
                    const SizedBox(height: Spacing.sm),

                    // Take-home
                    _PricingRow(
                      label: 'You earn per sale',
                      value: formatPrice(takeHomePaisa > 0 ? takeHomePaisa : 0),
                      isBold: true,
                      valueColor: AppColors.coral,
                    ),
                  ],
                ),
              ),
            ],
          ],

          // ── Paid event extras: capacity + cancellation policy ─
          if (wizard.contentType == ContentType.event && isPaid) ...[
            const SizedBox(height: Spacing.xl),
            const Divider(color: AppColors.hairline),
            const SizedBox(height: Spacing.xl),
            const _EventCapacityField(),
            const SizedBox(height: Spacing.xl),
            const _CancellationPolicyPicker(),
          ],

          // ── Inclusions / exclusions (CRT-FR-024) ─────────────
          if (showInclusions) ...[
            const SizedBox(height: Spacing.xl),
            const Divider(color: AppColors.hairline),
            const SizedBox(height: Spacing.xl),
            Text('Inclusions & exclusions', style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              "Let travelers know exactly what's covered.",
              style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: Spacing.xl),
            const InclusionsExclusionsBlock(),
          ],

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

// ── Paid event: capacity field ────────────────────────────────────

class _EventCapacityField extends ConsumerStatefulWidget {
  const _EventCapacityField();

  @override
  ConsumerState<_EventCapacityField> createState() =>
      _EventCapacityFieldState();
}

class _EventCapacityFieldState extends ConsumerState<_EventCapacityField> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    final cap = ref.read(eventWizardProvider).capacity;
    _ctrl = TextEditingController(text: '$cap');
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Capacity', style: typ.AppTypography.h3),
        const SizedBox(height: Spacing.sm),
        Text(
          'How many people can attend this event?',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.lg),
        AppInput(
          controller: _ctrl,
          label: 'Total spots',
          hint: 'e.g. 20',
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(5),
          ],
          onChanged: (value) {
            final n = int.tryParse(value);
            if (n == null || n < 1) return;
            ref.read(eventWizardProvider.notifier).setCapacity(n);
          },
        ),
      ],
    );
  }
}

// ── Cancellation policy picker (paid events) ──────────────────────

class _CancellationPolicyPicker extends ConsumerWidget {
  const _CancellationPolicyPicker();

  static const _options = <(String, String, String)>[
    ('flexible', 'Flexible', '100% refund > 7d, 50% within 7d'),
    ('moderate', 'Moderate', '100% > 14d, 50% within 14d, 0% within 2d'),
    ('strict', 'Strict', '100% > 30d, 50% within 30d, 0% within 7d'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(eventWizardProvider).cancellationPolicy;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Cancellation policy', style: typ.AppTypography.h3),
        const SizedBox(height: Spacing.sm),
        Text(
          'Buyers see this when they book.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.lg),
        ..._options.map((opt) {
          final (value, label, desc) = opt;
          final isSelected = selected == value;
          return Padding(
            padding: const EdgeInsets.only(bottom: Spacing.sm),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                HapticFeedback.selectionClick();
                ref
                    .read(eventWizardProvider.notifier)
                    .setCancellationPolicy(value);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.all(Layout.cardPadding),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primaryTint
                      : AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(Layout.cardRadius),
                  border: Border.all(
                    color: isSelected ? AppColors.coral : AppColors.hairline,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(label, style: typ.AppTypography.h4),
                          const SizedBox(height: 2),
                          Text(
                            desc,
                            style: typ.AppTypography.bodySmall
                                .copyWith(color: AppColors.inkSoft),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      isSelected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                      color: isSelected ? AppColors.coral : AppColors.inkMuted,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }
}

/// A row in the pricing breakdown.
class _PricingRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  const _PricingRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: (isBold ? typ.AppTypography.body : typ.AppTypography.bodySmall)
                .copyWith(
              fontWeight: isBold ? FontWeight.w600 : FontWeight.w400,
              color: isBold ? AppColors.ink : AppColors.inkSoft,
            ),
          ),
        ),
        Text(
          value,
          style: (isBold ? typ.AppTypography.body : typ.AppTypography.bodySmall)
              .copyWith(
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: valueColor ?? (isBold ? AppColors.ink : AppColors.inkSoft),
          ),
        ),
      ],
    );
  }
}

/// Free / Paid selection tile for the pricing step.
class _PricingTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _PricingTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.lg,
        ),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryTint : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: selected ? AppColors.coral : AppColors.hairline,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: selected ? AppColors.coral : AppColors.surfaceSunk,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                size: 18,
                color: selected ? AppColors.surface : AppColors.inkMuted,
              ),
            ),
            const SizedBox(height: Spacing.md),
            Text(
              label,
              style: typ.AppTypography.h4.copyWith(
                color: selected ? AppColors.ink : AppColors.inkSoft,
              ),
            ),
            const SizedBox(height: Spacing.xs),
            Text(
              subtitle,
              style: typ.AppTypography.caption.copyWith(
                color: selected ? AppColors.inkSoft : AppColors.inkMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Input formatter that limits the value to a maximum integer.
class _MaxValueFormatter extends TextInputFormatter {
  final int maxValue;

  _MaxValueFormatter(this.maxValue);

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) return newValue;

    final intValue = int.tryParse(newValue.text);
    if (intValue == null) return oldValue;
    if (intValue > maxValue) return oldValue;

    return newValue;
  }
}
