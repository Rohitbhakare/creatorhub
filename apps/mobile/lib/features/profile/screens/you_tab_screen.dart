import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/avatar.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../widgets/profile_stats_row.dart';

/// You Tab — own profile (Screen 12 from wireframe).
class YouTabScreen extends ConsumerWidget {
  const YouTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider.select((s) => s.user));
    final completionAsync = ref.watch(profileCompletionProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              _HeroCard(user: user),
              const SizedBox(height: 16),
              completionAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (completion) {
                  if (completion.percentage >= 100) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _CompletionCard(completion: completion),
                  );
                },
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _SettingsCard(
                  onEditProfile: () => context.push('/profile/edit'),
                  onNotifications: () => context.push('/notifications/preferences'),
                  onSaved: () => context.push('/saved'),
                  onPrivacy: () => context.push('/privacy-settings'),
                  onSignOut: () => _confirmSignOut(context, ref),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmSignOut(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Sign Out', style: AppTypography.h4),
        content: Text(
          'Are you sure you want to sign out?',
          style: AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel', style: AppTypography.body.copyWith(color: AppColors.inkSoft)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ref.read(authProvider.notifier).signOut();
            },
            child: Text('Sign Out', style: AppTypography.body.copyWith(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

// ─── Hero Card ────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  final Map<String, dynamic>? user;
  const _HeroCard({required this.user});

  @override
  Widget build(BuildContext context) {
    final displayName = user?['display_name'] as String? ?? '';
    final username = user?['username'] as String?;
    final bio = user?['bio'] as String?;
    final avatarUrl = user?['avatar_url'] as String?;
    final isCreator = user?['is_creator'] as bool? ?? false;
    final followerCount = user?['follower_count'] as int? ?? 0;
    final followingCount = user?['following_count'] as int? ?? 0;
    final contentCount = user?['content_count'] as int? ?? 0;

    return Container(
      width: double.infinity,
      color: AppColors.surfaceAlt,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: isCreator ? AppColors.coral : AppColors.hairlineStrong,
                width: isCreator ? 2.5 : 1.5,
                strokeAlign: BorderSide.strokeAlignOutside,
              ),
            ),
            child: AppAvatar(
              imageUrl: avatarUrl,
              name: displayName.isNotEmpty ? displayName : '?',
              size: 84,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            displayName.isNotEmpty ? displayName : 'Add your name',
            style: GoogleFonts.fraunces(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: displayName.isNotEmpty ? AppColors.ink : AppColors.inkMuted,
            ),
          ),
          if (username != null) ...[
            const SizedBox(height: 2),
            Text(
              '@$username',
              style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
            ),
          ],
          if (bio != null && bio.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              bio,
              style: GoogleFonts.fraunces(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: AppColors.inkSoft,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 16),
          ProfileStatsRow(
            followerCount: followerCount,
            followingCount: followingCount,
            contentCount: contentCount,
            showContent: isCreator,
          ),
        ],
      ),
    );
  }
}

// ─── Profile Completion Card ──────────────────────────────────────

class _CompletionCard extends StatelessWidget {
  final ProfileCompletion completion;
  const _CompletionCard({required this.completion});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Complete your profile',
                  style: AppTypography.h4.copyWith(fontSize: 15),
                ),
              ),
              Text(
                '${completion.percentage}%',
                style: AppTypography.body.copyWith(
                  color: AppColors.coral,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: completion.percentage / 100,
              minHeight: 6,
              backgroundColor: AppColors.surfaceAlt,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.coral),
            ),
          ),
          const SizedBox(height: 12),
          ...completion.items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(
                      item.done
                          ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill)
                          : PhosphorIcons.circle(PhosphorIconsStyle.regular),
                      size: 18,
                      color: item.done ? AppColors.success : AppColors.hairlineStrong,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      item.label,
                      style: AppTypography.bodySmall.copyWith(
                        color: item.done ? AppColors.inkSoft : AppColors.ink,
                        decoration: item.done ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

// ─── Settings Card ────────────────────────────────────────────────

class _SettingsCard extends StatelessWidget {
  final VoidCallback onEditProfile;
  final VoidCallback onNotifications;
  final VoidCallback onSaved;
  final VoidCallback onPrivacy;
  final VoidCallback onSignOut;

  const _SettingsCard({
    required this.onEditProfile,
    required this.onNotifications,
    required this.onSaved,
    required this.onPrivacy,
    required this.onSignOut,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _SettingsRow(
            icon: PhosphorIcons.pencilSimple(PhosphorIconsStyle.regular),
            label: 'Edit Profile',
            onTap: onEditProfile,
          ),
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 48),
          _SettingsRow(
            icon: PhosphorIcons.bell(PhosphorIconsStyle.regular),
            label: 'Notifications',
            onTap: onNotifications,
          ),
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 48),
          _SettingsRow(
            icon: PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.regular),
            label: 'Saved',
            onTap: onSaved,
          ),
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 48),
          _SettingsRow(
            icon: PhosphorIcons.shieldCheck(PhosphorIconsStyle.regular),
            label: 'Privacy & Data',
            onTap: onPrivacy,
          ),
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 48),
          _SettingsRow(
            icon: PhosphorIcons.question(PhosphorIconsStyle.regular),
            label: 'Help',
            onTap: () {},
          ),
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 48),
          _SettingsRow(
            icon: PhosphorIcons.signOut(PhosphorIconsStyle.regular),
            label: 'Sign Out',
            onTap: onSignOut,
            isDestructive: true,
          ),
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _SettingsRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.danger : AppColors.ink;

    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: AppTypography.body.copyWith(color: color),
              ),
            ),
            if (!isDestructive)
              Icon(
                PhosphorIcons.caretRight(PhosphorIconsStyle.regular),
                size: 16,
                color: AppColors.inkMuted,
              ),
          ],
        ),
      ),
    );
  }
}
