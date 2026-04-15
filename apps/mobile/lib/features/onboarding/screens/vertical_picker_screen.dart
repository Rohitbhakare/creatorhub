import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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

/// Per-vertical accent color from prototype (DD-013).
const Map<String, Color> _verticalAccentColors = {
  'travel': Color(0xFFB8860B),
  'food': Color(0xFF5A7247),
  'fitness': Color(0xFF7C5CBF),
  'stories': Color(0xFFE15A41),
  'photography': Color(0xFF3B7DD8),
  'wellness': Color(0xFF2D8F6F),
  'music': Color(0xFF8B4F8B),
  'education': Color(0xFF888888),
};

const Map<String, IconData> _verticalIcons = {
  'travel': PhosphorIconsFill.mountains,
  'stories': PhosphorIconsFill.bookOpen,
  'food': PhosphorIconsFill.forkKnife,
  'fitness': PhosphorIconsFill.barbell,
  'education': PhosphorIconsFill.graduationCap,
  'photography': PhosphorIconsFill.camera,
  'music': PhosphorIconsFill.musicNotes,
  'wellness': PhosphorIconsFill.sun,
};

/// Vertical data model for the picker.
class _Vertical {
  final String slug;
  final String name;
  final int creatorCount;

  const _Vertical({
    required this.slug,
    required this.name,
    required this.creatorCount,
  });

  factory _Vertical.fromJson(Map<String, dynamic> json) {
    return _Vertical(
      slug: (json['slug'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      creatorCount: (json['creator_count'] as num?)?.toInt() ?? 0,
    );
  }

  Color get accentColor =>
      _verticalAccentColors[slug.toLowerCase()] ?? AppColors.muted;

  IconData get icon =>
      _verticalIcons[slug.toLowerCase()] ?? PhosphorIconsFill.sparkle;
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
  final Set<String> _selectedSlugs = {};

  static const int _minRequired = 3;
  static const double _gridGap = 10;

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

  void _toggleVertical(String slug) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selectedSlugs.contains(slug)) {
        _selectedSlugs.remove(slug);
      } else {
        _selectedSlugs.add(slug);
      }
    });
  }

  Future<void> _onContinue() async {
    if (_selectedSlugs.length < _minRequired) return;

    setState(() => _isSaving = true);

    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put(
        '/api/v1/onboarding/verticals',
        data: {'verticals': _selectedSlugs.toList()},
      );

      if (mounted) {
        ref
            .read(onboardingProvider.notifier)
            .setVerticals(_selectedSlugs.toList());
        ref.read(onboardingProvider.notifier).advanceStep();
        context.go('/onboarding/creators');
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

  @override
  Widget build(BuildContext context) {
    final canContinue = _selectedSlugs.length >= _minRequired;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Layout.screenPaddingH,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const OnboardingProgressBar(currentStep: 2, totalSteps: 4),
              const SizedBox(height: Spacing.xl),

              // Title
              Text('What are you into?', style: typ.AppTypography.h2),
              const SizedBox(height: Spacing.xs),

              // Subtitle with dynamic count
              Text(
                canContinue
                    ? '${_selectedSlugs.length} picked \u2014 looking good!'
                    : 'Pick at least $_minRequired to shape your feed.',
                style: typ.AppTypography.bodySmall.copyWith(
                  color: canContinue ? AppColors.success : AppColors.muted,
                  fontWeight: canContinue ? FontWeight.w500 : FontWeight.w400,
                ),
              ),
              const SizedBox(height: Spacing.lg),

              // Grid — fills remaining space, no scrolling
              Expanded(child: _buildContent()),

              const SizedBox(height: Spacing.md),

              // Continue button
              AppButton(
                label: 'Continue',
                onPressed: canContinue ? _onContinue : null,
                variant: AppButtonVariant.primary,
                size: AppButtonSize.large,
                fullWidth: true,
                isLoading: _isSaving,
              ),
              const SizedBox(height: Spacing.md),
            ],
          ),
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

    // Build 4 rows x 2 columns, each row Expanded to fill space equally
    final rows = <Widget>[];
    for (int row = 0; row < (_verticals.length / 2).ceil(); row++) {
      final leftIndex = row * 2;
      final rightIndex = row * 2 + 1;

      rows.add(
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              bottom: row < (_verticals.length / 2).ceil() - 1 ? _gridGap : 0,
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildTile(_verticals[leftIndex]),
                ),
                const SizedBox(width: _gridGap),
                Expanded(
                  child: rightIndex < _verticals.length
                      ? _buildTile(_verticals[rightIndex])
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(children: rows);
  }

  Widget _buildTile(_Vertical vertical) {
    final isSelected = _selectedSlugs.contains(vertical.slug);
    return _VerticalTile(
      vertical: vertical,
      isSelected: isSelected,
      onTap: () => _toggleVertical(vertical.slug),
    );
  }

  Widget _buildSkeletonGrid() {
    final rows = <Widget>[];
    for (int row = 0; row < 4; row++) {
      rows.add(
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: row < 3 ? _gridGap : 0),
            child: Row(
              children: [
                const Expanded(
                  child: SkeletonRect(
                    height: double.infinity,
                    borderRadius: Layout.cardRadius,
                  ),
                ),
                const SizedBox(width: _gridGap),
                const Expanded(
                  child: SkeletonRect(
                    height: double.infinity,
                    borderRadius: Layout.cardRadius,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return SkeletonLoader(child: Column(children: rows));
  }
}

/// Individual vertical tile — centered icon + name + count.
/// Selected state: coral border + offset shadow. No checkmark.
class _VerticalTile extends StatelessWidget {
  final _Vertical vertical;
  final bool isSelected;
  final VoidCallback onTap;

  const _VerticalTile({
    required this.vertical,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = vertical.accentColor;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.coral : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.coral.withValues(alpha: 0.12),
                    offset: const Offset(3, 3),
                    blurRadius: 0,
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon in tinted container
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                vertical.icon,
                size: 22,
                color: color,
              ),
            ),
            const SizedBox(height: Spacing.sm),

            // Name
            Text(
              vertical.name,
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                fontFamily: 'Fraunces',
                color: AppColors.ink,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 1),

            // Creator count
            Text(
              vertical.creatorCount > 0
                  ? '${vertical.creatorCount} creators'
                  : 'Coming soon',
              style: typ.AppTypography.caption.copyWith(
                color: AppColors.softInk,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
