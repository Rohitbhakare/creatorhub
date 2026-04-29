import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/app_bottom_sheet.dart';
import '../../../shared/components/input.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../auth/providers/auth_provider.dart';

/// A picked city — id + display name.
typedef PickedCity = ({String id, String name});

/// Bottom sheet that lets the user search and pick a city from `/api/v1/cities`.
/// Returns the selected `(id, name)` tuple (or null if dismissed).
Future<PickedCity?> showLocationPickerSheet(BuildContext context) {
  return showAppBottomSheet<PickedCity>(
    context: context,
    title: 'Add location',
    builder: (_) => const _LocationPickerSheet(),
  );
}

class _LocationPickerSheet extends ConsumerStatefulWidget {
  const _LocationPickerSheet();

  @override
  ConsumerState<_LocationPickerSheet> createState() =>
      _LocationPickerSheetState();
}

class _LocationPickerSheetState extends ConsumerState<_LocationPickerSheet> {
  final _controller = TextEditingController();
  List<Map<String, dynamic>> _results = [];
  bool _isSearching = false;
  bool _hasSearched = false;
  Timer? _debounce;
  CancelToken _cancelToken = CancelToken();

  @override
  void dispose() {
    _controller.dispose();
    _debounce?.cancel();
    _cancelToken.cancel();
    super.dispose();
  }

  Future<List<Map<String, dynamic>>> _searchCities(String query) async {
    if (query.trim().length < 2) return [];
    _cancelToken.cancel();
    _cancelToken = CancelToken();
    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get<Map<String, dynamic>>(
        '/api/v1/cities',
        queryParameters: {'q': query.trim(), 'limit': 10},
        cancelToken: _cancelToken,
      );
      final data = response.data;
      if (data == null) return [];
      return (data['data'] as List<dynamic>).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) return _results;
      return [];
    } catch (_) {
      return [];
    }
  }

  void _onSearch(String value) {
    _debounce?.cancel();
    if (value.trim().length < 2) {
      setState(() {
        _results = [];
        _isSearching = false;
        _hasSearched = false;
      });
      return;
    }
    setState(() => _isSearching = true);
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final results = await _searchCities(value);
      if (!mounted) return;
      setState(() {
        _results = results;
        _isSearching = false;
        _hasSearched = true;
      });
    });
  }

  void _select(Map<String, dynamic> city) {
    HapticFeedback.selectionClick();
    final id = city['id'] as String;
    final name = city['name'] as String;
    Navigator.of(context).pop<PickedCity>((id: id, name: name));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppSearchInput(
          controller: _controller,
          hint: 'Search for a city...',
          onSearch: _onSearch,
        ),
        const SizedBox(height: Spacing.lg),
        if (_isSearching)
          const SkeletonLoader(
            child: Column(
              children: [
                _SkeletonCityRow(),
                SizedBox(height: Spacing.sm),
                _SkeletonCityRow(),
                SizedBox(height: Spacing.sm),
                _SkeletonCityRow(),
              ],
            ),
          )
        else if (_results.isNotEmpty)
          _CityResultsList(results: _results, onSelect: _select)
        else if (_hasSearched)
          const _InlineEmpty(
            icon: PhosphorIconsFill.mapPin,
            title: 'No cities match that search.',
            description: 'Try another spelling or a nearby city.',
          )
        else
          const _InlineEmpty(
            icon: PhosphorIconsFill.magnifyingGlass,
            title: 'Search for a city',
            description: 'Tag your story with where it happened.',
          ),
      ],
    );
  }
}

class _CityResultsList extends StatelessWidget {
  final List<Map<String, dynamic>> results;
  final ValueChanged<Map<String, dynamic>> onSelect;

  const _CityResultsList({required this.results, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      constraints: const BoxConstraints(maxHeight: 320),
      child: ListView.separated(
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        itemCount: results.length,
        separatorBuilder: (_, _) =>
            const Divider(color: AppColors.hairline, height: 1),
        itemBuilder: (context, index) {
          final city = results[index];
          final name = city['name'] as String? ?? '';
          final stateName = city['state'] as String? ?? '';
          return InkWell(
            onTap: () => onSelect(city),
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
                          Text(
                            stateName,
                            style: typ.AppTypography.caption,
                          ),
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

class _SkeletonCityRow extends StatelessWidget {
  const _SkeletonCityRow();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: Spacing.sm),
      child: Row(
        children: [
          SkeletonRect(width: 18, height: 18, borderRadius: 4),
          SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 140, height: 14),
                SizedBox(height: Spacing.xs),
                SkeletonLine(width: 80, height: 10),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InlineEmpty extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _InlineEmpty({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    // The parent column uses CrossAxisAlignment.start, so an unconstrained
    // inner Column would shrink to its widest child and pin itself to the
    // left. Stretch to fill the sheet width and centre children explicitly.
    return SizedBox(
      width: double.infinity,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: Spacing.xxl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(icon, size: 36, color: AppColors.inkMuted),
            const SizedBox(height: Spacing.md),
            Text(
              title,
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.xs),
            Text(
              description,
              style:
                  typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
