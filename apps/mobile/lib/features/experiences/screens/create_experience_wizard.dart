import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/button.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../../content/widgets/discoverability_block.dart';
import '../../itineraries/providers/itinerary_wizard_provider.dart'
    show SpotState;
import '../../itineraries/widgets/spot_editor_sheet.dart';
import '../../itineraries/widgets/spot_list_tile.dart';
import '../../itineraries/widgets/spot_picker_sheet.dart';
import '../providers/experience_provider.dart';

/// Multi-step wizard for creating a scheduled experience (6 steps).
///
/// Step 1: Basics (title, description, vertical)
/// Step 2: Cover + Pricing (cover image, price)
/// Step 3: Dates (add date ranges with capacity)
/// Step 4: Meeting Point (public area, lat/lng, private address)
/// Step 5: Day Plan (day-by-day spot builder — placeholder for now)
/// Step 6: Publish (summary + T&C + publish)
class CreateExperienceWizard extends ConsumerStatefulWidget {
  const CreateExperienceWizard({super.key});

  @override
  ConsumerState<CreateExperienceWizard> createState() =>
      _CreateExperienceWizardState();
}

class _CreateExperienceWizardState
    extends ConsumerState<CreateExperienceWizard> {
  int _currentStep = 1;
  static const int _totalSteps = 6;

  static const List<String> _stepNames = [
    'Basics',
    'Cover & Pricing',
    'Dates',
    'Meeting Point',
    'Day Plan',
    'Publish',
  ];

  bool _isCreatingDraft = false;

  @override
  void initState() {
    super.initState();
    // Reset state for a fresh wizard session
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(createExperienceProvider.notifier).reset();
    });
  }

  Future<void> _ensureDraftExists() async {
    if (_isCreatingDraft) return;
    final state = ref.read(createExperienceProvider);
    if (state.contentId != null) return;

    _isCreatingDraft = true;
    await ref.read(createExperienceProvider.notifier).createDraft();
    _isCreatingDraft = false;
  }

  Future<void> _onNext() async {
    unawaited(HapticFeedback.lightImpact());

    if (_currentStep == 1) {
      // Create draft on first "Save & Continue"
      await _ensureDraftExists();
    } else if (_currentStep == 2) {
      // Save basic fields
      await ref.read(createExperienceProvider.notifier).updateField();
    } else if (_currentStep == 4) {
      // Save meeting point
      final mp = ref.read(createExperienceProvider).meetingPoint;
      if (mp != null) {
        await ref
            .read(createExperienceProvider.notifier)
            .saveMeetingPoint(mp);
      }
    }

    if (_currentStep < _totalSteps) {
      setState(() => _currentStep++);
    }
  }

  void _onBack() {
    HapticFeedback.lightImpact();
    if (_currentStep == 1) {
      _showDiscardDialog();
    } else {
      setState(() => _currentStep--);
    }
  }

  Future<void> _onPublish() async {
    unawaited(HapticFeedback.lightImpact());
    final state = ref.read(createExperienceProvider);
    if (!state.tncAccepted) return;

    final success =
        await ref.read(createExperienceProvider.notifier).publishExperience();
    if (success && mounted) {
      context.go('/home');
    } else if (mounted) {
      final error = ref.read(createExperienceProvider).saveError;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            error ?? 'Failed to publish. Please try again.',
            style: typ.AppTypography.bodySmall
                .copyWith(color: AppColors.surface),
          ),
          backgroundColor: AppColors.danger,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Layout.cardRadius),
          ),
        ),
      );
    }
  }

  void _showDiscardDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
        title: Text('Discard experience?', style: typ.AppTypography.h3),
        content: Text(
          'Your unsaved changes will be lost.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.of(ctx).pop();
            },
            child: Text(
              'Keep editing',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.of(ctx).pop();
              context.pop();
            },
            child: Text(
              'Discard',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.danger,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createExperienceProvider);
    final isLastStep = _currentStep == _totalSteps;
    final canAdvance = _stepCanAdvance(state);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: Spacing.sm),

            // ── Top bar ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Layout.screenPaddingH,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: _onBack,
                    behavior: HitTestBehavior.opaque,
                    child: const SizedBox(
                      width: Layout.minTapTarget,
                      height: Layout.minTapTarget,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Icon(
                          PhosphorIconsFill.x,
                          size: 24,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                  ),
                  if (state.isSaving)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 1.5,
                            color: AppColors.inkSoft,
                          ),
                        ),
                        const SizedBox(width: Spacing.xs),
                        Text('Saving…', style: typ.AppTypography.caption),
                      ],
                    )
                  else if (state.saveError != null)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          PhosphorIconsFill.warningCircle,
                          size: 14,
                          color: AppColors.danger,
                        ),
                        const SizedBox(width: Spacing.xs),
                        Text(
                          'Save failed',
                          style: typ.AppTypography.caption
                              .copyWith(color: AppColors.danger),
                        ),
                      ],
                    )
                  else
                    const SizedBox.shrink(),
                ],
              ),
            ),

            // ── Step indicator ──────────────────────────────────
            _WizardStepIndicator(
              currentStep: _currentStep,
              totalSteps: _totalSteps,
              stepName: _stepNames[_currentStep - 1],
            ),
            const SizedBox(height: Spacing.sm),

            // ── Step content ────────────────────────────────────
            Expanded(child: _buildStep(state)),

            // ── Bottom nav bar ──────────────────────────────────
            _BottomNavBar(
              currentStep: _currentStep,
              totalSteps: _totalSteps,
              canAdvance: canAdvance,
              isLastStep: isLastStep,
              isSaving: state.isSaving,
              onBack: _onBack,
              onNext: isLastStep ? _onPublish : _onNext,
            ),
          ],
        ),
      ),
    );
  }

  bool _stepCanAdvance(CreateExperienceState state) {
    return switch (_currentStep) {
      1 => state.title.trim().length >= 5,
      2 => true,
      3 => true,
      4 => state.meetingPoint?.publicAreaName.isNotEmpty ?? false,
      5 => true,
      6 => state.tncAccepted,
      _ => false,
    };
  }

  Widget _buildStep(CreateExperienceState state) {
    return switch (_currentStep) {
      1 => _BasicsStep(state: state),
      2 => _CoverPricingStep(state: state),
      3 => _DatesStep(state: state),
      4 => _MeetingPointStep(state: state),
      5 => _DayPlanStep(state: state),
      6 => _PublishStep(state: state, onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }
}

// ── Step Indicator ─────────────────────────────────────────────────

class _WizardStepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final String stepName;

  const _WizardStepIndicator({
    required this.currentStep,
    required this.totalSteps,
    required this.stepName,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: currentStep / totalSteps,
              backgroundColor: AppColors.surfaceAlt,
              color: AppColors.ink,
              minHeight: 3,
            ),
          ),
          const SizedBox(height: Spacing.xs),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                stepName,
                style: typ.AppTypography.label,
              ),
              Text(
                'Step $currentStep of $totalSteps',
                style: typ.AppTypography.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Step 1: Basics ─────────────────────────────────────────────────

class _BasicsStep extends ConsumerWidget {
  final CreateExperienceState state;

  const _BasicsStep({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(createExperienceProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.lg),
          Text('Experience Basics', style: typ.AppTypography.h2),
          const SizedBox(height: Spacing.xs),
          Text(
            'Tell travellers what your experience is about.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xxl),

          // Title
          Text('Title', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.sm),
          _StyledTextField(
            initialValue: state.title,
            hintText: 'e.g. Sunrise Trek to Triund',
            maxLength: 100,
            onChanged: notifier.setTitle,
          ),
          const SizedBox(height: Spacing.xl),

          // Description
          Text('Description', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.xs),
          Text(
            'Describe what travellers will experience (max 2000 characters).',
            style: typ.AppTypography.caption,
          ),
          const SizedBox(height: Spacing.sm),
          _StyledTextField(
            initialValue: state.description,
            hintText: 'Share the story behind your experience…',
            maxLength: 2000,
            maxLines: 6,
            onChanged: notifier.setDescription,
          ),
          const SizedBox(height: Spacing.xl),

          // Vertical selector
          Text('Vertical', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.sm),
          Row(
            children: [
              _VerticalChip(
                label: 'Travel',
                icon: PhosphorIconsFill.mountains,
                isSelected: state.vertical == 'travel',
                onTap: () {
                  HapticFeedback.selectionClick();
                  notifier.setVertical('travel');
                },
              ),
              const SizedBox(width: Spacing.sm),
              _VerticalChip(
                label: 'Stories',
                icon: PhosphorIconsFill.bookOpen,
                isSelected: state.vertical == 'stories',
                onTap: () {
                  HapticFeedback.selectionClick();
                  notifier.setVertical('stories');
                },
              ),
            ],
          ),

          // ── Discoverability (PR 2 — facets) ────────────────
          const SizedBox(height: Spacing.xxl),
          DiscoverabilityBlock(
            season: state.season,
            tripStyle: state.tripStyle,
            audience: state.audience,
            contentLabel: 'experience',
            onSeasonChanged: notifier.setSeason,
            onTripStyleChanged: notifier.setTripStyle,
            onAudienceChanged: notifier.setAudience,
          ),
          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

// ── Step 2: Cover + Pricing ────────────────────────────────────────

class _CoverPricingStep extends ConsumerWidget {
  final CreateExperienceState state;

  const _CoverPricingStep({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(createExperienceProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.lg),
          Text('Cover & Pricing', style: typ.AppTypography.h2),
          const SizedBox(height: Spacing.xs),
          Text(
            'Add a cover image and set your price.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xxl),

          // Cover image placeholder
          Text('Cover Image', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.sm),
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              // TODO: implement image picker + Firebase Storage upload (E2.x media)
            },
            child: Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(Layout.cardRadius),
                border: Border.all(
                  color: AppColors.hairline,
                  style: BorderStyle.solid,
                ),
              ),
              child: state.coverImageUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(Layout.cardRadius),
                      child: Image.network(
                        state.coverImageUrl!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: 200,
                      ),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          PhosphorIconsFill.imageSquare,
                          size: 40,
                          color: AppColors.inkMuted,
                        ),
                        const SizedBox(height: Spacing.md),
                        Text(
                          'Tap to add cover image',
                          style: typ.AppTypography.body
                              .copyWith(color: AppColors.inkSoft),
                        ),
                        const SizedBox(height: Spacing.xs),
                        Text(
                          'Recommended: 1200×600px',
                          style: typ.AppTypography.caption,
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: Spacing.xl),

          // Price
          Text('Price (optional)', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.xs),
          Text(
            '₹0 = Free experience. Enter amount in rupees.',
            style: typ.AppTypography.caption,
          ),
          const SizedBox(height: Spacing.sm),
          _PriceField(
            initialPaisa: state.pricePaisa,
            onChanged: (rupees) => notifier.setPriceRupees(rupees),
          ),
          const SizedBox(height: Spacing.xl),

          // Location
          Text('Location name', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.xs),
          Text(
            'City or region where the experience takes place.',
            style: typ.AppTypography.caption,
          ),
          const SizedBox(height: Spacing.sm),
          _StyledTextField(
            initialValue: state.locationName ?? '',
            hintText: 'e.g. Manali, Himachal Pradesh',
            onChanged: notifier.setLocationName,
          ),
          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

// ── Step 3: Dates ──────────────────────────────────────────────────

class _DatesStep extends ConsumerStatefulWidget {
  final CreateExperienceState state;

  const _DatesStep({required this.state});

  @override
  ConsumerState<_DatesStep> createState() => _DatesStepState();
}

class _DatesStepState extends ConsumerState<_DatesStep> {
  final TextEditingController _capacityController = TextEditingController(text: '10');

  @override
  void dispose() {
    _capacityController.dispose();
    super.dispose();
  }

  Future<void> _addDate() async {
    unawaited(HapticFeedback.lightImpact());
    final contentId = ref.read(createExperienceProvider).contentId;

    // Pick date range
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: AppColors.colorScheme,
        ),
        child: child!,
      ),
    );

    if (range == null || !mounted) return;

    // Get capacity
    final capacityStr = _capacityController.text.trim();
    final capacity = int.tryParse(capacityStr) ?? 10;

    final startDate =
        '${range.start.year}-${range.start.month.toString().padLeft(2, '0')}-${range.start.day.toString().padLeft(2, '0')}';
    final endDate =
        '${range.end.year}-${range.end.month.toString().padLeft(2, '0')}-${range.end.day.toString().padLeft(2, '0')}';

    if (contentId != null) {
      // Save to API
      await ref.read(createExperienceProvider.notifier).addDateApi(
            startDate: startDate,
            endDate: endDate,
            capacity: capacity,
          );
    } else {
      // Add locally (draft not yet created)
      ref.read(createExperienceProvider.notifier).addDate(
            ScheduledDate(
              id: 'local_${DateTime.now().millisecondsSinceEpoch}',
              startDate: startDate,
              endDate: endDate,
              capacity: capacity,
              spotsBooked: 0,
              isActive: true,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createExperienceProvider);
    final dates = state.dates;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Spacing.lg),
              Text('Available Dates', style: typ.AppTypography.h2),
              const SizedBox(height: Spacing.xs),
              Text(
                'Add the dates when you\'ll run this experience.',
                style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
              ),
              const SizedBox(height: Spacing.xl),

              // Capacity input
              Text('Default capacity per date', style: typ.AppTypography.h4),
              const SizedBox(height: Spacing.sm),
              SizedBox(
                width: 140,
                child: _StyledTextField(
                  controller: _capacityController,
                  hintText: '10',
                  keyboardType: TextInputType.number,
                  onChanged: (_) {},
                ),
              ),
              const SizedBox(height: Spacing.xl),
            ],
          ),
        ),

        // Date list
        Expanded(
          child: dates.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        PhosphorIconsFill.calendarPlus,
                        size: 40,
                        color: AppColors.inkMuted,
                      ),
                      const SizedBox(height: Spacing.lg),
                      Text(
                        'No dates added yet',
                        style: typ.AppTypography.h4,
                      ),
                      const SizedBox(height: Spacing.xs),
                      Text(
                        'Add your first available date',
                        style: typ.AppTypography.body
                            .copyWith(color: AppColors.inkSoft),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Layout.screenPaddingH,
                  ),
                  itemCount: dates.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: Spacing.sm),
                  itemBuilder: (context, index) {
                    final date = dates[index];
                    return _DateListTile(
                      date: date,
                      onRemove: () {
                        HapticFeedback.lightImpact();
                        ref
                            .read(createExperienceProvider.notifier)
                            .removeDate(date.id);
                      },
                    );
                  },
                ),
        ),

        // Add date button
        Padding(
          padding: const EdgeInsets.all(Layout.screenPaddingH),
          child: AppButton(
            label: 'Add Another Date',
            onPressed: _addDate,
            variant: AppButtonVariant.secondary,
            size: AppButtonSize.large,
            fullWidth: true,
            leadingIcon: PhosphorIconsFill.plus,
          ),
        ),
      ],
    );
  }
}

class _DateListTile extends StatelessWidget {
  final ScheduledDate date;
  final VoidCallback onRemove;

  const _DateListTile({required this.date, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        children: [
          const Icon(
            PhosphorIconsFill.calendarBlank,
            size: 20,
            color: AppColors.inkSoft,
          ),
          const SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${date.startDate} → ${date.endDate}',
                  style: typ.AppTypography.body
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${date.capacity} spots',
                  style:
                      typ.AppTypography.caption.copyWith(color: AppColors.inkSoft),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: const SizedBox(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              child: Center(
                child: Icon(
                  PhosphorIconsFill.x,
                  size: 18,
                  color: AppColors.inkSoft,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 4: Meeting Point ──────────────────────────────────────────

class _MeetingPointStep extends ConsumerStatefulWidget {
  final CreateExperienceState state;

  const _MeetingPointStep({required this.state});

  @override
  ConsumerState<_MeetingPointStep> createState() => _MeetingPointStepState();
}

class _MeetingPointStepState extends ConsumerState<_MeetingPointStep> {
  late TextEditingController _publicAreaController;
  late TextEditingController _latController;
  late TextEditingController _lngController;
  late TextEditingController _privateAddressController;
  bool _fetchingLocation = false;

  @override
  void initState() {
    super.initState();
    final mp = widget.state.meetingPoint;
    _publicAreaController =
        TextEditingController(text: mp?.publicAreaName ?? '');
    _latController = TextEditingController(
      text: mp?.lat?.toString() ?? '',
    );
    _lngController = TextEditingController(
      text: mp?.lng?.toString() ?? '',
    );
    _privateAddressController =
        TextEditingController(text: mp?.privateExactName ?? '');
  }

  @override
  void dispose() {
    _publicAreaController.dispose();
    _latController.dispose();
    _lngController.dispose();
    _privateAddressController.dispose();
    super.dispose();
  }

  void _syncToProvider() {
    final lat = double.tryParse(_latController.text.trim());
    final lng = double.tryParse(_lngController.text.trim());
    ref.read(createExperienceProvider.notifier).setMeetingPoint(
          MeetingPointInfo(
            publicAreaName: _publicAreaController.text.trim(),
            lat: lat,
            lng: lng,
            privateExactName: _privateAddressController.text.trim().isNotEmpty
                ? _privateAddressController.text.trim()
                : null,
          ),
        );
  }

  Future<void> _useMyLocation() async {
    unawaited(HapticFeedback.lightImpact());
    setState(() => _fetchingLocation = true);

    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission denied.')),
          );
        }
        return;
      }

      final pos = await Geolocator.getCurrentPosition();
      _latController.text = pos.latitude.toStringAsFixed(6);
      _lngController.text = pos.longitude.toStringAsFixed(6);
      _syncToProvider();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not get location.')),
        );
      }
    } finally {
      if (mounted) setState(() => _fetchingLocation = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.lg),
          Text('Meeting Point', style: typ.AppTypography.h2),
          const SizedBox(height: Spacing.xs),
          Text(
            'Share where travellers should meet you.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xxl),

          // Public area name (always shown)
          Text('Public area name *', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.xs),
          Text(
            'This is visible to everyone before booking.',
            style: typ.AppTypography.caption,
          ),
          const SizedBox(height: Spacing.sm),
          _StyledTextField(
            controller: _publicAreaController,
            hintText: 'e.g. Old Manali market area',
            onChanged: (_) => _syncToProvider(),
          ),
          const SizedBox(height: Spacing.xl),

          // Lat / Lng
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Latitude', style: typ.AppTypography.h4),
                    const SizedBox(height: Spacing.sm),
                    _StyledTextField(
                      controller: _latController,
                      hintText: '32.2396',
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                        signed: true,
                      ),
                      onChanged: (_) => _syncToProvider(),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Longitude', style: typ.AppTypography.h4),
                    const SizedBox(height: Spacing.sm),
                    _StyledTextField(
                      controller: _lngController,
                      hintText: '77.1897',
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                        signed: true,
                      ),
                      onChanged: (_) => _syncToProvider(),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.md),

          // Use my location
          AppButton(
            label: _fetchingLocation ? 'Getting location…' : 'Use My Location',
            onPressed: _fetchingLocation ? null : _useMyLocation,
            variant: AppButtonVariant.secondary,
            size: AppButtonSize.medium,
            leadingIcon: PhosphorIconsFill.navigationArrow,
          ),
          const SizedBox(height: Spacing.xl),

          // Private exact address (optional — revealed T-24h)
          Text('Exact address (optional)', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.xs),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.md,
              vertical: Spacing.sm,
            ),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(
                  PhosphorIconsFill.lock,
                  size: 14,
                  color: AppColors.inkSoft,
                ),
                const SizedBox(width: Spacing.xs),
                Flexible(
                  child: Text(
                    'Revealed to booked travellers 24h before start',
                    style: typ.AppTypography.caption,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.sm),
          _StyledTextField(
            controller: _privateAddressController,
            hintText: 'Full address with landmark',
            maxLines: 2,
            onChanged: (_) => _syncToProvider(),
          ),
          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

// ── Step 5: Day Plan ───────────────────────────────────────────────

class _DayPlanStep extends ConsumerStatefulWidget {
  final CreateExperienceState state;

  const _DayPlanStep({required this.state});

  @override
  ConsumerState<_DayPlanStep> createState() => _DayPlanStepState();
}

class _DayPlanStepState extends ConsumerState<_DayPlanStep> {
  static const int _maxDays = 30;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final s = ref.read(createExperienceProvider);
      if (s.contentId != null && s.days.isEmpty) {
        ref.read(createExperienceProvider.notifier).setDayCount(1);
      }
    });
  }

  Future<void> _onAddSpot() async {
    unawaited(HapticFeedback.lightImpact());

    final placeResult = await showModalBottomSheet<PlaceResult>(
      context: context,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight:
            MediaQuery.of(context).size.height * Layout.sheetMaxHeightFactor,
      ),
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
      ),
      builder: (context) => const SpotPickerSheet(),
    );

    if (placeResult == null || !mounted) return;

    final spotState = await showModalBottomSheet<SpotState>(
      context: context,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight:
            MediaQuery.of(context).size.height * Layout.sheetMaxHeightFactor,
      ),
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
      ),
      builder: (context) => SpotEditorSheet(place: placeResult),
    );

    if (spotState == null || !mounted) return;

    final dayIndex = ref.read(createExperienceProvider).selectedDayIndex;
    final ok = await ref
        .read(createExperienceProvider.notifier)
        .addSpotApi(dayIndex, spotState);
    if (!ok && mounted) {
      _showError('Couldn\u2019t add spot. Please try again.');
    }
  }

  Future<void> _changeDayCount(int delta) async {
    unawaited(HapticFeedback.lightImpact());
    final s = ref.read(createExperienceProvider);
    final next = s.dayCount + delta;
    if (next < 1 || next > _maxDays) return;
    final ok =
        await ref.read(createExperienceProvider.notifier).setDayCount(next);
    if (!ok && mounted) {
      _showError('Couldn\u2019t update day count.');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          msg,
          style:
              typ.AppTypography.bodySmall.copyWith(color: AppColors.surface),
        ),
        backgroundColor: AppColors.danger,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(createExperienceProvider);

    if (s.contentId == null) {
      return const EmptyState(
        icon: PhosphorIconsFill.mapTrifold,
        title: 'Save basics first',
        description:
            'Complete Step 1 to create the draft before building the day plan.',
      );
    }

    if (s.days.isEmpty) {
      return const Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.inkSoft,
          ),
        ),
      );
    }

    final selectedIndex = s.selectedDayIndex.clamp(0, s.days.length - 1);
    final selectedDay = s.days[selectedIndex];

    return Stack(
      children: [
        Column(
          children: [
            const SizedBox(height: Spacing.sm),

            // ── Day count control ─────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Layout.screenPaddingH,
              ),
              child: _DayCountRow(
                dayCount: s.dayCount,
                maxDays: _maxDays,
                isBusy: s.isSaving,
                onDecrement:
                    s.dayCount > 1 ? () => _changeDayCount(-1) : null,
                onIncrement: s.dayCount < _maxDays
                    ? () => _changeDayCount(1)
                    : null,
              ),
            ),
            const SizedBox(height: Spacing.md),

            // ── Day tabs ──────────────────────────────────────
            SizedBox(
              height: Layout.minTapTarget,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                ),
                itemCount: s.days.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(width: Spacing.sm),
                itemBuilder: (context, index) {
                  final isSelected = index == selectedIndex;
                  return _ExpDayTab(
                    label: 'Day ${index + 1}',
                    isSelected: isSelected,
                    spotCount: s.days[index].spots.length,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      ref
                          .read(createExperienceProvider.notifier)
                          .selectDay(index);
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: Spacing.sm),

            // ── Day summary ───────────────────────────────────
            if (selectedDay.spots.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                ),
                child: _ExpDaySummaryBar(day: selectedDay),
              ),
            if (selectedDay.spots.isNotEmpty)
              const SizedBox(height: Spacing.sm),

            // ── Spot list ─────────────────────────────────────
            Expanded(
              child: selectedDay.spots.isEmpty
                  ? EmptyState(
                      icon: PhosphorIconsFill.mapPinPlus,
                      title: 'Add your first spot',
                      description:
                          'Tap the + button to search for places to visit on Day ${selectedIndex + 1}',
                      ctaLabel: 'Add Spot',
                      onCtaPressed: _onAddSpot,
                    )
                  : ReorderableListView.builder(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Layout.screenPaddingH,
                        vertical: Spacing.sm,
                      ),
                      itemCount: selectedDay.spots.length,
                      onReorder: (oldIndex, newIndex) {
                        HapticFeedback.mediumImpact();
                        ref
                            .read(createExperienceProvider.notifier)
                            .reorderSpotsApi(
                              selectedIndex,
                              oldIndex,
                              newIndex,
                            );
                      },
                      proxyDecorator: (child, index, animation) {
                        return AnimatedBuilder(
                          animation: animation,
                          builder: (context, child) {
                            final v =
                                Curves.easeInOut.transform(animation.value);
                            final elevation = 1 + 6 * v;
                            return Material(
                              elevation: elevation,
                              color: Colors.transparent,
                              borderRadius:
                                  BorderRadius.circular(Layout.cardRadius),
                              child: child,
                            );
                          },
                          child: child,
                        );
                      },
                      itemBuilder: (context, index) {
                        final spot = selectedDay.spots[index];
                        return Padding(
                          key: ValueKey(
                            'exp_${selectedIndex}_${index}_${spot.id ?? spot.name}',
                          ),
                          padding:
                              const EdgeInsets.only(bottom: Spacing.sm),
                          child: SpotListTile(
                            spot: spot,
                            index: index,
                            onRemove: () {
                              ref
                                  .read(createExperienceProvider.notifier)
                                  .removeSpotApi(selectedIndex, index);
                            },
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),

        // ── FAB ─────────────────────────────────────────────
        if (selectedDay.spots.isNotEmpty)
          Positioned(
            bottom: Spacing.xl,
            right: Layout.screenPaddingH,
            child: GestureDetector(
              onTap: _onAddSpot,
              child: Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(
                  color: AppColors.coral,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x33000000),
                      blurRadius: 8,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  PhosphorIconsFill.plus,
                  size: 24,
                  color: AppColors.surface,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// ── Day Count Row ────────────────────────────────────────────────

class _DayCountRow extends StatelessWidget {
  final int dayCount;
  final int maxDays;
  final bool isBusy;
  final VoidCallback? onDecrement;
  final VoidCallback? onIncrement;

  const _DayCountRow({
    required this.dayCount,
    required this.maxDays,
    required this.isBusy,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Number of days', style: typ.AppTypography.h4),
              const SizedBox(height: Spacing.xs),
              Text(
                '1 to $maxDays days',
                style: typ.AppTypography.caption,
              ),
            ],
          ),
        ),
        _StepperButton(
          icon: PhosphorIconsFill.minus,
          onPressed: isBusy ? null : onDecrement,
        ),
        SizedBox(
          width: 48,
          child: Center(
            child: Text(
              '$dayCount',
              style: typ.AppTypography.h3,
            ),
          ),
        ),
        _StepperButton(
          icon: PhosphorIconsFill.plus,
          onPressed: isBusy ? null : onIncrement,
        ),
      ],
    );
  }
}

class _StepperButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;

  const _StepperButton({required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return GestureDetector(
      onTap: onPressed,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: Layout.minTapTarget,
        height: Layout.minTapTarget,
        decoration: BoxDecoration(
          color: enabled ? AppColors.surface : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Icon(
          icon,
          size: 18,
          color: enabled ? AppColors.ink : AppColors.inkMuted,
        ),
      ),
    );
  }
}

// ── Experience Day Tab ───────────────────────────────────────────

class _ExpDayTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final int spotCount;
  final VoidCallback onTap;

  const _ExpDayTab({
    required this.label,
    required this.isSelected,
    required this.spotCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: const BoxConstraints(minWidth: Layout.minTapTarget),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.ink : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.hairline,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.surface : AppColors.ink,
              ),
            ),
            if (spotCount > 0) ...[
              const SizedBox(width: Spacing.xs),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 6,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.surface.withValues(alpha: 0.2)
                      : AppColors.hairline,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$spotCount',
                  style: typ.AppTypography.label.copyWith(
                    color: isSelected ? AppColors.surface : AppColors.inkSoft,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Experience Day Summary ───────────────────────────────────────

class _ExpDaySummaryBar extends StatelessWidget {
  final ExperienceDayDraft day;

  const _ExpDaySummaryBar({required this.day});

  @override
  Widget build(BuildContext context) {
    final spotCount = day.spots.length;
    final totalMinutes = day.totalDurationMinutes;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
      ),
      child: Row(
        children: [
          const Icon(
            PhosphorIconsFill.path,
            size: 16,
            color: AppColors.inkSoft,
          ),
          const SizedBox(width: Spacing.sm),
          Text(
            '$spotCount ${spotCount == 1 ? 'spot' : 'spots'}',
            style: typ.AppTypography.bodySmall
                .copyWith(fontWeight: FontWeight.w600),
          ),
          if (totalMinutes > 0) ...[
            const SizedBox(width: Spacing.sm),
            Text('\u00B7', style: typ.AppTypography.caption),
            const SizedBox(width: Spacing.sm),
            Text(
              formatDuration(totalMinutes),
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.inkSoft),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Step 6: Publish ────────────────────────────────────────────────

class _PublishStep extends ConsumerWidget {
  final CreateExperienceState state;
  final VoidCallback onPublish;

  const _PublishStep({required this.state, required this.onPublish});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(createExperienceProvider.notifier);
    final isFree = state.pricePaisa <= 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.lg),
          Text('Ready to Publish?', style: typ.AppTypography.h2),
          const SizedBox(height: Spacing.xs),
          Text(
            'Review your experience before going live.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),

          // Summary card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(Layout.cardPadding),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SummaryRow(
                  label: 'Title',
                  value: state.title.isNotEmpty ? state.title : '(not set)',
                ),
                const SizedBox(height: Spacing.md),
                _SummaryRow(
                  label: 'Price',
                  value: isFree
                      ? 'FREE'
                      : '${formatPrice(state.pricePaisa)}/person',
                ),
                const SizedBox(height: Spacing.md),
                _SummaryRow(
                  label: 'Dates',
                  value: state.dates.isEmpty
                      ? 'None added'
                      : '${state.dates.length} date(s)',
                ),
                const SizedBox(height: Spacing.md),
                _SummaryRow(
                  label: 'Meeting point',
                  value: state.meetingPoint?.publicAreaName ?? '(not set)',
                ),
                if (state.locationName != null &&
                    state.locationName!.isNotEmpty) ...[
                  const SizedBox(height: Spacing.md),
                  _SummaryRow(
                    label: 'Location',
                    value: state.locationName!,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: Spacing.xl),

          // KYC warning for paid experiences
          if (!isFree)
            Container(
              padding: const EdgeInsets.all(Spacing.md),
              decoration: BoxDecoration(
                color: AppColors.warningSurface,
                borderRadius: BorderRadius.circular(Layout.cardRadius),
                border: Border.all(color: AppColors.warning),
              ),
              child: Row(
                children: [
                  const Icon(
                    PhosphorIconsFill.warningCircle,
                    size: 18,
                    color: AppColors.warning,
                  ),
                  const SizedBox(width: Spacing.sm),
                  Flexible(
                    child: Text(
                      'KYC verification is required to publish paid experiences.',
                      style: typ.AppTypography.bodySmall.copyWith(
                        color: AppColors.warning,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          if (!isFree) const SizedBox(height: Spacing.xl),

          // T&C checkbox
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              notifier.setTncAccepted(!state.tncAccepted);
            },
            behavior: HitTestBehavior.opaque,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: Layout.minTapTarget,
                  height: Layout.minTapTarget,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 120),
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: state.tncAccepted
                            ? AppColors.ink
                            : AppColors.bg,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: state.tncAccepted
                              ? AppColors.ink
                              : AppColors.hairlineStrong,
                          width: 1.5,
                        ),
                      ),
                      child: state.tncAccepted
                          ? const Icon(
                              PhosphorIconsFill.check,
                              size: 14,
                              color: AppColors.surface,
                            )
                          : null,
                    ),
                  ),
                ),
                const SizedBox(width: Spacing.sm),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      'I agree to the CreatorHub Terms & Conditions for experience creators.',
                      style: typ.AppTypography.bodySmall
                          .copyWith(color: AppColors.inkSoft),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 110,
          child: Text(
            label,
            style: typ.AppTypography.bodySmall
                .copyWith(color: AppColors.inkSoft),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: typ.AppTypography.bodySmall
                .copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

// ── Bottom Nav Bar ─────────────────────────────────────────────────

class _BottomNavBar extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final bool canAdvance;
  final bool isLastStep;
  final bool isSaving;
  final VoidCallback onBack;
  final VoidCallback onNext;

  const _BottomNavBar({
    required this.currentStep,
    required this.totalSteps,
    required this.canAdvance,
    required this.isLastStep,
    required this.isSaving,
    required this.onBack,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.md,
      ),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.hairline, width: 1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: AppButton(
              label: currentStep == 1 ? 'Cancel' : 'Back',
              onPressed: onBack,
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.large,
              fullWidth: true,
              leadingIcon:
                  currentStep > 1 ? PhosphorIconsFill.arrowLeft : null,
            ),
          ),
          const SizedBox(width: Spacing.md),
          Expanded(
            child: AppButton(
              label: isLastStep ? 'Publish' : 'Save & Continue',
              onPressed: canAdvance && !isSaving ? onNext : null,
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              fullWidth: true,
              isLoading: isSaving,
              trailingIcon: isLastStep
                  ? PhosphorIconsFill.rocketLaunch
                  : PhosphorIconsFill.arrowRight,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared Input Widgets ───────────────────────────────────────────

class _StyledTextField extends StatefulWidget {
  final String? initialValue;
  final TextEditingController? controller;
  final String hintText;
  final int? maxLength;
  final int maxLines;
  final TextInputType keyboardType;
  final void Function(String) onChanged;

  const _StyledTextField({
    this.initialValue,
    this.controller,
    required this.hintText,
    this.maxLength,
    this.maxLines = 1,
    this.keyboardType = TextInputType.text,
    required this.onChanged,
  });

  @override
  State<_StyledTextField> createState() => _StyledTextFieldState();
}

class _StyledTextFieldState extends State<_StyledTextField> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ??
        TextEditingController(text: widget.initialValue ?? '');
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      maxLines: widget.maxLines,
      maxLength: widget.maxLength,
      keyboardType: widget.keyboardType,
      onChanged: widget.onChanged,
      style: typ.AppTypography.body,
      decoration: InputDecoration(
        hintText: widget.hintText,
        hintStyle: typ.AppTypography.body.copyWith(color: AppColors.inkMuted),
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.ink, width: 1.5),
        ),
        counterStyle: typ.AppTypography.caption,
      ),
    );
  }
}

class _VerticalChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _VerticalChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        constraints: const BoxConstraints(minHeight: Layout.minTapTarget),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.ink : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.hairline,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppColors.surface : AppColors.ink,
            ),
            const SizedBox(width: Spacing.sm),
            Text(
              label,
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.surface : AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PriceField extends StatefulWidget {
  final int initialPaisa;
  final void Function(double rupees) onChanged;

  const _PriceField({required this.initialPaisa, required this.onChanged});

  @override
  State<_PriceField> createState() => _PriceFieldState();
}

class _PriceFieldState extends State<_PriceField> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final rupees = widget.initialPaisa / 100;
    _controller = TextEditingController(
      text: rupees > 0 ? rupees.toStringAsFixed(0) : '',
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: false),
      onChanged: (v) {
        final d = double.tryParse(v) ?? 0;
        widget.onChanged(d);
      },
      style: typ.AppTypography.body,
      decoration: InputDecoration(
        hintText: '0',
        hintStyle: typ.AppTypography.body.copyWith(color: AppColors.inkMuted),
        prefixText: '₹ ',
        prefixStyle: typ.AppTypography.body.copyWith(
          fontWeight: FontWeight.w600,
        ),
        suffixText: 'per person',
        suffixStyle: typ.AppTypography.caption,
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.ink, width: 1.5),
        ),
      ),
    );
  }
}
