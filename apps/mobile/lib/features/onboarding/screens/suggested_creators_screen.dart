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
import '../../../shared/components/avatar.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';
import '../components/onboarding_progress_bar.dart';

/// Suggested creators screen (ONB-FR-004).
/// Shows a list of creators the user can optionally follow during onboarding.
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
      final authService = ref.read(authServiceProvider);
      final response =
          await authService.dio.get('/api/v1/onboarding/suggested-creators');
      final responseData = response.data as Map<String, dynamic>;
      final data = responseData['data'] as List<dynamic>? ?? [];

      if (!mounted) return;
      setState(() {
        _creators = data.cast<Map<String, dynamic>>();
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
    final onboarding = ref.read(onboardingProvider);
    final isFollowing = onboarding.followedCreatorIds.contains(creatorId);
    final authService = ref.read(authServiceProvider);

    // Optimistic local update
    ref.read(onboardingProvider.notifier).toggleFollow(creatorId);

    try {
      if (isFollowing) {
        await authService.dio.delete('/api/v1/onboarding/follow/$creatorId');
      } else {
        await authService.dio
            .post('/api/v1/onboarding/follow', data: {'creator_id': creatorId});
      }
    } catch (_) {
      // Revert on failure
      if (mounted) {
        ref.read(onboardingProvider.notifier).toggleFollow(creatorId);
      }
    }
  }

  void _onContinue() {
    HapticFeedback.lightImpact();
    ref.read(onboardingProvider.notifier).advanceStep();
    context.go('/onboarding/celebration');
  }

  @override
  Widget build(BuildContext context) {
    final onboarding = ref.watch(onboardingProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress bar
            const OnboardingProgressBar(currentStep: 3, totalSteps: 4),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Layout.screenPaddingH,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: Spacing.xl),
                  Text('Creators to follow', style: typ.AppTypography.h2),
                  const SizedBox(height: Spacing.sm),
                  Text(
                    'Follow creators you like \u2014 you can skip this',
                    style: typ.AppTypography.bodyLarge.copyWith(
                      color: AppColors.muted,
                    ),
                  ),
                  const SizedBox(height: Spacing.xl),
                ],
              ),
            ),

            // Content
            Expanded(child: _buildContent(onboarding)),

            // Bottom actions
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Layout.screenPaddingH,
              ),
              child: Column(
                children: [
                  // Skip button
                  Center(
                    child: TextButton(
                      onPressed: _onContinue,
                      child: Text(
                        'Skip',
                        style: typ.AppTypography.body.copyWith(
                          color: AppColors.softInk,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: Spacing.sm),

                  // Continue button (always enabled)
                  AppButton(
                    label: 'Continue',
                    onPressed: _onContinue,
                    variant: AppButtonVariant.primary,
                    size: AppButtonSize.large,
                    fullWidth: true,
                  ),
                  const SizedBox(height: Spacing.xl),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(OnboardingState onboarding) {
    if (_isLoading) {
      return _buildSkeletonList();
    }

    if (_hasError) {
      return _buildEmptyState(
        icon: PhosphorIconsFill.warningCircle,
        title: 'Could not load creators',
        subtitle: 'Tap to retry or continue without following anyone.',
        onRetry: _fetchCreators,
      );
    }

    if (_creators.isEmpty) {
      return _buildEmptyState(
        icon: PhosphorIconsFill.users,
        title: 'No creators yet',
        subtitle: 'You can discover creators later from the home feed.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      itemCount: _creators.length,
      itemBuilder: (context, index) {
        final creator = _creators[index];
        final creatorId = creator['id'] as String? ?? '';
        final displayName = creator['display_name'] as String? ?? '';
        final bio = creator['bio'] as String? ?? '';
        final avatarUrl = creator['avatar_url'] as String?;
        final isFollowing = onboarding.followedCreatorIds.contains(creatorId);

        return Padding(
          padding: EdgeInsets.only(
            bottom: index < _creators.length - 1 ? Spacing.md : 0,
          ),
          child: _CreatorTile(
            creatorId: creatorId,
            displayName: displayName,
            bio: bio,
            avatarUrl: avatarUrl,
            isFollowing: isFollowing,
            onToggleFollow: () => _toggleFollow(creatorId),
          ),
        );
      },
    );
  }

  Widget _buildSkeletonList() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: SkeletonLoader(
        child: Column(
          children: List.generate(6, (index) {
            return const Padding(
              padding: EdgeInsets.only(bottom: Spacing.md),
              child: Row(
                children: [
                  SkeletonCircle(size: 48),
                  SizedBox(width: Spacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonLine(width: 120, height: 16),
                        SizedBox(height: Spacing.xs),
                        SkeletonLine(height: 12),
                      ],
                    ),
                  ),
                  SizedBox(width: Spacing.md),
                  SkeletonLine(width: 80, height: 32),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onRetry,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: AppColors.softInk),
            const SizedBox(height: Spacing.lg),
            Text(
              title,
              style: typ.AppTypography.h4,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              subtitle,
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.muted,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: Spacing.lg),
              AppButton(
                label: 'Retry',
                onPressed: onRetry,
                variant: AppButtonVariant.secondary,
                size: AppButtonSize.small,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Individual creator tile with follow/following toggle.
class _CreatorTile extends StatelessWidget {
  final String creatorId;
  final String displayName;
  final String bio;
  final String? avatarUrl;
  final bool isFollowing;
  final VoidCallback onToggleFollow;

  const _CreatorTile({
    required this.creatorId,
    required this.displayName,
    required this.bio,
    required this.avatarUrl,
    required this.isFollowing,
    required this.onToggleFollow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPaddingCompact),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          AppAvatar(
            imageUrl: avatarUrl,
            name: displayName,
            size: 48,
          ),
          const SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  style: typ.AppTypography.h4,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (bio.isNotEmpty) ...[
                  const SizedBox(height: Spacing.xs),
                  Text(
                    bio,
                    style: typ.AppTypography.bodySmall.copyWith(
                      color: AppColors.muted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: Spacing.md),
          AppButton(
            label: isFollowing ? 'Following' : 'Follow',
            onPressed: () {
              HapticFeedback.lightImpact();
              onToggleFollow();
            },
            variant:
                isFollowing ? AppButtonVariant.secondary : AppButtonVariant.primary,
            size: AppButtonSize.small,
          ),
        ],
      ),
    );
  }
}
