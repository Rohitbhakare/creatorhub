import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/app_bottom_sheet.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/input.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../content/providers/wizard_provider.dart';
import '../providers/experience_provider.dart';

/// Step 2 of the Experience wizard — scheduled dates, meeting point,
/// and cancellation policy.
class ExperienceDetailsStep extends ConsumerStatefulWidget {
  const ExperienceDetailsStep({super.key});

  @override
  ConsumerState<ExperienceDetailsStep> createState() =>
      _ExperienceDetailsStepState();
}

class _ExperienceDetailsStepState
    extends ConsumerState<ExperienceDetailsStep> {
  final _publicAreaController = TextEditingController();
  final _privateNameController = TextEditingController();
  bool _hasPrivateMeetingPoint = false;
  int _revealHours = 24;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Sync contentId from wizardProvider — the shell creates the draft and
      // stores the id there; createExperienceProvider starts with contentId=null.
      final wizardId = ref.read(wizardProvider).contentId;
      if (wizardId != null &&
          ref.read(createExperienceProvider).contentId == null) {
        ref.read(createExperienceProvider.notifier).setContentId(wizardId);
      }

      final mp = ref.read(createExperienceProvider).meetingPoint;
      if (mp != null) {
        _publicAreaController.text = mp.publicAreaName;
        if (mp.privateExactName != null) {
          _privateNameController.text = mp.privateExactName!;
          setState(() => _hasPrivateMeetingPoint = true);
        }
      }
    });
  }

  @override
  void dispose() {
    _publicAreaController.dispose();
    _privateNameController.dispose();
    super.dispose();
  }

  void _saveMeetingPoint() {
    final publicName = _publicAreaController.text.trim();
    if (publicName.isEmpty) return;
    ref.read(createExperienceProvider.notifier).setMeetingPoint(
          MeetingPointInfo(
            publicAreaName: publicName,
            privateExactName: _hasPrivateMeetingPoint
                ? _privateNameController.text.trim().isNotEmpty
                    ? _privateNameController.text.trim()
                    : null
                : null,
          ),
        );
  }

  void _openAddDateSheet() {
    unawaited(showAppBottomSheet<void>(
      context: context,
      title: 'Add a date',
      builder: (_) => _AddDateSheet(
        onAdd: (startDate, endDate, capacity) async {
          final result = await ref
              .read(createExperienceProvider.notifier)
              .addDateApi(
                startDate: startDate,
                endDate: endDate,
                capacity: capacity,
              );
          if (result == null && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Failed to add date. Try again.')),
            );
          }
        },
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final exp = ref.watch(createExperienceProvider);

    return SingleChildScrollView(
      padding:
          const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),
          Text('Experience Details', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            'Set dates, where to meet, and your cancellation policy.',
            style:
                typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xxl),

          // ── Scheduled Dates ──────────────────────────────────────
          const _SectionLabel('Scheduled dates'),
          const SizedBox(height: Spacing.xs),
          Text(
            'Add one or more dates when this experience runs.',
            style: typ.AppTypography.bodySmall
                .copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.md),

          if (exp.dates.isNotEmpty) ...[
            ...exp.dates.map(
              (date) => _DateCard(
                date: date,
                onRemove: () {
                  HapticFeedback.lightImpact();
                  ref
                      .read(createExperienceProvider.notifier)
                      .removeDate(date.id);
                },
              ),
            ),
            const SizedBox(height: Spacing.md),
          ],

          AppButton(
            label:
                exp.dates.isEmpty ? 'Add date' : 'Add another date',
            onPressed: _openAddDateSheet,
            variant: AppButtonVariant.secondary,
            size: AppButtonSize.medium,
            leadingIcon: PhosphorIconsFill.plus,
          ),

          const SizedBox(height: Spacing.xxl),

          // ── Meeting Point ────────────────────────────────────────
          const _SectionLabel('Meeting point'),
          const SizedBox(height: Spacing.md),

          AppInput(
            controller: _publicAreaController,
            label: 'Public area name',
            hint: 'e.g. Gateway of India, Cubbon Park',
            maxLength: 200,
            textInputAction: _hasPrivateMeetingPoint
                ? TextInputAction.next
                : TextInputAction.done,
            onChanged: (_) => _saveMeetingPoint(),
          ),
          const SizedBox(height: Spacing.lg),

          // Private meeting point toggle
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(
                  () => _hasPrivateMeetingPoint = !_hasPrivateMeetingPoint);
              _saveMeetingPoint();
            },
            behavior: HitTestBehavior.opaque,
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: _hasPrivateMeetingPoint
                        ? AppColors.coral
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: _hasPrivateMeetingPoint
                          ? AppColors.coral
                          : AppColors.hairline,
                      width: 1.5,
                    ),
                  ),
                  child: _hasPrivateMeetingPoint
                      ? const Icon(Icons.check,
                          size: 14, color: AppColors.surface)
                      : null,
                ),
                const SizedBox(width: Spacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Add private meeting point',
                        style: typ.AppTypography.body,
                      ),
                      Text(
                        'Exact address revealed to booked guests only',
                        style: typ.AppTypography.caption
                            .copyWith(color: AppColors.inkMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (_hasPrivateMeetingPoint) ...[
            const SizedBox(height: Spacing.lg),
            AppInput(
              controller: _privateNameController,
              label: 'Private address',
              hint: 'e.g. Shop 4, Colaba Causeway, Mumbai 400001',
              maxLength: 300,
              onChanged: (_) => _saveMeetingPoint(),
            ),
            const SizedBox(height: Spacing.md),
            Text(
              'Reveal address',
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.inkSoft,
              ),
            ),
            const SizedBox(height: Spacing.sm),
            Row(
              children: [12, 24, 48].map((hours) {
                final selected = _revealHours == hours;
                return Padding(
                  padding: const EdgeInsets.only(right: Spacing.sm),
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _revealHours = hours);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.md,
                        vertical: Spacing.sm,
                      ),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.primaryTint
                            : AppColors.surfaceAlt,
                        borderRadius:
                            BorderRadius.circular(Layout.chipRadius),
                        border: Border.all(
                          color: selected
                              ? AppColors.coral
                              : AppColors.hairline,
                        ),
                      ),
                      child: Text(
                        '${hours}h before',
                        style: typ.AppTypography.bodySmall.copyWith(
                          color: selected
                              ? AppColors.coralDeep
                              : AppColors.inkSoft,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],

          const SizedBox(height: Spacing.xxl),

          // ── Cancellation Policy ──────────────────────────────────
          const _SectionLabel('Cancellation policy'),
          const SizedBox(height: Spacing.md),

          ...[
            (
              'flexible',
              'Flexible',
              'Full refund up to 24 hours before start'
            ),
            (
              'moderate',
              'Moderate',
              'Full refund up to 5 days before start'
            ),
            (
              'strict',
              'Strict',
              'No refund within 7 days of start'
            ),
          ].map(
            ((String, String, String) policy) {
              final (value, label, description) = policy;
              final selected = exp.cancellationPolicy == value;
              return _PolicyOption(
                label: label,
                description: description,
                selected: selected,
                onTap: () {
                  HapticFeedback.selectionClick();
                  ref
                      .read(createExperienceProvider.notifier)
                      .setCancellationPolicy(value);
                },
              );
            },
          ),

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

// ── Date Card ─────────────────────────────────────────────────────────

class _DateCard extends StatelessWidget {
  final ScheduledDate date;
  final VoidCallback onRemove;

  const _DateCard({required this.date, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM yyyy');
    final start = DateTime.tryParse(date.startDate);
    final end = DateTime.tryParse(date.endDate);
    final startStr = start != null ? fmt.format(start) : date.startDate;
    final endStr = end != null ? fmt.format(end) : date.endDate;
    final isSameDay = startStr == endStr;

    return Container(
      margin: const EdgeInsets.only(bottom: Spacing.sm),
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
        children: [
          const Icon(
            PhosphorIconsFill.calendarBlank,
            size: 20,
            color: AppColors.coral,
          ),
          const SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isSameDay ? startStr : '$startStr → $endStr',
                  style: typ.AppTypography.body
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${date.capacity} spots · ${date.spotsLeft} available',
                  style: typ.AppTypography.caption
                      .copyWith(color: AppColors.inkSoft),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(Spacing.sm),
              child: Icon(
                PhosphorIconsFill.x,
                size: 18,
                color: AppColors.inkMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Policy Option ─────────────────────────────────────────────────────

class _PolicyOption extends StatelessWidget {
  final String label;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  const _PolicyOption({
    required this.label,
    required this.description,
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
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryTint : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: selected ? AppColors.coral : AppColors.hairline,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppColors.coral : AppColors.surface,
                border: Border.all(
                  color: selected ? AppColors.coral : AppColors.hairlineStrong,
                  width: 2,
                ),
              ),
              child: selected
                  ? const Icon(Icons.check, size: 12, color: AppColors.surface)
                  : null,
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: typ.AppTypography.body.copyWith(
                      fontWeight: FontWeight.w600,
                      color: selected ? AppColors.ink : AppColors.inkSoft,
                    ),
                  ),
                  Text(
                    description,
                    style: typ.AppTypography.caption
                        .copyWith(color: AppColors.inkMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Section Label ─────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: typ.AppTypography.bodySmall.copyWith(
        fontWeight: FontWeight.w600,
        color: AppColors.inkSoft,
      ),
    );
  }
}

// ── Add Date Sheet ────────────────────────────────────────────────────

class _AddDateSheet extends StatefulWidget {
  final Future<void> Function(String startDate, String endDate, int capacity)
      onAdd;

  const _AddDateSheet({required this.onAdd});

  @override
  State<_AddDateSheet> createState() => _AddDateSheetState();
}

class _AddDateSheetState extends State<_AddDateSheet> {
  DateTime? _startDate;
  DateTime? _endDate;
  int _capacity = 10;
  bool _isAdding = false;

  Future<void> _pickStartDate() async {
    unawaited(HapticFeedback.selectionClick());
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? now.add(const Duration(days: 7)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 730)),
      helpText: 'Start date',
    );
    if (picked == null || !mounted) return;
    setState(() {
      _startDate = picked;
      if (_endDate != null && _endDate!.isBefore(picked)) {
        _endDate = picked;
      }
    });
  }

  Future<void> _pickEndDate() async {
    if (_startDate == null) return;
    unawaited(HapticFeedback.selectionClick());
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? _startDate!,
      firstDate: _startDate!,
      lastDate: _startDate!.add(const Duration(days: 30)),
      helpText: 'End date',
    );
    if (picked == null || !mounted) return;
    setState(() => _endDate = picked);
  }

  Future<void> _add() async {
    if (_startDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a start date')),
      );
      return;
    }
    setState(() => _isAdding = true);
    final fmt = DateFormat('yyyy-MM-dd');
    final endDate = _endDate ?? _startDate!;
    await widget.onAdd(
      fmt.format(_startDate!),
      fmt.format(endDate),
      _capacity,
    );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM yyyy');
    final hasStart = _startDate != null;
    final hasEnd = _endDate != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Date range row
        Row(
          children: [
            Expanded(
              child: _SheetDateButton(
                label: hasStart ? fmt.format(_startDate!) : 'Start date',
                hasValue: hasStart,
                onTap: _pickStartDate,
              ),
            ),
            const SizedBox(width: Spacing.sm),
            const Icon(
              PhosphorIconsFill.arrowRight,
              size: 16,
              color: AppColors.inkMuted,
            ),
            const SizedBox(width: Spacing.sm),
            Expanded(
              child: _SheetDateButton(
                label: hasEnd ? fmt.format(_endDate!) : 'End date',
                hasValue: hasEnd,
                enabled: hasStart,
                onTap: _pickEndDate,
              ),
            ),
          ],
        ),
        const SizedBox(height: Spacing.xs),
        Text(
          'Leave end date same as start for a single-day experience.',
          style: typ.AppTypography.caption.copyWith(color: AppColors.inkMuted),
        ),

        const SizedBox(height: Spacing.xl),

        // Capacity stepper
        Text(
          'Capacity',
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.inkSoft,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        _CapacityStepper(
          count: _capacity,
          onDecrement: () {
            if (_capacity <= 1) return;
            HapticFeedback.lightImpact();
            setState(() => _capacity--);
          },
          onIncrement: () {
            if (_capacity >= 1000) return;
            HapticFeedback.lightImpact();
            setState(() => _capacity++);
          },
        ),

        const SizedBox(height: Spacing.xl),

        AppButton(
          label: _isAdding ? 'Adding…' : 'Add date',
          onPressed: _isAdding ? null : _add,
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
          fullWidth: true,
        ),
      ],
    );
  }
}

class _SheetDateButton extends StatelessWidget {
  final String label;
  final bool hasValue;
  final bool enabled;
  final VoidCallback onTap;

  const _SheetDateButton({
    required this.label,
    required this.hasValue,
    this.enabled = true,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.45,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Spacing.md,
            vertical: Spacing.md,
          ),
          decoration: BoxDecoration(
            color:
                hasValue ? AppColors.primaryTint : AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(Layout.inputRadius),
            border: Border.all(
              color:
                  hasValue ? AppColors.coral : AppColors.hairline,
            ),
          ),
          child: Row(
            children: [
              Icon(
                PhosphorIconsFill.calendarBlank,
                size: 16,
                color: hasValue ? AppColors.coral : AppColors.inkMuted,
              ),
              const SizedBox(width: Spacing.sm),
              Flexible(
                child: Text(
                  label,
                  style: typ.AppTypography.bodySmall.copyWith(
                    color: hasValue ? AppColors.ink : AppColors.inkSoft,
                    fontWeight: hasValue
                        ? FontWeight.w600
                        : FontWeight.w400,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CapacityStepper extends StatelessWidget {
  final int count;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  const _CapacityStepper({
    required this.count,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.inputRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          GestureDetector(
            onTap: count > 1 ? onDecrement : null,
            behavior: HitTestBehavior.opaque,
            child: Container(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              decoration: BoxDecoration(
                color:
                    count > 1 ? AppColors.surface : AppColors.surfaceAlt,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.hairline),
              ),
              child: Icon(
                PhosphorIconsFill.minus,
                size: 18,
                color: count > 1 ? AppColors.ink : AppColors.inkMuted,
              ),
            ),
          ),
          Column(
            children: [
              Text('$count', style: typ.AppTypography.h2),
              Text('spots', style: typ.AppTypography.caption),
            ],
          ),
          GestureDetector(
            onTap: count < 1000 ? onIncrement : null,
            behavior: HitTestBehavior.opaque,
            child: Container(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              decoration: BoxDecoration(
                color: count < 1000
                    ? AppColors.surface
                    : AppColors.surfaceAlt,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.hairline),
              ),
              child: Icon(
                PhosphorIconsFill.plus,
                size: 18,
                color:
                    count < 1000 ? AppColors.ink : AppColors.inkMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
