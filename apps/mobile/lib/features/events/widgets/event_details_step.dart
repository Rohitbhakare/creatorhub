import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/app_bottom_sheet.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/input.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../auth/providers/auth_provider.dart';
import '../../content/providers/wizard_provider.dart';
import '../providers/event_wizard_provider.dart';

/// Event Details step (step 2 of 5 for the event wizard).
///
/// Collects: start/end date-time, venue name, venue address, city,
/// capacity, and "what to bring" items.
class EventDetailsStep extends ConsumerStatefulWidget {
  const EventDetailsStep({super.key});

  @override
  ConsumerState<EventDetailsStep> createState() => _EventDetailsStepState();
}

class _EventDetailsStepState extends ConsumerState<EventDetailsStep> {
  final _venueNameController = TextEditingController();
  final _venueAddressController = TextEditingController();
  final _cityController = TextEditingController();

  List<Map<String, dynamic>> _cityResults = [];
  bool _isSearchingCity = false;
  Timer? _cityDebounce;
  CancelToken _cityCancelToken = CancelToken();

  @override
  void initState() {
    super.initState();
    // Sync text controllers with existing state (e.g., after returning to step)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final event = ref.read(eventWizardProvider);
      _venueNameController.text = event.venueName;
      _venueAddressController.text = event.venueAddress;
    });
  }

  @override
  void dispose() {
    _venueNameController.dispose();
    _venueAddressController.dispose();
    _cityController.dispose();
    _cityDebounce?.cancel();
    _cityCancelToken.cancel();
    super.dispose();
  }

  // ── Date/time pickers ──────────────────────────────────────────

  Future<void> _pickStartDateTime() async {
    unawaited(HapticFeedback.selectionClick());
    final event = ref.read(eventWizardProvider);
    final now = DateTime.now();
    final initialDate = event.startAt ?? now.add(const Duration(days: 7));

    final date = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      helpText: 'Event date',
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(
        event.startAt ?? DateTime(date.year, date.month, date.day, 10, 0),
      ),
      helpText: 'Start time',
    );
    if (time == null || !mounted) return;

    final combined = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    ref.read(eventWizardProvider.notifier).setStartAt(combined);

    // If end time is now before start, reset it to start + 2h
    final endAt = ref.read(eventWizardProvider).endAt;
    if (endAt == null || endAt.isBefore(combined)) {
      ref
          .read(eventWizardProvider.notifier)
          .setEndAt(combined.add(const Duration(hours: 2)));
    }
  }

  Future<void> _pickEndTime() async {
    unawaited(HapticFeedback.selectionClick());
    final event = ref.read(eventWizardProvider);
    if (event.startAt == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Set start time first')),
      );
      return;
    }

    final initialTime = TimeOfDay.fromDateTime(
      event.endAt ?? event.startAt!.add(const Duration(hours: 2)),
    );

    final time = await showTimePicker(
      context: context,
      initialTime: initialTime,
      helpText: 'End time',
    );
    if (time == null || !mounted) return;

    // End must be same day as start
    final start = event.startAt!;
    final endCandidate = DateTime(
      start.year,
      start.month,
      start.day,
      time.hour,
      time.minute,
    );

    if (!endCandidate.isAfter(start)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('End time must be after start time')),
        );
      }
      return;
    }

    ref.read(eventWizardProvider.notifier).setEndAt(endCandidate);
  }

  // ── City search ────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> _searchCities(String query) async {
    if (query.trim().length < 2) return [];
    // Cancel any in-flight request before issuing a new one
    _cityCancelToken.cancel();
    _cityCancelToken = CancelToken();
    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get(
        '/api/v1/cities',
        queryParameters: {'q': query.trim(), 'limit': 10},
        cancelToken: _cityCancelToken,
      );
      final data = response.data as Map<String, dynamic>;
      return (data['data'] as List<dynamic>).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) return _cityResults; // keep last results
      return [];
    } catch (_) {
      return [];
    }
  }

  void _onCitySearch(String value) {
    _cityDebounce?.cancel();
    if (value.trim().length < 2) {
      setState(() {
        _cityResults = [];
        _isSearchingCity = false;
      });
      return;
    }
    setState(() => _isSearchingCity = true);
    _cityDebounce = Timer(const Duration(milliseconds: 300), () async {
      final results = await _searchCities(value);
      if (mounted) {
        setState(() {
          _cityResults = results;
          _isSearchingCity = false;
        });
      }
    });
  }

  void _selectCity(Map<String, dynamic> city) {
    HapticFeedback.selectionClick();
    ref.read(eventWizardProvider.notifier).setCity(
          city['id'] as String,
          city['name'] as String,
        );
    _cityController.clear();
    FocusScope.of(context).unfocus();
    setState(() => _cityResults = []);
  }

  // ── Capacity stepper ───────────────────────────────────────────

  void _incrementCapacity() {
    HapticFeedback.lightImpact();
    final current = ref.read(eventWizardProvider).capacity;
    ref.read(eventWizardProvider.notifier).setCapacity(current + 1);
  }

  void _decrementCapacity() {
    HapticFeedback.lightImpact();
    final current = ref.read(eventWizardProvider).capacity;
    if (current <= 1) return;
    ref.read(eventWizardProvider.notifier).setCapacity(current - 1);
  }

  // ── What to bring drawer ───────────────────────────────────────

  void _openWhatToBringDrawer() {
    final vertical = ref.read(wizardProvider).vertical;
    showAppBottomSheet<void>(
      context: context,
      title: 'What to bring',
      builder: (_) => _WhatToBringSheet(vertical: vertical),
    );
  }

  // ── Build ──────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final event = ref.watch(eventWizardProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          Text('Event Details', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            'When and where is it happening?',
            style: typ.AppTypography.body.copyWith(color: AppColors.muted),
          ),
          const SizedBox(height: Spacing.xl),

          // ── Date & Time ──────────────────────────────────────
          const _SectionLabel('Date & time'),
          const SizedBox(height: Spacing.sm),
          Row(
            children: [
              Expanded(
                child: _DateTimeButton(
                  label: 'Start',
                  value: event.startAt,
                  onTap: () => unawaited(_pickStartDateTime()),
                ),
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: _DateTimeButton(
                  label: 'End',
                  value: event.endAt,
                  onTap: event.startAt != null
                      ? () => unawaited(_pickEndTime())
                      : null,
                  enabled: event.startAt != null,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.xl),

          // ── Venue ─────────────────────────────────────────────
          AppInput(
            controller: _venueNameController,
            label: 'Venue name',
            hint: 'e.g. Hampi Boulders, Café Wanderlust',
            maxLength: 200,
            textInputAction: TextInputAction.next,
            onChanged: ref.read(eventWizardProvider.notifier).setVenueName,
          ),
          const SizedBox(height: Spacing.lg),
          AppInput(
            controller: _venueAddressController,
            label: 'Address',
            hint: 'Full address with landmark',
            maxLines: 2,
            maxLength: 500,
            onChanged:
                ref.read(eventWizardProvider.notifier).setVenueAddress,
          ),
          const SizedBox(height: Spacing.xl),

          // ── City ──────────────────────────────────────────────
          const _SectionLabel('City'),
          const SizedBox(height: Spacing.sm),

          if (event.cityId != null && event.cityName != null) ...[
            _CityChip(
              name: event.cityName!,
              onRemove: () {
                HapticFeedback.selectionClick();
                ref.read(eventWizardProvider.notifier).clearCity();
              },
            ),
          ] else ...[
            AppSearchInput(
              controller: _cityController,
              hint: 'Search for city...',
              onSearch: _onCitySearch,
            ),
            if (_isSearchingCity)
              const Padding(
                padding: EdgeInsets.only(top: Spacing.sm),
                child: SkeletonLoader(
                  child: Column(
                    children: [
                      _SkeletonCityRow(),
                      SizedBox(height: Spacing.sm),
                      _SkeletonCityRow(),
                    ],
                  ),
                ),
              ),
            if (!_isSearchingCity && _cityResults.isNotEmpty)
              _CityResultsList(
                results: _cityResults,
                onSelect: _selectCity,
              ),
          ],
          const SizedBox(height: Spacing.xl),

          // ── Capacity ──────────────────────────────────────────
          const _SectionLabel('Capacity'),
          const SizedBox(height: Spacing.sm),
          _CapacityStepper(
            count: event.capacity,
            onIncrement: _incrementCapacity,
            onDecrement: _decrementCapacity,
          ),
          const SizedBox(height: Spacing.xl),

          // ── What to bring ─────────────────────────────────────
          const _SectionLabel('What to bring'),
          const SizedBox(height: Spacing.sm),
          Text(
            'Help attendees come prepared',
            style:
                typ.AppTypography.bodySmall.copyWith(color: AppColors.muted),
          ),
          const SizedBox(height: Spacing.md),

          if (event.whatToBring.isNotEmpty) ...[
            Wrap(
              spacing: Spacing.sm,
              runSpacing: Spacing.sm,
              children: event.whatToBring
                  .map(
                    (item) => _ItemChip(
                      label: item,
                      onRemove: () {
                        HapticFeedback.selectionClick();
                        ref
                            .read(eventWizardProvider.notifier)
                            .removeItem(item);
                      },
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: Spacing.md),
          ],

          AppButton(
            label: 'Add suggestions',
            onPressed: _openWhatToBringDrawer,
            variant: AppButtonVariant.secondary,
            size: AppButtonSize.medium,
            leadingIcon: PhosphorIconsFill.plus,
          ),
          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

// ── Section Label ─────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: typ.AppTypography.bodySmall.copyWith(
        fontWeight: FontWeight.w600,
        color: AppColors.muted,
      ),
    );
  }
}

// ── Date/Time Button ──────────────────────────────────────────────

class _DateTimeButton extends StatelessWidget {
  final String label;
  final DateTime? value;
  final VoidCallback? onTap;
  final bool enabled;

  const _DateTimeButton({
    required this.label,
    required this.value,
    required this.onTap,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null;
    final dateStr =
        hasValue ? DateFormat('d MMM').format(value!) : label;
    final timeStr =
        hasValue ? DateFormat('h:mm a').format(value!) : '– –';

    return Opacity(
      opacity: enabled ? 1.0 : 0.4,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Spacing.lg,
            vertical: Spacing.md,
          ),
          decoration: BoxDecoration(
            color: hasValue ? AppColors.coralSurface : AppColors.sunken,
            borderRadius: BorderRadius.circular(Layout.inputRadius),
            border: Border.all(
              color: hasValue ? AppColors.coral : AppColors.border,
            ),
          ),
          child: Row(
            children: [
              Icon(
                PhosphorIconsFill.calendarBlank,
                size: 18,
                color: hasValue ? AppColors.coral : AppColors.softInk,
              ),
              const SizedBox(width: Spacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dateStr,
                      style: typ.AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: hasValue ? AppColors.ink : AppColors.muted,
                      ),
                    ),
                    Text(
                      timeStr,
                      style: typ.AppTypography.caption.copyWith(
                        color:
                            hasValue ? AppColors.muted : AppColors.softInk,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Capacity Stepper ──────────────────────────────────────────────

class _CapacityStepper extends StatelessWidget {
  final int count;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const _CapacityStepper({
    required this.count,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.inputRadius),
        border: Border.all(color: AppColors.border),
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
                color: count > 1 ? AppColors.white : AppColors.sunken,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: Icon(
                PhosphorIconsFill.minus,
                size: 18,
                color: count > 1 ? AppColors.ink : AppColors.softInk,
              ),
            ),
          ),
          Column(
            children: [
              Text('$count', style: typ.AppTypography.h2),
              Text('people', style: typ.AppTypography.caption),
            ],
          ),
          GestureDetector(
            onTap: count < 10000 ? onIncrement : null,
            behavior: HitTestBehavior.opaque,
            child: Container(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              decoration: BoxDecoration(
                color: count < 10000 ? AppColors.white : AppColors.sunken,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: Icon(
                PhosphorIconsFill.plus,
                size: 18,
                color: count < 10000 ? AppColors.ink : AppColors.softInk,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── City Chip ─────────────────────────────────────────────────────

class _CityChip extends StatelessWidget {
  final String name;
  final VoidCallback onRemove;

  const _CityChip({required this.name, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.coralSurface,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: AppColors.coral),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(PhosphorIconsFill.mapPin, size: 16, color: AppColors.coral),
          const SizedBox(width: Spacing.sm),
          Flexible(
            child: Text(
              name,
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: Spacing.sm),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(Spacing.xs),
              child: Icon(
                PhosphorIconsFill.xCircle,
                size: 18,
                color: AppColors.muted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Item Chip (what to bring) ─────────────────────────────────────

class _ItemChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;

  const _ItemChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(
            child: Text(
              label,
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.ink),
            ),
          ),
          const SizedBox(width: Spacing.sm),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(Spacing.xs),
              child: Icon(PhosphorIconsFill.x, size: 14, color: AppColors.muted),
            ),
          ),
        ],
      ),
    );
  }
}

// ── City Results List ─────────────────────────────────────────────

class _CityResultsList extends StatelessWidget {
  final List<Map<String, dynamic>> results;
  final ValueChanged<Map<String, dynamic>> onSelect;

  const _CityResultsList({required this.results, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: Spacing.xs),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      constraints: const BoxConstraints(maxHeight: 200),
      child: ListView.separated(
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        itemCount: results.length,
        separatorBuilder: (_, _) =>
            const Divider(color: AppColors.border, height: 1),
        itemBuilder: (context, index) {
          final city = results[index];
          final name = city['name'] as String? ?? '';
          final stateName = city['state'] as String? ?? '';
          return GestureDetector(
            onTap: () => onSelect(city),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.lg,
                vertical: Spacing.md,
              ),
              child: Row(
                children: [
                  const Icon(
                    PhosphorIconsFill.mapPin,
                    size: 18,
                    color: AppColors.coral,
                  ),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: typ.AppTypography.body),
                        if (stateName.isNotEmpty)
                          Text(stateName,
                              style: typ.AppTypography.caption),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Skeleton City Row ─────────────────────────────────────────────

class _SkeletonCityRow extends StatelessWidget {
  const _SkeletonCityRow();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: Spacing.xs),
      child: Row(
        children: [
          SkeletonRect(width: 18, height: 18, borderRadius: 4),
          SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 120, height: 14),
                SizedBox(height: Spacing.xs),
                SkeletonLine(width: 80, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── What To Bring Sheet ───────────────────────────────────────────

/// Bottom drawer showing category-relevant suggestions as checkboxes
/// plus a free-text input to add custom items.
class _WhatToBringSheet extends ConsumerStatefulWidget {
  final String vertical;
  const _WhatToBringSheet({required this.vertical});

  @override
  ConsumerState<_WhatToBringSheet> createState() =>
      _WhatToBringSheetState();
}

class _WhatToBringSheetState extends ConsumerState<_WhatToBringSheet> {
  final _customController = TextEditingController();

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  void _addCustomItem() {
    final text = _customController.text.trim();
    if (text.isEmpty) return;
    HapticFeedback.selectionClick();
    ref.read(eventWizardProvider.notifier).addCustomItem(text);
    _customController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final event = ref.watch(eventWizardProvider);
    final presets = kWhatToBringPresets[widget.vertical] ??
        kDefaultWhatToBringPresets;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Preset checkboxes
        Text(
          'Suggested for ${widget.vertical}',
          style: typ.AppTypography.bodySmall.copyWith(
            color: AppColors.muted,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: Spacing.sm),

        ...presets.map((item) {
          final checked = event.whatToBring.contains(item);
          return GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              ref
                  .read(eventWizardProvider.notifier)
                  .toggleWhatToBringItem(item);
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(vertical: Spacing.sm),
              child: Row(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color:
                          checked ? AppColors.coral : AppColors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: checked
                            ? AppColors.coral
                            : AppColors.border,
                        width: 1.5,
                      ),
                    ),
                    child: checked
                        ? const Icon(
                            Icons.check,
                            size: 14,
                            color: AppColors.white,
                          )
                        : null,
                  ),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: Text(item, style: typ.AppTypography.body),
                  ),
                ],
              ),
            ),
          );
        }),

        const SizedBox(height: Spacing.xl),
        const Divider(color: AppColors.border),
        const SizedBox(height: Spacing.lg),

        // Custom item input
        Text(
          'Add your own',
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.muted,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        Row(
          children: [
            Expanded(
              child: AppInput(
                controller: _customController,
                hint: 'e.g. Binoculars',
                textInputAction: TextInputAction.done,
                maxLength: 200,
                onSubmitted: (_) => _addCustomItem(),
              ),
            ),
            const SizedBox(width: Spacing.sm),
            GestureDetector(
              onTap: _addCustomItem,
              child: Container(
                width: Layout.minTapTarget,
                height: Layout.minTapTarget,
                decoration: BoxDecoration(
                  color: AppColors.coral,
                  borderRadius: BorderRadius.circular(Layout.inputRadius),
                ),
                child: const Icon(
                  PhosphorIconsFill.plus,
                  size: 20,
                  color: AppColors.white,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: Spacing.lg),

        // Done button
        AppButton(
          label: 'Done',
          onPressed: () => Navigator.of(context).pop(),
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
          fullWidth: true,
        ),
      ],
    );
  }
}
