import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/app_header.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/steps.dart';
import '../../../shared/theme/colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';

/// A3 Location (IAM-FR-006 · ONB-FR-002).
/// Step 2 of 5. Search + city chips + precise-location toggle.
class LocationScreen extends ConsumerStatefulWidget {
  const LocationScreen({super.key});

  @override
  ConsumerState<LocationScreen> createState() => _LocationScreenState();
}

class _LocationScreenState extends ConsumerState<LocationScreen> {
  static const _popular = [
    _PopularCity(name: 'Mumbai', state: 'MH'),
    _PopularCity(name: 'Delhi', state: 'DL'),
    _PopularCity(name: 'Bengaluru', state: 'KA'),
    _PopularCity(name: 'Hyderabad', state: 'TS'),
    _PopularCity(name: 'Chennai', state: 'TN'),
    _PopularCity(name: 'Pune', state: 'MH'),
    _PopularCity(name: 'Kolkata', state: 'WB'),
    _PopularCity(name: 'Goa', state: 'GA'),
  ];

  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  bool _preciseLocation = false;
  bool _isSaving = false;
  Timer? _debounce;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _searchCities(String q) async {
    if (q.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }
    setState(() => _isSearching = true);

    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get('/api/v1/cities',
          queryParameters: {'q': q.trim(), 'limit': 10});
      final data = response.data as Map<String, dynamic>;
      final cities = (data['data'] as List<dynamic>).cast<Map<String, dynamic>>();
      if (!mounted) return;
      setState(() {
        _searchResults = cities;
        _isSearching = false;
      });
    } on DioException {
      if (mounted) setState(() => _isSearching = false);
    } catch (_) {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _searchCities(value);
    });
  }

  void _selectPopularCity(_PopularCity c) {
    HapticFeedback.selectionClick();
    // Use name as a stable local id; server-side the city lookup will resolve.
    ref.read(onboardingProvider.notifier).setCity(c.name.toLowerCase(), c.name);
    _searchCtrl.text = c.name;
  }

  void _selectSearchCity(Map<String, dynamic> city) {
    HapticFeedback.selectionClick();
    final id = city['id'] as String;
    final name = city['name'] as String;
    ref.read(onboardingProvider.notifier).setCity(id, name);
    _searchCtrl.text = name;
    setState(() => _searchResults = []);
  }

  Future<void> _onContinue() async {
    final s = ref.read(onboardingProvider);
    final cityId = s.selectedCityId;
    if (cityId == null || cityId.isEmpty) return;

    setState(() => _isSaving = true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/onboarding/city', data: {'city_id': cityId});
    } catch (_) {
      // Non-fatal: local state still advances for offline-friendly UX.
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
    if (!mounted) return;
    await HapticFeedback.lightImpact();
    if (!mounted) return;
    ref.read(onboardingProvider.notifier).advanceStep();
    context.go('/onboarding/verticals');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(onboardingProvider);
    final selectedName = s.selectedCityName ?? '';

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Column(
          children: [
            AppHeader(
              showBack: true,
              onBack: () => context.canPop()
                  ? context.pop()
                  : context.go('/onboarding/profile'),
              title: '',
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: StepsBar(current: 2, total: 5),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _eyebrow('Step 2 of 5'),
                    const SizedBox(height: 8),
                    Text(
                      'Where do you call home?',
                      style: GoogleFonts.fraunces(
                        fontSize: 30,
                        fontWeight: FontWeight.w500,
                        height: 1.0,
                        letterSpacing: -0.018 * 30,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "We'll surface creators closer to you first. You can "
                      'still follow anyone from anywhere.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.inkMuted,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 22),
                    _searchField(),
                    if (_searchResults.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _searchResultsList(),
                    ],
                    const SizedBox(height: 18),
                    _cityChips(selectedName),
                    const SizedBox(height: 28),
                    _preciseLocationCard(),
                  ],
                ),
              ),
            ),
            _footerBar(),
          ],
        ),
      ),
    );
  }

  Widget _searchField() {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairlineStrong),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          const SizedBox(width: 14),
          Icon(
            PhosphorIcons.magnifyingGlass(),
            size: 18,
            color: AppColors.inkMuted,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: _searchCtrl,
              onChanged: _onSearchChanged,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.ink,
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                hintText: 'City or state',
                hintStyle: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.inkMuted,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          if (_isSearching) ...[
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.inkMuted,
              ),
            ),
            const SizedBox(width: 14),
          ],
        ],
      ),
    );
  }

  Widget _searchResultsList() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        children: _searchResults
            .map((c) => InkWell(
                  onTap: () => _selectSearchCity(c),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    child: Row(
                      children: [
                        Icon(
                          PhosphorIcons.mapPin(PhosphorIconsStyle.fill),
                          size: 16,
                          color: AppColors.coral,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            '${c['name']}${c['state'] != null ? ', ${c['state']}' : ''}',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: AppColors.ink,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _cityChips(String selectedName) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _popular.map((c) {
        final selected = selectedName.toLowerCase() == c.name.toLowerCase();
        return GestureDetector(
          onTap: () => _selectPopularCity(c),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: selected ? AppColors.ink : AppColors.surface,
              border: Border.all(
                color: selected ? AppColors.ink : AppColors.hairlineStrong,
              ),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              c.name,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: selected ? AppColors.surface : AppColors.ink,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _preciseLocationCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            PhosphorIcons.mapPin(),
            size: 18,
            color: AppColors.inkSoft,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppColors.inkSoft,
                  height: 1.5,
                ),
                children: [
                  TextSpan(
                    text: 'Use precise location?\n',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  const TextSpan(
                    text: 'Better recommendations, optional anytime.',
                  ),
                ],
              ),
            ),
          ),
          Switch(
            value: _preciseLocation,
            onChanged: (v) {
              HapticFeedback.selectionClick();
              setState(() => _preciseLocation = v);
            },
            activeThumbColor: AppColors.coral,
          ),
        ],
      ),
    );
  }

  Widget _footerBar() {
    final s = ref.watch(onboardingProvider);
    final canContinue = s.canAdvance;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.hairline)),
      ),
      child: Row(
        children: [
          AppButton(
            label: 'Back',
            variant: AppButtonVariant.outline,
            size: AppButtonSize.medium,
            onPressed: () => context.canPop()
                ? context.pop()
                : context.go('/onboarding/profile'),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: AppButton(
              label: 'Continue',
              variant: AppButtonVariant.primary,
              size: AppButtonSize.medium,
              fullWidth: true,
              trailingIcon: Icons.arrow_forward_rounded,
              isLoading: _isSaving,
              onPressed: canContinue && !_isSaving ? _onContinue : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _eyebrow(String text) {
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.jetBrainsMono(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: AppColors.inkMuted,
        letterSpacing: 0.12 * 10,
      ),
    );
  }
}

class _PopularCity {
  final String name;
  final String state;
  const _PopularCity({required this.name, required this.state});
}
