import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/app_header.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/category_tile.dart';
import '../../../shared/components/steps.dart';
import '../../../shared/theme/colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/guest_prefs_provider.dart';
import '../providers/onboarding_provider.dart';

/// Travel-only launch — pick the 4 active travel sub-categories.
/// Same screen for auth and guest paths (single source of truth).
/// Persists to `users.travel_sub_categories` for auth users via
/// `PUT /api/v1/users/me/travel-sub-categories`.
class VerticalPickerScreen extends ConsumerStatefulWidget {
  final bool isGuest;
  const VerticalPickerScreen({super.key, this.isGuest = false});

  @override
  ConsumerState<VerticalPickerScreen> createState() =>
      _VerticalPickerScreenState();
}

class _VerticalPickerScreenState extends ConsumerState<VerticalPickerScreen> {
  static const _cats = <_Cat>[
    _Cat('travel.road_trips', 'Road Trips', '🚗', Color(0xFFFFF3E0)),
    _Cat('travel.biking', 'Biking', '🏍️', Color(0xFFFFEBEE)),
    _Cat('travel.trekking', 'Trekking', '🥾', Color(0xFFE8F5E9)),
    _Cat('travel.food_trails', 'Food Trails', '🍜', Color(0xFFFCE4EC)),
  ];

  final Set<String> _selected = {};
  bool _isSaving = false;
  static const _minRequired = 2;

  void _toggle(String slug) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selected.contains(slug)) {
        _selected.remove(slug);
      } else {
        _selected.add(slug);
      }
    });
  }

  Future<void> _onContinue() async {
    if (_selected.length < _minRequired) return;
    final selectedSlugs = _selected.toList();

    if (widget.isGuest) {
      ref.read(guestPrefsProvider.notifier).setCategories(selectedSlugs);
      await HapticFeedback.lightImpact();
      if (!mounted) return;
      context.go('/guest-setup/done');
      return;
    }

    setState(() => _isSaving = true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put(
        '/api/v1/users/me/travel-sub-categories',
        data: {'travel_sub_categories': selectedSlugs},
      );
    } on DioException {
      // Non-fatal for local flow; retried on next step.
    } catch (_) {}
    if (!mounted) return;
    ref.read(onboardingProvider.notifier).setVerticals(selectedSlugs);
    ref.read(onboardingProvider.notifier).advanceStep();
    setState(() => _isSaving = false);
    await HapticFeedback.lightImpact();
    if (!mounted) return;
    context.go('/onboarding/creators');
  }

  @override
  Widget build(BuildContext context) {
    final canContinue = _selected.length >= _minRequired;

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
                    : context.go('/onboarding/location'),
                title: '',
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: widget.isGuest
                  ? _stepPill('Step 2 of 2')
                  : const StepsBar(current: 3, total: 5),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _eyebrow(widget.isGuest ? 'Step 2 of 2' : 'Step 3 of 5'),
                    const SizedBox(height: 6),
                    Text(
                      "Pick the trips you'd like to see",
                      style: GoogleFonts.fraunces(
                        fontSize: 30,
                        fontWeight: FontWeight.w500,
                        height: 1.0,
                        letterSpacing: -0.018 * 30,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Choose at least $_minRequired. We\u2019ll keep learning.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.inkMuted,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 18),
                    _grid(),
                    const SizedBox(height: 14),
                    Text(
                      '${_selected.length} of ${_cats.length} selected · '
                      'minimum $_minRequired',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.inkMuted,
                      ),
                    ),
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
              icon: Icon(PhosphorIcons.arrowLeft(),
                  size: 20, color: AppColors.ink),
              onPressed: () => context.canPop()
                  ? context.pop()
                  : context.go('/guest-setup/location'),
              tooltip: 'Back',
            ),
            const Spacer(),
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

  Widget _grid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        mainAxisExtent: 120,
      ),
      itemCount: _cats.length,
      itemBuilder: (_, i) {
        final c = _cats[i];
        return CategoryTile(
          emoji: c.emoji,
          label: c.name,
          tint: c.tint,
          selected: _selected.contains(c.slug),
          onTap: () => _toggle(c.slug),
        );
      },
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
                  : context.go('/onboarding/location'),
            ),
            const SizedBox(width: 10),
          ],
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

class _Cat {
  final String slug;
  final String name;
  final String emoji;
  final Color tint;
  const _Cat(this.slug, this.name, this.emoji, this.tint);
}
