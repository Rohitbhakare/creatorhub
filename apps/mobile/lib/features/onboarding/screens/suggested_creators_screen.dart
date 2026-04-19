import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/components/app_header.dart';
import '../../../shared/components/avatar.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/components/steps.dart';
import '../../../shared/theme/colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';

/// A5 Creators (IAM-FR-008 · ONB-FR-004).
/// Step 4 of 5. Follow ≥3 creators. "Follow 3 & continue" is primary gate.
class SuggestedCreatorsScreen extends ConsumerStatefulWidget {
  const SuggestedCreatorsScreen({super.key});

  @override
  ConsumerState<SuggestedCreatorsScreen> createState() =>
      _SuggestedCreatorsScreenState();
}

class _SuggestedCreatorsScreenState
    extends ConsumerState<SuggestedCreatorsScreen> {
  List<Map<String, dynamic>> _creators = [];
  bool _isLoading = true;
  bool _hasError = false;
  bool _isCompleting = false;
  static const _minFollows = 3;

  @override
  void initState() {
    super.initState();
    _fetchCreators();
  }

  Future<void> _fetchCreators() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get('/api/v1/onboarding/suggested-creators');
      final body = res.data as Map<String, dynamic>;
      final list = body['data'] as List<dynamic>? ?? [];
      if (!mounted) return;
      setState(() {
        _creators = list.cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } on DioException {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  Future<void> _toggleFollow(String creatorId) async {
    await HapticFeedback.selectionClick();
    final onboarding = ref.read(onboardingProvider);
    final wasFollowing = onboarding.followedCreatorIds.contains(creatorId);
    final dio = ref.read(authServiceProvider).dio;

    ref.read(onboardingProvider.notifier).toggleFollow(creatorId);

    try {
      if (wasFollowing) {
        await dio.delete('/api/v1/onboarding/follow/$creatorId');
      } else {
        await dio.post('/api/v1/onboarding/follow',
            data: {'creator_id': creatorId});
      }
    } catch (_) {
      if (mounted) {
        ref.read(onboardingProvider.notifier).toggleFollow(creatorId);
      }
    }
  }

  Future<void> _onContinue() async {
    setState(() => _isCompleting = true);
    await HapticFeedback.lightImpact();
    ref.read(onboardingProvider.notifier).advanceStep();
    if (!mounted) return;
    setState(() => _isCompleting = false);
    context.go('/onboarding/celebration');
  }

  void _onSkip() {
    HapticFeedback.selectionClick();
    ref.read(onboardingProvider.notifier).advanceStep();
    context.go('/onboarding/celebration');
  }

  @override
  Widget build(BuildContext context) {
    final onboarding = ref.watch(onboardingProvider);
    final followedCount = onboarding.followedCreatorIds.length;
    final canContinue = followedCount >= _minFollows;

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
                  : context.go('/onboarding/verticals'),
              title: '',
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: StepsBar(current: 4, total: 5),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _eyebrow('Step 4 of 5'),
                  const SizedBox(height: 8),
                  Text(
                    'Follow 3 to begin.',
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
                    'Handpicked from your cities & interests.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppColors.inkMuted,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: _buildList(onboarding)),
            _footerBar(canContinue, followedCount),
          ],
        ),
      ),
    );
  }

  Widget _buildList(OnboardingState onboarding) {
    if (_isLoading) return _buildSkeleton();
    if (_hasError) return _buildError();
    if (_creators.isEmpty) return _buildEmpty();

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _creators.length,
      separatorBuilder: (_, _) =>
          const Divider(height: 1, color: AppColors.hairline),
      itemBuilder: (_, i) {
        final c = _creators[i];
        final id = c['id'] as String? ?? '';
        final name = c['display_name'] as String? ?? '';
        final city = c['city'] as String? ?? '';
        final cat = c['category'] as String? ?? c['bio'] as String? ?? '';
        final followers = c['followers_label'] as String? ??
            _formatFollowers(c['followers_count'] as int?);
        final avatar = c['avatar_url'] as String?;
        final isFollowing = onboarding.followedCreatorIds.contains(id);
        return _CreatorRow(
          name: name,
          city: city,
          category: cat,
          followers: followers,
          avatarUrl: avatar,
          isFollowing: isFollowing,
          onToggle: () => _toggleFollow(id),
        );
      },
    );
  }

  String _formatFollowers(int? n) {
    if (n == null) return '';
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return '$n';
  }

  Widget _buildSkeleton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SkeletonLoader(
        child: ListView.separated(
          itemCount: 6,
          separatorBuilder: (_, _) =>
              const Divider(height: 1, color: AppColors.hairline),
          itemBuilder: (_, _) => const Padding(
            padding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            child: Row(
              children: [
                SkeletonCircle(size: 44),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonLine(width: 140, height: 14),
                      SizedBox(height: 6),
                      SkeletonLine(height: 12),
                    ],
                  ),
                ),
                SizedBox(width: 12),
                SkeletonLine(width: 72, height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "Couldn't load creators",
              style: GoogleFonts.fraunces(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Check your connection and try again.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.inkMuted),
            ),
            const SizedBox(height: 16),
            AppButton(
              label: 'Retry',
              variant: AppButtonVariant.outline,
              size: AppButtonSize.small,
              onPressed: _fetchCreators,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Text(
          'No suggestions yet. You can follow creators later from your feed.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 13, color: AppColors.inkMuted),
        ),
      ),
    );
  }

  Widget _footerBar(bool canContinue, int followedCount) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.hairline)),
      ),
      child: Row(
        children: [
          AppButton(
            label: 'Skip',
            variant: AppButtonVariant.outline,
            size: AppButtonSize.medium,
            onPressed: _isCompleting ? null : _onSkip,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: AppButton(
              label: canContinue
                  ? 'Continue'
                  : 'Follow $_minFollows & continue',
              variant: AppButtonVariant.primary,
              size: AppButtonSize.medium,
              fullWidth: true,
              trailingIcon: Icons.arrow_forward_rounded,
              isLoading: _isCompleting,
              onPressed:
                  canContinue && !_isCompleting ? _onContinue : null,
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

class _CreatorRow extends StatelessWidget {
  final String name;
  final String city;
  final String category;
  final String followers;
  final String? avatarUrl;
  final bool isFollowing;
  final VoidCallback onToggle;

  const _CreatorRow({
    required this.name,
    required this.city,
    required this.category,
    required this.followers,
    required this.avatarUrl,
    required this.isFollowing,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final meta = [
      if (city.isNotEmpty) city,
      if (category.isNotEmpty) category,
      if (followers.isNotEmpty) followers,
    ].join(' · ');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: Row(
        children: [
          AppAvatar(imageUrl: avatarUrl, name: name, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                    letterSpacing: -0.005,
                  ),
                ),
                if (meta.isNotEmpty) ...[
                  const SizedBox(height: 1),
                  Text(
                    meta,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          AppButton(
            label: isFollowing ? 'Following' : 'Follow',
            variant:
                isFollowing ? AppButtonVariant.ghost : AppButtonVariant.dark,
            size: AppButtonSize.small,
            onPressed: onToggle,
          ),
        ],
      ),
    );
  }
}
