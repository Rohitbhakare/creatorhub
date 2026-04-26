import 'dart:async';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart'
    show PhosphorIconsFill, PhosphorIconsRegular;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/input.dart';
import '../../../shared/utils/firebase_storage.dart';
import '../../../shared/utils/toast.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/itinerary_wizard_provider.dart';
import 'spot_picker_sheet.dart';

/// Bottom sheet for configuring a spot after selection from Places API.
///
/// Lets the user upload a custom cover photo, add creator note,
/// duration, and stop type.
/// Returns a [SpotState] when the user confirms.
class SpotEditorSheet extends ConsumerStatefulWidget {
  final PlaceResult place;

  const SpotEditorSheet({
    super.key,
    required this.place,
  });

  @override
  ConsumerState<SpotEditorSheet> createState() => _SpotEditorSheetState();
}

class _SpotEditorSheetState extends ConsumerState<SpotEditorSheet> {
  final _noteController = TextEditingController();
  final _customDurationController = TextEditingController();

  StopType _stopType = StopType.regular;
  int? _durationMinutes;
  bool _showCustomDuration = false;

  /// Creator-uploaded cover override. When non-null, takes precedence
  /// over the Google Places photo for this spot's thumbnail.
  String? _coverUrl;
  bool _uploadingCover = false;

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

  /// Open the system image picker, upload to Firebase Storage at
  /// `itinerary_spots/{userId}/{tempId}/{microsTimestamp}.{ext}`, and
  /// set [_coverUrl] to the returned download URL.
  Future<void> _onPickCover() async {
    unawaited(HapticFeedback.lightImpact());

    final XFile? picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
    );
    if (picked == null || !mounted) return;

    setState(() => _uploadingCover = true);

    try {
      final auth = ref.read(authProvider);
      final userId = auth.user?['id'] as String? ?? 'anonymous';

      // The spot doesn't have a server id yet (created on Add Spot).
      // Use a fresh micros timestamp as the temp folder; the full path
      // is unique per upload regardless.
      final stamp = DateTime.now().microsecondsSinceEpoch;
      final ext = picked.path.split('.').last.toLowerCase();
      final path = 'itinerary_spots/$userId/$stamp/$stamp.$ext';

      final url = await uploadFile(File(picked.path), path);
      if (!mounted) return;
      setState(() {
        _coverUrl = url;
        _uploadingCover = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _uploadingCover = false);
      showAppToast(context, 'Cover upload failed. Try again.');
    }
  }

  void _onResetCover() {
    HapticFeedback.lightImpact();
    setState(() => _coverUrl = null);
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
      coverUrl: _coverUrl,
      creatorNote: _noteController.text.trim().isEmpty
          ? null
          : _noteController.text.trim(),
      durationMinutes: finalDuration,
      stopType: _stopType,
    );

    Navigator.of(context).pop(spot);
  }

  /// Resolve the URL shown in the cover preview, in priority order:
  /// 1. creator-uploaded override → 2. Places photo → 3. null (placeholder).
  String? get _previewUrl => _coverUrl ?? widget.place.photoUrl;

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
                      color: AppColors.hairlineStrong.withValues(alpha: 0.3),
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
                          color: AppColors.surfaceAlt,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 18,
                          color: AppColors.inkSoft,
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
                    color: AppColors.surfaceAlt,
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

              // Cover photo (DD-032). Sits ABOVE the stop-type chips so
              // creators see the visual override first.
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
                child: _CoverPhotoSection(
                  previewUrl: _previewUrl,
                  hasOverride: _coverUrl != null,
                  isUploading: _uploadingCover,
                  onPick: _onPickCover,
                  onReset: _onResetCover,
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
                        color: AppColors.inkSoft,
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
                        color: AppColors.inkSoft,
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

/// Cover photo picker section.
///
/// Shows a 16:9 tap target with the resolved preview URL. When a creator
/// override is set, also shows a "Reset to default" text button.
class _CoverPhotoSection extends StatelessWidget {
  final String? previewUrl;
  final bool hasOverride;
  final bool isUploading;
  final VoidCallback onPick;
  final VoidCallback onReset;

  const _CoverPhotoSection({
    required this.previewUrl,
    required this.hasOverride,
    required this.isUploading,
    required this.onPick,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Cover photo',
          style: typ.AppTypography.label.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.sm),
        GestureDetector(
          onTap: isUploading ? null : onPick,
          behavior: HitTestBehavior.opaque,
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (previewUrl != null)
                    CachedNetworkImage(
                      imageUrl: previewUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(
                        color: AppColors.shimmerBase,
                      ),
                      errorWidget: (_, _, _) => _CoverPlaceholder(),
                    )
                  else
                    _CoverPlaceholder(),
                  // Tap overlay with camera icon
                  Container(
                    color: Colors.black.withValues(alpha: 0.18),
                    alignment: Alignment.center,
                    child: isUploading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.surface,
                            ),
                          )
                        : Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: Spacing.md,
                              vertical: Spacing.sm,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.surface.withValues(alpha: 0.92),
                              borderRadius: BorderRadius.circular(
                                Layout.chipRadius,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  PhosphorIconsRegular.camera,
                                  size: 16,
                                  color: AppColors.ink,
                                ),
                                const SizedBox(width: Spacing.xs),
                                Text(
                                  hasOverride
                                      ? 'Change cover'
                                      : 'Upload cover',
                                  style: typ.AppTypography.bodySmall.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.ink,
                                  ),
                                ),
                              ],
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (hasOverride) ...[
          const SizedBox(height: Spacing.sm),
          GestureDetector(
            onTap: onReset,
            behavior: HitTestBehavior.opaque,
            child: Text(
              'Reset to default',
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _CoverPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceAlt,
      child: const Center(
        child: Icon(
          PhosphorIconsFill.image,
          size: 32,
          color: AppColors.inkMuted,
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
          color: isSelected ? AppColors.ink : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.hairline,
          ),
        ),
        child: Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: isSelected ? AppColors.surface : AppColors.ink,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

/// Stop type chip — monochrome (DD-024).
///
/// Per the 5-coral rule, only `StopType.overnight` carries the coral
/// accent (signaling an overnight stay, which is one of the 5 critical
/// signals). Every other stop type renders monochrome (ink + surface);
/// the icon shape carries the differentiation.
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
    final isOvernight = type == StopType.overnight;

    // Compute color tokens. Overnight = coral accent. Others = monochrome.
    final Color bg;
    final Color fg;
    final Color borderColor;

    if (isOvernight) {
      if (isSelected) {
        bg = AppColors.coral;
        fg = AppColors.surface;
        borderColor = AppColors.coral;
      } else {
        bg = AppColors.coral.withValues(alpha: 0.12);
        fg = AppColors.coral;
        borderColor = AppColors.coral;
      }
    } else {
      if (isSelected) {
        bg = AppColors.ink;
        fg = AppColors.surface;
        borderColor = AppColors.ink;
      } else {
        bg = AppColors.surface;
        fg = AppColors.ink;
        borderColor = AppColors.hairline;
      }
    }

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
          color: bg,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _stopTypeChipIcon(type),
              size: 16,
              color: fg,
            ),
            const SizedBox(width: Spacing.xs),
            Text(
              type.label,
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: fg,
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
      color: AppColors.surfaceAlt,
      child: const Center(
        child: Icon(
          PhosphorIconsFill.mapPin,
          size: 24,
          color: AppColors.inkMuted,
        ),
      ),
    );
  }
}

/// Phosphor icon shapes per stop type — these are the differentiating
/// signal now that the chip background is monochrome.
IconData _stopTypeChipIcon(StopType type) {
  return switch (type) {
    StopType.regular => PhosphorIconsFill.circle,
    StopType.overnight => PhosphorIconsFill.moon,
    StopType.meal => PhosphorIconsFill.forkKnife,
    StopType.viewpoint => PhosphorIconsFill.mountains,
    StopType.activity => PhosphorIconsFill.lightning,
  };
}
