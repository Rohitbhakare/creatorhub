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

/// A4 Interests (IAM-FR-007 · ONB-FR-003).
/// Step 3 of 5 for auth users; Step 2 of 2 for guests (isGuest=true).
/// Guest mode: travel sub-categories, saves to GuestPrefsProvider.
class VerticalPickerScreen extends ConsumerStatefulWidget {
  final bool isGuest;
  const VerticalPickerScreen({super.key, this.isGuest = false});

  @override
  ConsumerState<VerticalPickerScreen> createState() =>
      _VerticalPickerScreenState();
}

class _VerticalPickerScreenState extends ConsumerState<VerticalPickerScreen> {
  // Slugs must match `VERTICALS` in packages/shared/src/constants/index.ts.
  // Divergence here means the API drops unknown slugs and 422s with "At
  // least 3 verticals required" — which traps users in the onboarding loop.
  static const _authCats = <_Cat>[
    _Cat('travel', 'Travel', _mountains),
    _Cat('stories', 'Stories', _bookOpen),
    _Cat('food', 'Food', _forkKnife),
    _Cat('fitness', 'Fitness', _barbell),
    _Cat('education', 'Education', _graduationCap),
    _Cat('photography', 'Photography', _camera),
    _Cat('music', 'Music', _musicNotes),
    _Cat('wellness', 'Wellness', _heart),
  ];

  static const _guestCats = <_GuestCat>[
    _GuestCat('road_trips', 'Road Trips', '🚗', Color(0xFFFFF3E0)),
    _GuestCat('street_food', 'Street Food', '🍜', Color(0xFFFCE4EC)),
    _GuestCat('adventure', 'Adventure', '🏔️', Color(0xFFE8F5E9)),
    _GuestCat('cultural', 'Cultural', '🎭', Color(0xFFEDE7F6)),
    _GuestCat('wildlife', 'Wildlife', '🦁', Color(0xFFF3E5F5)),
    _GuestCat('offbeat', 'Offbeat', '🗺️', Color(0xFFE0F7FA)),
    _GuestCat('solo_budget', 'Solo & Budget', '🎒', Color(0xFFFFF8E1)),
    _GuestCat('luxury', 'Luxury', '✨', Color(0xFFEFEBE9)),
  ];

  List<_Cat> get _cats => _authCats;
  List<_GuestCat> get _guestCatList => _guestCats;

  final Set<String> _selected = {};
  bool _isSaving = false;
  static const _minRequired = 3;

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

    if (widget.isGuest) {
      ref.read(guestPrefsProvider.notifier).setCategories(_selected.toList());
      await HapticFeedback.lightImpact();
      if (!mounted) return;
      context.go('/guest-setup/done');
      return;
    }

    setState(() => _isSaving = true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/onboarding/verticals',
          data: {'verticals': _selected.toList()});
    } on DioException {
      // Non-fatal for local flow; retried on next step.
    } catch (_) {}
    if (!mounted) return;
    ref.read(onboardingProvider.notifier).setVerticals(_selected.toList());
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
                      widget.isGuest
                          ? 'What gets you packing?'
                          : 'What pulls you in?',
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
                      "Pick at least $_minRequired. We'll keep learning.",
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.inkMuted,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 14),
                    widget.isGuest ? _guestGrid() : _authGrid(),
                    const SizedBox(height: 14),
                    Text(
                      '${_selected.length} of ${widget.isGuest ? _guestCatList.length : _cats.length} selected · '
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
              icon: Icon(PhosphorIcons.arrowLeft(), size: 20, color: AppColors.ink),
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

  Widget _authGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        mainAxisExtent: 96,
      ),
      itemCount: _cats.length,
      itemBuilder: (_, i) {
        final c = _cats[i];
        final selected = _selected.contains(c.slug);
        return _Tile(cat: c, selected: selected, onTap: () => _toggle(c.slug));
      },
    );
  }

  Widget _guestGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        mainAxisExtent: 96,
      ),
      itemCount: _guestCatList.length,
      itemBuilder: (_, i) {
        final c = _guestCatList[i];
        final selected = _selected.contains(c.slug);
        return _GuestTile(cat: c, selected: selected, onTap: () => _toggle(c.slug));
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
  final IconData Function() iconBuilder;
  const _Cat(this.slug, this.name, this.iconBuilder);
}

class _GuestCat {
  final String slug;
  final String name;
  final String emoji;
  final Color bgColor;
  const _GuestCat(this.slug, this.name, this.emoji, this.bgColor);
}

IconData _mountains() => PhosphorIcons.mountains();
IconData _forkKnife() => PhosphorIcons.forkKnife();
IconData _bookOpen() => PhosphorIcons.bookOpen();
IconData _barbell() => PhosphorIcons.barbell();
IconData _musicNotes() => PhosphorIcons.musicNotes();
IconData _camera() => PhosphorIcons.camera();
IconData _graduationCap() => PhosphorIcons.graduationCap();
IconData _heart() => PhosphorIcons.heart();

class _Tile extends StatelessWidget {
  final _Cat cat;
  final bool selected;
  final VoidCallback onTap;

  const _Tile({required this.cat, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(
            color: selected ? AppColors.coral : AppColors.hairlineStrong,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: selected
              ? [
                  const BoxShadow(
                    color: AppColors.primaryTint,
                    blurRadius: 0,
                    spreadRadius: 3,
                  ),
                  ...AppColors.cardRaisedShadow,
                ]
              : AppColors.cardRaisedShadow,
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(
                  cat.iconBuilder(),
                  size: 22,
                  color: selected ? AppColors.coral : AppColors.inkSoft,
                ),
                Text(
                  cat.name,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                    letterSpacing: -0.005,
                  ),
                ),
              ],
            ),
            if (selected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                    color: AppColors.coral,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    PhosphorIcons.check(PhosphorIconsStyle.bold),
                    size: 11,
                    color: AppColors.surface,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _GuestTile extends StatelessWidget {
  final _GuestCat cat;
  final bool selected;
  final VoidCallback onTap;

  const _GuestTile({required this.cat, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? cat.bgColor : AppColors.surface,
          border: Border.all(
            color: selected ? AppColors.coral : AppColors.hairlineStrong,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: AppColors.cardRaisedShadow,
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(cat.emoji, style: const TextStyle(fontSize: 24)),
                Text(
                  cat.name,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                    letterSpacing: -0.005,
                  ),
                ),
              ],
            ),
            if (selected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                    color: AppColors.coral,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    PhosphorIcons.check(PhosphorIconsStyle.bold),
                    size: 11,
                    color: AppColors.surface,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
