import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';

/// Place result from the API.
class PlaceResult {
  final String placeId;
  final String name;
  final String secondaryText;
  final double? lat;
  final double? lng;
  final String? photoUrl;

  const PlaceResult({
    required this.placeId,
    required this.name,
    required this.secondaryText,
    this.lat,
    this.lng,
    this.photoUrl,
  });
}

/// Bottom sheet for searching and selecting a spot via Google Places
/// autocomplete.
///
/// Returns a [PlaceResult] when the user selects a place.
class SpotPickerSheet extends ConsumerStatefulWidget {
  const SpotPickerSheet({super.key});

  @override
  ConsumerState<SpotPickerSheet> createState() => _SpotPickerSheetState();
}

class _SpotPickerSheetState extends ConsumerState<SpotPickerSheet> {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();

  List<PlaceResult> _results = [];
  bool _isSearching = false;
  String? _searchError;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    // Auto-focus search on open
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();

    if (value.trim().length < 2) {
      setState(() {
        _results = [];
        _isSearching = false;
        _searchError = null;
      });
      return;
    }

    setState(() => _isSearching = true);

    _debounce = Timer(const Duration(milliseconds: 300), () async {
      await _searchPlaces(value.trim());
    });
  }

  Future<void> _searchPlaces(String query) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get(
        '/api/v1/places/autocomplete',
        queryParameters: {'input': query, 'limit': 8},
      );

      final responseData = response.data as Map<String, dynamic>;
      final predictions =
          (responseData['data'] as List<dynamic>?) ?? [];

      final results = predictions.map((p) {
        final pred = p as Map<String, dynamic>;
        return PlaceResult(
          placeId: pred['place_id'] as String? ?? '',
          name: pred['main_text'] as String? ??
              pred['description'] as String? ??
              '',
          secondaryText: pred['secondary_text'] as String? ?? '',
          lat: (pred['lat'] as num?)?.toDouble(),
          lng: (pred['lng'] as num?)?.toDouble(),
          photoUrl: pred['photo_url'] as String?,
        );
      }).toList();

      if (mounted) {
        setState(() {
          _results = results;
          _isSearching = false;
          _searchError = null;
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _isSearching = false;
          _searchError =
              e.response?.statusMessage ?? 'Failed to search places';
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

  void _selectPlace(PlaceResult place) {
    HapticFeedback.selectionClick();
    Navigator.of(context).pop(place);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 240),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Padding(
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

            // Title bar
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Spacing.xl, Spacing.lg, Spacing.lg, Spacing.sm,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Add a spot', style: typ.AppTypography.h4),
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

            // Search input
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.xl,
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                onChanged: _onSearchChanged,
                style: typ.AppTypography.body,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Search places...',
                  prefixIcon: const Icon(Icons.search,
                      size: 20, color: AppColors.inkMuted),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                          child: const Icon(Icons.close,
                              size: 18, color: AppColors.inkMuted),
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(Layout.inputRadius),
                    borderSide:
                        const BorderSide(color: AppColors.hairline),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(Layout.inputRadius),
                    borderSide:
                        const BorderSide(color: AppColors.hairline),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(Layout.inputRadius),
                    borderSide: const BorderSide(
                        color: AppColors.coral, width: 1.5),
                  ),
                  filled: true,
                  fillColor: AppColors.surfaceAlt,
                ),
              ),
            ),
            const SizedBox(height: Spacing.sm),

            // Results
            Flexible(
              child: _buildResults(),
            ),

            // Powered by Google
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Spacing.xl, Spacing.sm, Spacing.xl, Spacing.xl,
              ),
              child: Text(
                'Powered by Google',
                style: typ.AppTypography.caption
                    .copyWith(color: AppColors.inkMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResults() {
    if (_isSearching) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
        child: SkeletonLoader(
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 4,
            separatorBuilder: (_, _) =>
                const SizedBox(height: Spacing.md),
            itemBuilder: (_, _) => const _SkeletonPlaceRow(),
          ),
        ),
      );
    }

    if (_searchError != null) {
      return Padding(
        padding: const EdgeInsets.all(Spacing.xl),
        child: Text(
          _searchError!,
          style:
              typ.AppTypography.bodySmall.copyWith(color: AppColors.danger),
        ),
      );
    }

    if (_results.isEmpty &&
        _searchController.text.isNotEmpty &&
        _searchController.text.length >= 2) {
      return Padding(
        padding: const EdgeInsets.all(Spacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              PhosphorIconsFill.mapPinArea,
              size: 40,
              color: AppColors.inkMuted,
            ),
            const SizedBox(height: Spacing.md),
            Text('No places found', style: typ.AppTypography.h4),
            const SizedBox(height: Spacing.xs),
            Text(
              'Try a different search term',
              style:
                  typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
            ),
          ],
        ),
      );
    }

    if (_results.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(Spacing.xl),
        child: Text(
          'Search for a place to add as a spot',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          textAlign: TextAlign.center,
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      itemCount: _results.length,
      separatorBuilder: (_, _) =>
          const Divider(color: AppColors.hairline, height: 1),
      itemBuilder: (context, index) {
        final place = _results[index];
        return GestureDetector(
          onTap: () => _selectPlace(place),
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
                      Text(
                        place.name,
                        style: typ.AppTypography.body,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (place.secondaryText.isNotEmpty)
                        Text(
                          place.secondaryText,
                          style: typ.AppTypography.caption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Skeleton placeholder for a place row during loading.
class _SkeletonPlaceRow extends StatelessWidget {
  const _SkeletonPlaceRow();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: Spacing.xs),
      child: Row(
        children: [
          SkeletonRect(width: 20, height: 20, borderRadius: 4),
          SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 160, height: 14),
                SizedBox(height: Spacing.xs),
                SkeletonLine(width: 100, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
