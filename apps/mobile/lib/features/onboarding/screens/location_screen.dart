import 'dart:async';

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
import '../../../shared/components/input.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/onboarding_provider.dart';
import '../components/onboarding_progress_bar.dart';
import '../../auth/providers/auth_provider.dart';

/// Location capture screen (ONB-FR-002).
/// Step 1 of the onboarding flow. Lets user search for and select their city.
class LocationScreen extends ConsumerStatefulWidget {
  const LocationScreen({super.key});

  @override
  ConsumerState<LocationScreen> createState() => _LocationScreenState();
}

class _LocationScreenState extends ConsumerState<LocationScreen> {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();

  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  String? _searchError;
  bool _isSaving = false;
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _searchCities(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
        _searchError = null;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _searchError = null;
    });

    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get(
        '/api/v1/cities',
        queryParameters: {'q': query.trim(), 'limit': 10},
      );

      final responseData = response.data as Map<String, dynamic>;
      final cities = (responseData['data'] as List<dynamic>)
          .cast<Map<String, dynamic>>();

      if (mounted) {
        setState(() {
          _searchResults = cities;
          _isSearching = false;
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _isSearching = false;
          _searchError = e.response?.statusMessage ?? 'Failed to search cities';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isSearching = false;
          _searchError = 'Something went wrong. Try again.';
        });
      }
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _searchCities(value);
    });
  }

  void _selectCity(Map<String, dynamic> city) {
    HapticFeedback.selectionClick();
    final id = city['id'] as String;
    final name = city['name'] as String;
    ref.read(onboardingProvider.notifier).setCity(id, name);

    // Clear search state
    _searchController.clear();
    _searchFocusNode.unfocus();
    setState(() {
      _searchResults = [];
      _searchError = null;
    });
  }

  void _clearSelection() {
    HapticFeedback.selectionClick();
    ref.read(onboardingProvider.notifier).setCity('', '');
  }

  void _onUseMyLocation() {
    HapticFeedback.lightImpact();
    // GPS feature not available yet — focus search instead
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'GPS feature coming soon. Search for your city below.',
          style: typ.AppTypography.bodySmall.copyWith(color: AppColors.surface),
        ),
        backgroundColor: AppColors.ink,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
    _searchFocusNode.requestFocus();
  }

  Future<void> _onContinue() async {
    final onboarding = ref.read(onboardingProvider);
    final cityId = onboarding.selectedCityId;
    if (cityId == null || cityId.isEmpty) return;

    setState(() => _isSaving = true);

    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put(
        '/api/v1/onboarding/city',
        data: {'city_id': cityId},
      );

      if (mounted) {
        ref.read(onboardingProvider.notifier).advanceStep();
        context.go('/onboarding/verticals');
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.response?.statusMessage ?? 'Failed to save city. Try again.',
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
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Something went wrong. Try again.',
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
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final onboarding = ref.watch(onboardingProvider);
    final cityId = onboarding.selectedCityId;
    final hasCity = cityId != null && cityId.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress bar
            const OnboardingProgressBar(currentStep: 1, totalSteps: 4),

            // Scrollable content
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
                      'Where are you based?',
                      style: typ.AppTypography.h2,
                    ),
                    const SizedBox(height: Spacing.sm),
                    Text(
                      'We\'ll show you experiences and creators nearby',
                      style: typ.AppTypography.body.copyWith(
                        color: AppColors.inkSoft,
                      ),
                    ),
                    const SizedBox(height: Spacing.xl),

                    // Use my location button
                    GestureDetector(
                      onTap: _onUseMyLocation,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: Spacing.lg,
                          vertical: Spacing.md,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceAlt,
                          borderRadius:
                              BorderRadius.circular(Layout.inputRadius),
                          border: Border.all(color: AppColors.hairline),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              PhosphorIconsFill.navigationArrow,
                              size: 20,
                              color: AppColors.coral,
                            ),
                            const SizedBox(width: Spacing.md),
                            Text(
                              'Use my location',
                              style: typ.AppTypography.body.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: Spacing.lg),

                    // Divider with "or"
                    Row(
                      children: [
                        const Expanded(
                          child: Divider(color: AppColors.hairline),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: Spacing.md,
                          ),
                          child: Text(
                            'or search',
                            style: typ.AppTypography.caption,
                          ),
                        ),
                        const Expanded(
                          child: Divider(color: AppColors.hairline),
                        ),
                      ],
                    ),
                    const SizedBox(height: Spacing.lg),

                    // Selected city chip (shown when city is selected)
                    if (hasCity) ...[
                      _SelectedCityChip(
                        cityName: onboarding.selectedCityName ?? '',
                        onClear: _clearSelection,
                      ),
                      const SizedBox(height: Spacing.lg),
                    ],

                    // Search input (hidden when city is selected)
                    if (!hasCity) ...[
                      AppSearchInput(
                        controller: _searchController,
                        hint: 'Search for your city...',
                        onSearch: _onSearchChanged,
                      ),
                      const SizedBox(height: Spacing.sm),
                    ],

                    // Search results / loading / error
                    if (!hasCity)
                      Expanded(child: _buildSearchResults())
                    else
                      const Spacer(),
                  ],
                ),
              ),
            ),

            // Continue button
            Padding(
              padding: const EdgeInsets.all(Layout.screenPaddingH),
              child: AppButton(
                label: 'Continue',
                onPressed: hasCity ? _onContinue : null,
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

  Widget _buildSearchResults() {
    if (_isSearching) {
      return SkeletonLoader(
        child: ListView.separated(
          padding: const EdgeInsets.only(top: Spacing.sm),
          itemCount: 5,
          separatorBuilder: (_, _) => const SizedBox(height: Spacing.md),
          itemBuilder: (_, _) => const _SkeletonCityRow(),
        ),
      );
    }

    if (_searchError != null) {
      return Padding(
        padding: const EdgeInsets.only(top: Spacing.lg),
        child: Text(
          _searchError!,
          style: typ.AppTypography.bodySmall.copyWith(
            color: AppColors.danger,
          ),
        ),
      );
    }

    if (_searchResults.isEmpty && _searchController.text.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.only(top: Spacing.xxl),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                PhosphorIconsFill.mapPinArea,
                size: 48,
                color: AppColors.inkMuted,
              ),
              const SizedBox(height: Spacing.md),
              Text(
                'No cities found',
                style: typ.AppTypography.h4,
              ),
              const SizedBox(height: Spacing.xs),
              Text(
                'Try a different spelling or search term',
                style: typ.AppTypography.bodySmall.copyWith(
                  color: AppColors.inkSoft,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_searchResults.isEmpty) {
      return const SizedBox.shrink();
    }

    return ListView.separated(
      padding: const EdgeInsets.only(top: Spacing.sm),
      itemCount: _searchResults.length,
      separatorBuilder: (_, _) =>
          const Divider(color: AppColors.hairline, height: 1),
      itemBuilder: (context, index) {
        final city = _searchResults[index];
        return _CityResultTile(
          city: city,
          onTap: () => _selectCity(city),
        );
      },
    );
  }
}

/// Selected city chip with clear button.
class _SelectedCityChip extends StatelessWidget {
  final String cityName;
  final VoidCallback onClear;

  const _SelectedCityChip({
    required this.cityName,
    required this.onClear,
  });

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
          const Icon(
            PhosphorIconsFill.mapPin,
            size: 16,
            color: AppColors.coral,
          ),
          const SizedBox(width: Spacing.sm),
          Flexible(
            child: Text(
              cityName,
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: Spacing.sm),
          GestureDetector(
            onTap: onClear,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(Spacing.xs),
              child: Icon(
                PhosphorIconsFill.xCircle,
                size: 18,
                color: AppColors.inkSoft,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Individual city search result tile.
class _CityResultTile extends StatelessWidget {
  final Map<String, dynamic> city;
  final VoidCallback onTap;

  const _CityResultTile({
    required this.city,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final name = city['name'] as String? ?? '';
    final state = city['state'] as String? ?? '';

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: Spacing.md),
        child: Row(
          children: [
            const Icon(
              PhosphorIconsFill.mapPin,
              size: 20,
              color: AppColors.coral,
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: typ.AppTypography.body),
                  if (state.isNotEmpty)
                    Text(
                      state,
                      style: typ.AppTypography.caption,
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

/// Skeleton placeholder for a city row during loading.
class _SkeletonCityRow extends StatelessWidget {
  const _SkeletonCityRow();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: Spacing.sm),
      child: Row(
        children: [
          SkeletonRect(width: 20, height: 20, borderRadius: 4),
          SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 140, height: 14),
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
