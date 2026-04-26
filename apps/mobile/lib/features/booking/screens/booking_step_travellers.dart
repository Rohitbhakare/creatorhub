import 'dart:async' show unawaited;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/input.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../auth/providers/auth_provider.dart';

/// Step 2 of the booking flow: travellers count + lead traveller details.
///
/// `maxTravellers` is `min(spotsLeft, 10)`; the stepper enforces it.
/// The lead-traveller name + phone fields prefill from the auth user's
/// profile.
class BookingStepTravellers extends ConsumerStatefulWidget {
  final int initialCount;
  final int maxTravellers;
  final String? initialName;
  final String? initialPhone;
  final ValueChanged<TravellerInfo> onChanged;

  const BookingStepTravellers({
    super.key,
    required this.initialCount,
    required this.maxTravellers,
    this.initialName,
    this.initialPhone,
    required this.onChanged,
  });

  @override
  ConsumerState<BookingStepTravellers> createState() =>
      _BookingStepTravellersState();
}

/// Lightweight value-object the parent shell consumes — keeps the step
/// stateless from the shell's perspective.
class TravellerInfo {
  final int count;
  final String name;
  final String phone;

  const TravellerInfo({
    required this.count,
    required this.name,
    required this.phone,
  });

  bool get isValid =>
      count >= 1 &&
      name.trim().isNotEmpty &&
      phone.trim().length >= 10;
}

class _BookingStepTravellersState extends ConsumerState<BookingStepTravellers> {
  late int _count;
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;

  @override
  void initState() {
    super.initState();
    _count = widget.initialCount.clamp(1, widget.maxTravellers);
    final auth = ref.read(authProvider);
    final user = auth.user ?? const <String, dynamic>{};
    _nameCtrl = TextEditingController(
      text: widget.initialName ?? (user['display_name'] as String?) ?? '',
    );
    _phoneCtrl = TextEditingController(
      text: widget.initialPhone ?? (user['phone_number'] as String?) ?? '',
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _emit());
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _emit() {
    widget.onChanged(TravellerInfo(
      count: _count,
      name: _nameCtrl.text,
      phone: _phoneCtrl.text,
    ));
  }

  void _setCount(int value) {
    final clamped = value.clamp(1, widget.maxTravellers);
    if (clamped == _count) return;
    unawaited(HapticFeedback.selectionClick());
    setState(() => _count = clamped);
    _emit();
  }

  @override
  Widget build(BuildContext context) {
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
          Text('Travellers', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.xs),
          Text(
            'How many people are joining?',
            style: typ.AppTypography.bodySmall
                .copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),

          // Stepper
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.lg,
              vertical: Spacing.md,
            ),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Travellers', style: typ.AppTypography.h4),
                      const SizedBox(height: Spacing.xs),
                      Text(
                        widget.maxTravellers >= 10
                            ? 'Up to 10 per booking'
                            : '${widget.maxTravellers} spots left',
                        style: typ.AppTypography.caption,
                      ),
                    ],
                  ),
                ),
                _StepperButton(
                  icon: PhosphorIconsRegular.minus,
                  enabled: _count > 1,
                  onTap: () => _setCount(_count - 1),
                ),
                Container(
                  width: 44,
                  alignment: Alignment.center,
                  child: Text('$_count', style: typ.AppTypography.h3),
                ),
                _StepperButton(
                  icon: PhosphorIconsRegular.plus,
                  enabled: _count < widget.maxTravellers,
                  onTap: () => _setCount(_count + 1),
                ),
              ],
            ),
          ),

          const SizedBox(height: Spacing.xxl),
          Text('Lead traveller', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.xs),
          Text(
            'We\'ll use this to send confirmations and updates.',
            style: typ.AppTypography.caption,
          ),
          const SizedBox(height: Spacing.lg),

          AppInput(
            controller: _nameCtrl,
            label: 'Full name',
            hint: 'e.g. Aarav Sharma',
            onChanged: (_) => _emit(),
          ),
          const SizedBox(height: Spacing.lg),
          AppInput(
            controller: _phoneCtrl,
            label: 'Phone number',
            hint: '10-digit mobile',
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]')),
              LengthLimitingTextInputFormatter(15),
            ],
            onChanged: (_) => _emit(),
          ),
        ],
      ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _StepperButton({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: Layout.minTapTarget,
        height: Layout.minTapTarget,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: enabled ? AppColors.surfaceAlt : AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.minTapTarget / 2),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Icon(
          icon,
          size: 18,
          color: enabled ? AppColors.ink : AppColors.inkFaint,
        ),
      ),
    );
  }
}
