import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/input.dart';
import '../providers/itinerary_wizard_provider.dart';
import 'spot_picker_sheet.dart';

/// Bottom sheet for configuring a spot after selection from Places API.
///
/// Lets the user add creator note, duration, and stop type.
/// Returns a [SpotState] when the user confirms.
class SpotEditorSheet extends StatefulWidget {
  final PlaceResult place;

  const SpotEditorSheet({
    super.key,
    required this.place,
  });

  @override
  State<SpotEditorSheet> createState() => _SpotEditorSheetState();
}

class _SpotEditorSheetState extends State<SpotEditorSheet> {
  final _noteController = TextEditingController();
  final _customDurationController = TextEditingController();

  StopType _stopType = StopType.regular;
  int? _durationMinutes;
  bool _showCustomDuration = false;

  static const _durationOptions = [
    (label: '15 min', minutes: 15),
    (label: '30 min', minutes: 30),
    (label: '1h', minutes: 60),
    (label: '2h', minutes: 120),
    (label: '4h', minutes: 240),
    (label: '8h', minutes: 480),
  ];

  @override
  void dispose() {
    _noteController.dispose();
    _customDurationController.dispose();
    super.dispose();
  }

  void _selectDuration(int minutes) {
    HapticFeedback.selectionClick();
    setState(() {
      _durationMinutes = minutes;
      _showCustomDuration = false;
    });
  }

  void _showCustomInput() {
    HapticFeedback.selectionClick();
    setState(() {
      _showCustomDuration = true;
      _durationMinutes = null;
    });
  }

  void _selectStopType(StopType type) {
    HapticFeedback.selectionClick();
    setState(() {
      _stopType = type;
    });
  }

  void _onAddSpot() {
    HapticFeedback.lightImpact();

    // Parse custom duration if active
    int? finalDuration = _durationMinutes;
    if (_showCustomDuration) {
      final customValue = int.tryParse(_customDurationController.text);
      if (customValue != null && customValue > 0) {
        finalDuration = customValue;
      }
    }

    final spot = SpotState(
      name: widget.place.name,
      googlePlaceId: widget.place.placeId,
      lat: widget.place.lat ?? 0,
      lng: widget.place.lng ?? 0,
      thumbnailUrl: widget.place.photoUrl,
      creatorNote: _noteController.text.trim().isEmpty
          ? null
          : _noteController.text.trim(),
      durationMinutes: finalDuration,
      stopType: _stopType,
    );

    Navigator.of(context).pop(spot);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 240),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: Spacing.lg),
                  child: Container(
                    width: Layout.sheetHandleWidth,
                    height: Layout.sheetHandleHeight,
                    decoration: BoxDecoration(
                      color: AppColors.line.withValues(alpha: 0.3),
                      borderRadius:
                          BorderRadius.circular(Layout.sheetHandleHeight / 2),
                    ),
                  ),
                ),
              ),

              // Title bar
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  Spacing.xl, Spacing.lg, Spacing.lg, Spacing.sm,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child:
                          Text('Configure spot', style: typ.AppTypography.h4),
                    ),
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).pop();
                      },
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          color: AppColors.sunken,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 18,
                          color: AppColors.muted,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Place info card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
                child: Container(
                  padding: const EdgeInsets.all(Spacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.sunken,
                    borderRadius: BorderRadius.circular(Layout.cardRadius),
                  ),
                  child: Row(
                    children: [
                      // Thumbnail
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: SizedBox(
                          width: 56,
                          height: 56,
                          child: widget.place.photoUrl != null
                              ? CachedNetworkImage(
                                  imageUrl: widget.place.photoUrl!,
                                  fit: BoxFit.cover,
                                  placeholder: (_, _) => Container(
                                    color: AppColors.shimmerBase,
                                  ),
                                  errorWidget: (_, _, _) =>
                                      _PlaceholderIcon(),
                                )
                              : _PlaceholderIcon(),
                        ),
                      ),
                      const SizedBox(width: Spacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.place.name,
                              style: typ.AppTypography.body.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (widget.place.secondaryText.isNotEmpty) ...[
                              const SizedBox(height: Spacing.xs),
                              Text(
                                widget.place.secondaryText,
                                style: typ.AppTypography.caption,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: Spacing.xl),

              // Creator note
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
                child: AppInput(
                  controller: _noteController,
                  label: 'Creator note (optional)',
                  hint: 'Tips, best time to visit, what to look for...',
                  maxLines: 3,
                  maxLength: 500,
                  textInputAction: TextInputAction.newline,
                  keyboardType: TextInputType.multiline,
                ),
              ),
              const SizedBox(height: Spacing.xl),

              // Duration picker
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Duration',
                      style: typ.AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.muted,
                      ),
                    ),
                    const SizedBox(height: Spacing.sm),
                    Wrap(
                      spacing: Spacing.sm,
                      runSpacing: Spacing.sm,
                      children: [
                        for (final option in _durationOptions)
                          _DurationChip(
                            label: option.label,
                            isSelected: !_showCustomDuration &&
                                _durationMinutes == option.minutes,
                            onTap: () => _selectDuration(option.minutes),
                          ),
                        _DurationChip(
                          label: 'Custom',
                          isSelected: _showCustomDuration,
                          onTap: _showCustomInput,
                        ),
                      ],
                    ),
                    if (_showCustomDuration) ...[
                      const SizedBox(height: Spacing.md),
                      SizedBox(
                        width: 120,
                        child: AppInput(
                          controller: _customDurationController,
                          hint: 'Minutes',
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: Spacing.xl),

              // Stop type selector
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Stop type',
                      style: typ.AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.muted,
                      ),
                    ),
                    const SizedBox(height: Spacing.sm),
                    Wrap(
                      spacing: Spacing.sm,
                      runSpacing: Spacing.sm,
                      children: [
                        for (final type in StopType.values)
                          _StopTypeChip(
                            type: type,
                            isSelected: _stopType == type,
                            onTap: () => _selectStopType(type),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Spacing.xl),

              // Add spot button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
                child: AppButton(
                  label: 'Add Spot',
                  onPressed: _onAddSpot,
                  variant: AppButtonVariant.primary,
                  size: AppButtonSize.large,
                  fullWidth: true,
                ),
              ),
              const SizedBox(height: Spacing.xl),
            ],
          ),
        ),
      ),
    );
  }
}

/// Duration chip.
class _DurationChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _DurationChip({
    required this.label,
    required this.isSelected,
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
          horizontal: Spacing.md,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.ink : AppColors.sunken,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: isSelected ? AppColors.white : AppColors.ink,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

/// Stop type chip with icon.
class _StopTypeChip extends StatelessWidget {
  final StopType type;
  final bool isSelected;
  final VoidCallback onTap;

  const _StopTypeChip({
    required this.type,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = _stopTypeChipColor(type);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: const BoxConstraints(minWidth: Layout.minTapTarget),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.md,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.15) : AppColors.sunken,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? color : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _stopTypeChipIcon(type),
              size: 16,
              color: isSelected ? color : AppColors.muted,
            ),
            const SizedBox(width: Spacing.xs),
            Text(
              type.label,
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? color : AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Placeholder icon widget for places without a photo.
class _PlaceholderIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.sunken,
      child: const Center(
        child: Icon(
          PhosphorIconsFill.mapPin,
          size: 24,
          color: AppColors.softInk,
        ),
      ),
    );
  }
}

Color _stopTypeChipColor(StopType type) {
  return switch (type) {
    StopType.regular => AppColors.info,
    StopType.overnight => AppColors.coral,
    StopType.meal => AppColors.warning,
    StopType.viewpoint => AppColors.success,
    StopType.activity => const Color(0xFF7B61FF),
  };
}

IconData _stopTypeChipIcon(StopType type) {
  return switch (type) {
    StopType.regular => PhosphorIconsFill.mapPin,
    StopType.overnight => PhosphorIconsFill.bed,
    StopType.meal => PhosphorIconsFill.forkKnife,
    StopType.viewpoint => PhosphorIconsFill.binoculars,
    StopType.activity => PhosphorIconsFill.mountains,
  };
}
