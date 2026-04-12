import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/onboarding_provider.dart';
import '../components/onboarding_progress_bar.dart';
import '../../auth/providers/auth_provider.dart';

/// Vertical data model for the picker.
class _Vertical {
  final String id;
  final String name;
  final int creatorCount;

  const _Vertical({
    required this.id,
    required this.name,
    required this.creatorCount,
  });

  factory _Vertical.fromJson(Map<String, dynamic> json) {
    return _Vertical(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      creatorCount: json['creator_count'] as int? ?? 0,
    );
  }
}

/// Vertical interests picker screen (ONB-FR-003).
/// Step 2 of the onboarding flow. User picks at least 3 interest verticals.
class VerticalPickerScreen extends ConsumerStatefulWidget {
  const VerticalPickerScreen({super.key});

  @override
  ConsumerState<VerticalPickerScreen> createState() =>
      _VerticalPickerScreenState();
}

class _VerticalPickerScreenState extends ConsumerState<VerticalPickerScreen> {
  List<_Vertical> _verticals = [];
  bool _isLoading = true;
  String? _loadError;
  bool _isSaving = false;
  final Set<String> _selectedIds = {};

  static const int _minRequired = 3;

  /// Map vertical slugs/names to Phosphor icons.
  static final Map<String, IconData> _verticalIcons = {
    'travel': PhosphorIconsFill.mountains,
    'stories': PhosphorIconsFill.bookOpen,
    'food': PhosphorIconsFill.forkKnife,
    'fitness': PhosphorIconsFill.barbell,
    'education': PhosphorIconsFill.graduationCap,
    'photography': PhosphorIconsFill.camera,
    'music': PhosphorIconsFill.musicNotes,
    'wellness': PhosphorIconsFill.sun,
  };

  @override
  void initState() {
    super.initState();
    _fetchVerticals();
  }

  Future<void> _fetchVerticals() async {
    setState(() {
      _isLoading = true;
      _loadError = null;
    });

    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get('/api/v1/verticals');

      final responseData = response.data as Map<String, dynamic>;
      final data = (responseData['data'] as List<dynamic>)
          .cast<Map<String, dynamic>>();

      if (mounted) {
        setState(() {
          _verticals = data.map(_Vertical.fromJson).toList();
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _loadError =
              e.response?.statusMessage ?? 'Failed to load interests';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _loadError = 'Something went wrong. Tap to retry.';
        });
      }
    }
  }

  void _toggleVertical(String id) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  Future<void> _onContinue() async {
    if (_selectedIds.length < _minRequired) return;

    setState(() => _isSaving = true);

    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put(
        '/api/v1/onboarding/verticals',
        data: {'vertical_ids': _selectedIds.toList()},
      );

      if (mounted) {
        ref
            .read(onboardingProvider.notifier)
            .setVerticals(_selectedIds.toList());
        ref.read(onboardingProvider.notifier).advanceStep();
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.response?.statusMessage ??
                  'Failed to save interests. Try again.',
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.white),
            ),
            backgroundColor: AppColors.danger,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Layout.cardRadius),
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Something went wrong. Try again.',
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.white),
            ),
            backgroundColor: AppColors.danger,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Layout.cardRadius),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  IconData _iconForVertical(String name) {
    final key = name.toLowerCase().trim();
    return _verticalIcons[key] ?? PhosphorIconsFill.sparkle;
  }

  @override
  Widget build(BuildContext context) {
    final canContinue = _selectedIds.length >= _minRequired;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress bar
            const OnboardingProgressBar(currentStep: 2, totalSteps: 4),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: Spacing.xxl),

                    // Title
                    Text(
                      'What interests you?',
                      style: typ.AppTypography.h2,
                    ),
                    const SizedBox(height: Spacing.sm),

                    // Subtitle / helper text
                    Text(
                      canContinue
                          ? '${_selectedIds.length} selected'
                          : 'Pick at least $_minRequired to personalize your feed',
                      style: typ.AppTypography.body.copyWith(
                        color:
                            canContinue ? AppColors.success : AppColors.muted,
                        fontWeight:
                            canContinue ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                    const SizedBox(height: Spacing.xl),

                    // Grid content
                    Expanded(child: _buildContent()),
                  ],
                ),
              ),
            ),

            // Continue button
            Padding(
              padding: const EdgeInsets.all(Layout.screenPaddingH),
              child: AppButton(
                label: 'Continue',
                onPressed: canContinue ? _onContinue : null,
                variant: AppButtonVariant.primary,
                size: AppButtonSize.large,
                fullWidth: true,
                isLoading: _isSaving,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return _buildSkeletonGrid();
    }

    if (_loadError != null) {
      return Center(
        child: GestureDetector(
          onTap: _fetchVerticals,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                PhosphorIconsFill.warningCircle,
                size: 48,
                color: AppColors.softInk,
              ),
              const SizedBox(height: Spacing.md),
              Text(
                _loadError!,
                style: typ.AppTypography.body.copyWith(
                  color: AppColors.muted,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Spacing.sm),
              Text(
                'Tap to retry',
                style: typ.AppTypography.bodySmall.copyWith(
                  color: AppColors.coral,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: Spacing.md,
      crossAxisSpacing: Spacing.md,
      childAspectRatio: 1.3,
      children: _verticals.map((vertical) {
        final isSelected = _selectedIds.contains(vertical.id);
        return _VerticalTile(
          vertical: vertical,
          icon: _iconForVertical(vertical.name),
          isSelected: isSelected,
          onTap: () => _toggleVertical(vertical.id),
        );
      }).toList(),
    );
  }

  Widget _buildSkeletonGrid() {
    return SkeletonLoader(
      child: GridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: Spacing.md,
        crossAxisSpacing: Spacing.md,
        childAspectRatio: 1.3,
        physics: const NeverScrollableScrollPhysics(),
        children: List.generate(
          8,
          (_) => const SkeletonRect(
            height: double.infinity,
            borderRadius: Layout.cardRadius,
          ),
        ),
      ),
    );
  }
}

/// Individual vertical tile widget.
class _VerticalTile extends StatelessWidget {
  final _Vertical vertical;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _VerticalTile({
    required this.vertical,
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
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          color: isSelected ? AppColors.coralSurface : AppColors.sunken,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: isSelected ? AppColors.coral : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        padding: const EdgeInsets.all(Layout.cardPaddingCompact),
        child: Stack(
          children: [
            // Content
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 28,
                  color: isSelected ? AppColors.coral : AppColors.ink,
                ),
                const SizedBox(height: Spacing.sm),
                Text(
                  vertical.name,
                  style: typ.AppTypography.h4.copyWith(
                    color: isSelected ? AppColors.coral : AppColors.ink,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: Spacing.xs),
                Text(
                  vertical.creatorCount > 0
                      ? '${vertical.creatorCount} creators'
                      : 'Coming soon',
                  style: typ.AppTypography.caption.copyWith(
                    color: AppColors.softInk,
                  ),
                ),
              ],
            ),

            // Checkmark overlay (top-right)
            if (isSelected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: const BoxDecoration(
                    color: AppColors.coral,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    PhosphorIconsFill.check,
                    size: 14,
                    color: AppColors.white,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
