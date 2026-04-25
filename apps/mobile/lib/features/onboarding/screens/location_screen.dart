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
import '../providers/guest_prefs_provider.dart';
import '../providers/onboarding_provider.dart';

/// A3 Location (IAM-FR-006 · ONB-FR-002).
/// Step 2 of 5 for authenticated users; Step 1 of 2 for guests (isGuest=true).
/// Guest mode: city is optional (Skip available), saves to GuestPrefsProvider.
class LocationScreen extends ConsumerStatefulWidget {
  final bool isGuest;
  const LocationScreen({super.key, this.isGuest = false});


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

  Future<void> _selectPopularCity(_PopularCity c) async {
    unawaited(HapticFeedback.selectionClick());
    _searchCtrl.text = c.name;
    // Resolve the chip to a real city_id via the search endpoint —
    // without this, setUserCity 404s and onboarding can never complete.
    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get('/api/v1/cities',
          queryParameters: {'q': c.name, 'limit': 5});
      final data = response.data as Map<String, dynamic>;
      final cities =
          (data['data'] as List<dynamic>).cast<Map<String, dynamic>>();
      final match = cities.firstWhere(
        (r) => (r['name'] as String?)?.toLowerCase() == c.name.toLowerCase(),
        orElse: () => cities.isNotEmpty ? cities.first : <String, dynamic>{},
      );
      final id = match['id'] as String?;
      if (id == null || id.isEmpty) throw Exception('city_not_found');
      final name = (match['name'] as String?) ?? c.name;
      if (!mounted) return;
      ref.read(onboardingProvider.notifier).setCity(id, name);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Couldn't load ${c.name}. Try search instead."),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
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
    if (widget.isGuest) {
      final s = ref.read(onboardingProvider);
      final cityId = s.selectedCityId;
      final cityName = s.selectedCityName;
      if (cityId != null && cityId.isNotEmpty && cityName != null) {
        ref.read(guestPrefsProvider.notifier).setCity(cityId, cityName);
      }
      await HapticFeedback.lightImpact();
      if (!mounted) return;
      context.go('/guest-setup/categories');
      return;
    }

    final s = ref.read(onboardingProvider);
    final cityId = s.selectedCityId;
    if (cityId == null || cityId.isEmpty) return;

    setState(() => _isSaving = true);
    var saved = false;
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/onboarding/city', data: {'city_id': cityId});
      saved = true;
    } catch (_) {
      // Don't advance — without a persisted city, completeOnboarding 422s
      // and the router loops the user back to /onboarding/profile.
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
    if (!mounted) return;
    if (!saved) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Couldn't save your city. Try again."),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    await HapticFeedback.lightImpact();
    if (!mounted) return;
    ref.read(onboardingProvider.notifier).advanceStep();
    context.go('/onboarding/verticals');
  }

  void _skipCity() {
    HapticFeedback.selectionClick();
    context.go('/guest-setup/categories');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(onboardingProvider);
    final selectedName = s.selectedCityName ?? '';
    final canContinue = s.canAdvance;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Column(
          children: [
            if (widget.isGuest)
              _guestTopBar()
            else
              AppHeader(
                showBack: true,
                onBack: () => context.canPop()
                    ? context.pop()
                    : context.go('/onboarding/profile'),
                title: '',
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: widget.isGuest
                  ? _stepPill('Step 1 of 2')
                  : const StepsBar(current: 2, total: 5),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _eyebrow(widget.isGuest ? 'Step 1 of 2' : 'Step 2 of 5'),
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
                    if (!widget.isGuest) ...[
                      const SizedBox(height: 28),
                      _preciseLocationCard(),
                    ],
                  ],
                ),
              ),
            ),
            _footerBar(canContinue),
          ],
        ),
      ),
    );
  }

  Widget _guestTopBar() {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 4, 16, 0),
        child: Row(
          children: [
            IconButton(
              icon: Icon(PhosphorIcons.x(), size: 20, color: AppColors.ink),
              onPressed: () => context.go('/welcome'),
              tooltip: 'Close',
            ),
            const Spacer(),
            TextButton(
              onPressed: _skipCity,
              child: Text(
                'Skip',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.inkMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stepPill(String label) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.inkMuted,
          ),
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
          onTap: () => unawaited(_selectPopularCity(c)),
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

  Widget _footerBar(bool canContinue) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.hairline)),
      ),
      child: Row(
        children: [
          if (!widget.isGuest) ...[
            AppButton(
              label: 'Back',
              variant: AppButtonVariant.outline,
              size: AppButtonSize.medium,
              onPressed: () => context.canPop()
                  ? context.pop()
                  : context.go('/onboarding/profile'),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: AppButton(
              label: widget.isGuest && !canContinue ? 'Skip for now' : 'Continue',
              variant: AppButtonVariant.primary,
              size: AppButtonSize.medium,
              fullWidth: true,
              trailingIcon: Icons.arrow_forward_rounded,
              isLoading: _isSaving,
              onPressed: !_isSaving
                  ? (canContinue || widget.isGuest ? _onContinue : null)
                  : null,
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
