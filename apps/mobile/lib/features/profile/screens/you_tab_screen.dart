import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/avatar.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/components/guest_tab_placeholder.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/widgets/soft_auth_sheet.dart';
import '../providers/profile_provider.dart';

/// You Tab — own profile (Wireframe G1).
class YouTabScreen extends ConsumerWidget {
  const YouTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isGuest = ref.watch(authProvider.select((s) => s.isGuest));
    if (isGuest) {
      return const GuestTabPlaceholder(
        icon: PhosphorIconsFill.userCircle,
        title: 'Your profile lives here',
        description:
            'Sign in to save postcards, follow creators, and build your profile.',
        ctaLabel: 'Sign in',
        trigger: SoftAuthTrigger.save,
      );
    }

    final user = ref.watch(authProvider.select((s) => s.user));
    final completionAsync = ref.watch(profileCompletionProvider);
    final isCreator = user?['is_creator'] as bool? ?? false;
    final userId = user?['id'] as String? ?? '';

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _YouHeader(
                onBell: () => context.push('/notifications/preferences'),
              ),
              _ProfileHero(
                user: user,
                onEdit: () => context.push('/profile/edit'),
                onShare: () {
                  HapticFeedback.lightImpact();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Profile sharing coming soon')),
                  );
                },
              ),
              const SizedBox(height: 16),
              completionAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (c) {
                  if (c.percentage >= 100) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: _CompletionCard(completion: c),
                  );
                },
              ),
              _StatsGrid(user: user),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ACCOUNT',
                      style: AppTypography.label.copyWith(
                        fontSize: 10,
                        color: AppColors.inkMuted,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _AccountCard(isCreator: isCreator, userId: userId),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Center(
                child: TextButton(
                  onPressed: () => _confirmSignOut(context, ref),
                  child: Text(
                    'Sign Out',
                    style: AppTypography.body.copyWith(color: AppColors.danger),
                  ),
                ),
              ),
              const SizedBox(height: 36),
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
            child: Text(
              'Cancel',
              style: AppTypography.body.copyWith(color: AppColors.inkSoft),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ref.read(authProvider.notifier).signOut();
            },
            child: Text(
              'Sign Out',
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Header ───────────────────────────────────────────────────────

class _YouHeader extends StatelessWidget {
  final VoidCallback onBell;
  const _YouHeader({required this.onBell});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 8, 14),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.hairline, width: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'You',
              style: GoogleFonts.fraunces(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
                letterSpacing: -0.3,
              ),
            ),
          ),
          IconButton(
            onPressed: () {
              HapticFeedback.selectionClick();
              onBell();
            },
            icon: Icon(
              PhosphorIcons.bell(PhosphorIconsStyle.regular),
              size: 22,
              color: AppColors.ink,
            ),
            tooltip: 'Notifications',
          ),
        ],
      ),
    );
  }
}

// ─── Profile Hero ─────────────────────────────────────────────────

class _ProfileHero extends StatelessWidget {
  final Map<String, dynamic>? user;
  final VoidCallback onEdit;
  final VoidCallback onShare;

  const _ProfileHero({
    required this.user,
    required this.onEdit,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    final displayName = user?['display_name'] as String? ?? '';
    final username = user?['username'] as String?;
    final bio = user?['bio'] as String?;
    final avatarUrl = user?['avatar_url'] as String?;
    final isCreator = user?['is_creator'] as bool? ?? false;
    final cityMap = user?['current_city'] as Map<String, dynamic>?;
    final cityName = cityMap?['name'] as String?;

    final handleLine = [
      if (username != null) '@$username',
      if (cityName != null) cityName,
    ].join(' · ');

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
      color: AppColors.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isCreator
                        ? AppColors.coral
                        : AppColors.hairlineStrong,
                    width: isCreator ? 2.5 : 1.5,
                    strokeAlign: BorderSide.strokeAlignOutside,
                  ),
                ),
                child: AppAvatar(
                  imageUrl: avatarUrl,
                  name: displayName.isNotEmpty ? displayName : '?',
                  size: 64,
                ),
              ),
              const SizedBox(width: 14),

              // Name + handle + city + creator tag
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName.isNotEmpty ? displayName : 'Add your name',
                      style: GoogleFonts.fraunces(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: displayName.isNotEmpty
                            ? AppColors.ink
                            : AppColors.inkMuted,
                        letterSpacing: -0.3,
                        height: 1.05,
                      ),
                    ),
                    if (handleLine.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        handleLine,
                        style: AppTypography.caption.copyWith(
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ],
                    if (isCreator) ...[
                      const SizedBox(height: 8),
                      _CreatorBadge(),
                    ],
                  ],
                ),
              ),
            ],
          ),

          // Bio
          if (bio != null && bio.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              bio,
              style: GoogleFonts.fraunces(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: AppColors.inkSoft,
                height: 1.5,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],

          const SizedBox(height: 14),

          // Edit + Share row
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: 'Edit profile',
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    onEdit();
                  },
                  variant: AppButtonVariant.dark,
                  size: AppButtonSize.small,
                  fullWidth: true,
                ),
              ),
              const SizedBox(width: 8),
              AppButton(
                label: '',
                onPressed: onShare,
                variant: AppButtonVariant.outline,
                size: AppButtonSize.small,
                leadingIcon: PhosphorIcons.shareNetwork(PhosphorIconsStyle.regular),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CreatorBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
            size: 12,
            color: AppColors.success,
          ),
          const SizedBox(width: 4),
          Text(
            'Verified creator',
            style: AppTypography.label.copyWith(
              color: AppColors.success,
              fontSize: 11,
            ),
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
          ...completion.items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  Icon(
                    item.done
                        ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill)
                        : PhosphorIcons.circle(PhosphorIconsStyle.regular),
                    size: 18,
                    color: item.done
                        ? AppColors.success
                        : AppColors.hairlineStrong,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    item.label,
                    style: AppTypography.bodySmall.copyWith(
                      color: item.done ? AppColors.inkSoft : AppColors.ink,
                      decoration:
                          item.done ? TextDecoration.lineThrough : null,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Stats Grid ───────────────────────────────────────────────────

class _StatsGrid extends ConsumerWidget {
  final Map<String, dynamic>? user;
  const _StatsGrid({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(youStatsProvider);
    final followingCount = user?['following_count'] as int? ?? 0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: statsAsync.when(
        loading: () => _buildGrid(context, 0, 0, 0, followingCount, loading: true),
        error: (_, __) => _buildGrid(context, 0, 0, 0, followingCount),
        data: (s) => _buildGrid(
          context,
          s.savedItemCount,
          s.upcomingBookingsCount,
          s.completedBookingsCount,
          followingCount,
        ),
      ),
    );
  }

  Widget _buildGrid(
    BuildContext context,
    int saved,
    int bookings,
    int completed,
    int following, {
    bool loading = false,
  }) {
    final tiles = [
      _TileData(
        icon: PhosphorIcons.bookmark(PhosphorIconsStyle.fill),
        label: 'Saved',
        count: saved,
        onTap: () => context.push('/saved'),
      ),
      _TileData(
        icon: PhosphorIcons.ticket(PhosphorIconsStyle.fill),
        label: 'Bookings',
        count: bookings,
        onTap: () => context.push('/bookings'),
      ),
      _TileData(
        icon: PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
        label: 'Completed',
        count: completed,
        onTap: () => context.push('/bookings'),
      ),
      _TileData(
        icon: PhosphorIcons.users(PhosphorIconsStyle.fill),
        label: 'Following',
        count: following,
        onTap: null,
      ),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      childAspectRatio: 2.4,
      children: tiles
          .map((t) => _StatTile(data: t, loading: loading))
          .toList(),
    );
  }
}

class _TileData {
  final IconData icon;
  final String label;
  final int count;
  final VoidCallback? onTap;

  const _TileData({
    required this.icon,
    required this.label,
    required this.count,
    required this.onTap,
  });
}

class _StatTile extends StatelessWidget {
  final _TileData data;
  final bool loading;

  const _StatTile({required this.data, this.loading = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: data.onTap != null
          ? () {
              HapticFeedback.selectionClick();
              data.onTap!();
            }
          : null,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(data.icon, size: 16, color: AppColors.ink),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: loading
                  ? const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SkeletonRect(width: 32, height: 20, borderRadius: 4),
                        SizedBox(height: 4),
                        SkeletonRect(width: 48, height: 10, borderRadius: 3),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${data.count}',
                          style: GoogleFonts.fraunces(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink,
                            height: 1,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          data.label,
                          style: AppTypography.label.copyWith(
                            fontSize: 11,
                            color: AppColors.inkMuted,
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Account Card ─────────────────────────────────────────────────

class _AccountCard extends StatelessWidget {
  final bool isCreator;
  final String userId;

  const _AccountCard({required this.isCreator, required this.userId});

  @override
  Widget build(BuildContext context) {
    const divider = Divider(
      height: 0.5,
      thickness: 0.5,
      color: AppColors.hairline,
      indent: 58,
    );

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          if (isCreator) ...[
            _AccountRow(
              icon: PhosphorIcons.identification(PhosphorIconsStyle.regular),
              label: 'Creator profile',
              subtitle: 'Your public page',
              onTap: () => context.push('/profile/$userId'),
            ),
            divider,
          ],
          _AccountRow(
            icon: PhosphorIcons.link(PhosphorIconsStyle.regular),
            label: 'Connected accounts',
            subtitle: 'Instagram, YouTube & more',
            onTap: () {
              HapticFeedback.selectionClick();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Social account linking coming soon'),
                ),
              );
            },
          ),
          divider,
          _AccountRow(
            icon: PhosphorIcons.bell(PhosphorIconsStyle.regular),
            label: 'Notifications',
            subtitle: 'Booking alerts & digest',
            onTap: () => context.push('/notifications/preferences'),
          ),
          divider,
          _AccountRow(
            icon: PhosphorIcons.ticket(PhosphorIconsStyle.regular),
            label: 'My bookings',
            subtitle: 'Upcoming & past experiences',
            onTap: () => context.push('/bookings'),
          ),
          if (isCreator) ...[
            divider,
            _AccountRow(
              icon: PhosphorIcons.wallet(PhosphorIconsStyle.regular),
              label: 'Payouts',
              subtitle: 'Earnings & bank details',
              onTap: () => context.push('/studio'),
            ),
          ],
          divider,
          _AccountRow(
            icon: PhosphorIcons.shieldCheck(PhosphorIconsStyle.regular),
            label: 'Privacy & data',
            subtitle: null,
            onTap: () => context.push('/privacy-settings'),
          ),
        ],
      ),
    );
  }
}

class _AccountRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;

  const _AccountRow({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 16, color: AppColors.inkSoft),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppTypography.body.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: AppTypography.label.copyWith(
                        fontSize: 11,
                        color: AppColors.inkMuted,
                      ),
                    ),
                ],
              ),
            ),
            Icon(
              PhosphorIcons.caretRight(PhosphorIconsStyle.regular),
              size: 14,
              color: AppColors.inkMuted,
            ),
          ],
        ),
      ),
    );
  }
}
