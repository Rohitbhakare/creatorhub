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
import '../../providers/wizard_provider.dart';

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

  void _onTogglePricing(bool isPaid) {
    HapticFeedback.lightImpact();
    if (isPaid) {
      final currentPaisa = ref.read(wizardProvider).pricePaisa;
      ref
          .read(wizardProvider.notifier)
          .setPricing('paid', currentPaisa > 0 ? currentPaisa : 0);
    } else {
      _priceController.clear();
      ref.read(wizardProvider.notifier).setPricing('free', 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final isPaid = wizard.pricingModel == 'paid';
    final pricePaisa = wizard.pricePaisa;

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

          // Section title
          Text('Pricing', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            'Choose how to price your content',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),

          // Free / Paid toggle
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.lg,
              vertical: Spacing.md,
            ),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isPaid ? 'Paid content' : 'Free content',
                        style: typ.AppTypography.h4,
                      ),
                      const SizedBox(height: Spacing.xs),
                      Text(
                        isPaid
                            ? 'Buyers pay to access this content'
                            : 'Anyone can access this for free',
                        style: typ.AppTypography.caption,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: Spacing.md),
                Switch.adaptive(
                  value: isPaid,
                  onChanged: _onTogglePricing,
                  activeThumbColor: AppColors.coral,
                  activeTrackColor: AppColors.coralLight,
                ),
              ],
            ),
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

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
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
