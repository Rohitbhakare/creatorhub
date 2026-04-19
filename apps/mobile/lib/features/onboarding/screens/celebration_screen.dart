import 'dart:async' show unawaited;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/steps.dart';
import '../../../shared/theme/colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';

/// A6 Celebrate (IAM-FR-010 · ONB-FR-005).
/// Step 5 of 5. Chapter 1 pill + display H1 + "Today's read" recommendation.
class CelebrationScreen extends ConsumerStatefulWidget {
  const CelebrationScreen({super.key});

  @override
  ConsumerState<CelebrationScreen> createState() => _CelebrationScreenState();
}

class _CelebrationScreenState extends ConsumerState<CelebrationScreen> {
  String? _todayTitle;
  String? _todayCreator;
  String? _todayTargetRoute;

  @override
  void initState() {
    super.initState();
    unawaited(_completeOnboarding());
    unawaited(_fetchTodaysRead());
  }

  Future<void> _completeOnboarding() async {
    final dio = ref.read(authServiceProvider).dio;
    try {
      await dio.post('/api/v1/onboarding/complete');
      ref.read(onboardingProvider.notifier).completeOnboarding();
      final res = await dio.get('/api/v1/users/me');
      final body = res.data as Map<String, dynamic>;
      final user = body['data'] as Map<String, dynamic>?;
      if (user != null) {
        ref.read(authProvider.notifier).updateUser(user);
      }
    } catch (_) {
      // Non-fatal: user can still open feed.
    }
  }

  Future<void> _fetchTodaysRead() async {
    final dio = ref.read(authServiceProvider).dio;
    try {
      final res = await dio.get('/api/v1/feed/near-you');
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as Map<String, dynamic>?;
      final items = data?['items'] as List<dynamic>? ?? [];
      if (items.isEmpty) return;
      final first = items.first as Map<String, dynamic>;
      final creator = first['creator'] as Map<String, dynamic>?;
      final title = first['title'] as String?;
      final type = first['type'] as String? ?? 'post';
      final id = first['id'] as String?;
      if (!mounted) return;
      setState(() {
        _todayTitle = title;
        _todayCreator = creator?['display_name'] as String?;
        _todayTargetRoute =
            id != null ? _routeForType(type, id) : null;
      });
    } on DioException {
      // Quietly fall back to default card copy.
    } catch (_) {}
  }

  String _routeForType(String type, String id) {
    switch (type) {
      case 'itinerary':
        return '/itineraries/$id';
      case 'event':
        return '/events/$id';
      case 'experience':
        return '/experiences/$id';
      default:
        return '/posts/$id';
    }
  }

  Future<void> _openFeed() async {
    await HapticFeedback.lightImpact();
    if (!mounted) return;
    context.go('/home');
  }

  Future<void> _openTodaysRead() async {
    final route = _todayTargetRoute;
    if (route == null) return _openFeed();
    await HapticFeedback.selectionClick();
    if (!mounted) return;
    context.go(route);
  }

  @override
  Widget build(BuildContext context) {
    final onboarding = ref.watch(onboardingProvider);
    final firstName = onboarding.firstName?.trim();
    final displayName =
        (firstName != null && firstName.isNotEmpty) ? firstName : 'traveller';

    final verticalsLabel = _verticalsLabel(onboarding.selectedVerticals);
    final cityLabel = onboarding.selectedCityName ?? 'your city';

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: StepsBar(current: 5, total: 5),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(28, 40, 28, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _chapterPill(),
                      const SizedBox(height: 18),
                      _displayHeading(displayName),
                      const SizedBox(height: 18),
                      Text(
                        'Your home base is $cityLabel. '
                        "You're following ${onboarding.followedCreatorIds.length} "
                        'creators across $verticalsLabel. '
                        "Let's go read.",
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          height: 1.55,
                          color: AppColors.inkSoft,
                        ),
                      ),
                      const SizedBox(height: 18),
                      _todaysReadCard(),
                      const SizedBox(height: 24),
                      AppButton(
                        label: 'Open my feed',
                        variant: AppButtonVariant.primary,
                        size: AppButtonSize.large,
                        fullWidth: true,
                        trailingIcon: Icons.arrow_forward_rounded,
                        onPressed: _openFeed,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chapterPill() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primaryTint,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        'CHAPTER 1 · YOU',
        style: GoogleFonts.jetBrainsMono(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.coralDeep,
          letterSpacing: 0.12 * 10,
        ),
      ),
    );
  }

  Widget _displayHeading(String firstName) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: 'Welcome aboard,\n',
            style: GoogleFonts.fraunces(
              fontSize: 44,
              height: 0.96,
              fontWeight: FontWeight.w500,
              letterSpacing: -0.018 * 44,
              color: AppColors.ink,
            ),
          ),
          TextSpan(
            text: '$firstName.',
            style: GoogleFonts.fraunces(
              fontSize: 44,
              height: 0.96,
              fontWeight: FontWeight.w500,
              fontStyle: FontStyle.italic,
              letterSpacing: -0.018 * 44,
              color: AppColors.coral,
            ),
          ),
        ],
      ),
    );
  }

  Widget _todaysReadCard() {
    final title = _todayTitle ?? 'A handpicked read for your first day';
    final subtitle = _todayCreator != null
        ? '$_todayCreator\'s story is waiting.'
        : 'Fresh stories, curated for your taste.';

    return GestureDetector(
      onTap: _openTodaysRead,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.hairline),
          boxShadow: AppColors.cardRaisedShadow,
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primaryTint,
                borderRadius: BorderRadius.circular(10),
              ),
              alignment: Alignment.center,
              child: Icon(
                PhosphorIcons.compass(),
                size: 20,
                color: AppColors.coral,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Today's read",
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.inkMuted,
                    ),
                  ),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppColors.inkFaint,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              PhosphorIcons.caretRight(),
              size: 16,
              color: AppColors.inkMuted,
            ),
          ],
        ),
      ),
    );
  }

  String _verticalsLabel(List<String> slugs) {
    if (slugs.isEmpty) return 'your interests';
    final titled = slugs.map(_titleCase).toList();
    if (titled.length == 1) return titled.first;
    if (titled.length == 2) return '${titled[0]} and ${titled[1]}';
    final head = titled.take(titled.length - 1).join(', ');
    return '$head and ${titled.last}';
  }

  String _titleCase(String slug) {
    if (slug.isEmpty) return slug;
    return slug[0].toUpperCase() + slug.substring(1);
  }
}
