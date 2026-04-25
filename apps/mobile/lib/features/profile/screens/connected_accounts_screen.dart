import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../auth/providers/auth_provider.dart';

// ── Models ─────────────────────────────────────────────────────────

enum SocialPlatform {
  instagram,
  youtube;

  String get displayName => switch (this) {
        instagram => 'Instagram',
        youtube => 'YouTube',
      };

  String get handlePrefix => switch (this) {
        instagram => '@',
        youtube => '@',
      };

  IconData get icon => switch (this) {
        instagram => PhosphorIconsFill.instagramLogo,
        youtube => PhosphorIconsFill.youtubeLogo,
      };

  Color get brandColor => switch (this) {
        instagram => const Color(0xFFE1306C),
        youtube => const Color(0xFFFF0000),
      };
}

class ConnectedAccount {
  final SocialPlatform platform;
  final String handle;
  final int followerCount;
  final DateTime connectedAt;
  final DateTime? lastSyncedAt;
  final bool isSyncing;

  const ConnectedAccount({
    required this.platform,
    required this.handle,
    required this.followerCount,
    required this.connectedAt,
    this.lastSyncedAt,
    this.isSyncing = false,
  });

  factory ConnectedAccount.fromJson(Map<String, dynamic> json) {
    final platformStr = json['platform'] as String? ?? '';
    final platform = platformStr == 'youtube'
        ? SocialPlatform.youtube
        : SocialPlatform.instagram;
    return ConnectedAccount(
      platform: platform,
      handle: json['handle'] as String? ?? '',
      followerCount: json['follower_count'] as int? ?? 0,
      connectedAt: DateTime.tryParse(json['connected_at'] as String? ?? '') ??
          DateTime.now(),
      lastSyncedAt:
          DateTime.tryParse(json['last_synced_at'] as String? ?? ''),
    );
  }
}

// ── Provider ───────────────────────────────────────────────────────

class ConnectedAccountsState {
  final List<ConnectedAccount> accounts;
  final bool isLoading;
  final String? error;

  const ConnectedAccountsState({
    this.accounts = const [],
    this.isLoading = false,
    this.error,
  });

  ConnectedAccountsState copyWith({
    List<ConnectedAccount>? accounts,
    bool? isLoading,
    String? error,
  }) =>
      ConnectedAccountsState(
        accounts: accounts ?? this.accounts,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class ConnectedAccountsNotifier extends Notifier<ConnectedAccountsState> {
  @override
  ConnectedAccountsState build() {
    Future.microtask(_load);
    return const ConnectedAccountsState(isLoading: true);
  }

  Future<void> _load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get('/api/v1/profile/connected-accounts');
      final list =
          (res.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
      state = state.copyWith(
        accounts: list
            .map((e) => ConnectedAccount.fromJson(e as Map<String, dynamic>))
            .toList(),
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Failed to load connected accounts',
      );
    } catch (_) {
      state = state.copyWith(
          isLoading: false, error: 'Failed to load connected accounts');
    }
  }

  Future<void> refresh() => _load();

  /// Disconnect a platform. DELETE /api/v1/profile/connected-accounts/:platform
  Future<bool> disconnect(SocialPlatform platform) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.delete('/api/v1/profile/connected-accounts/${platform.name}');
      await _load();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Trigger a manual sync. POST /api/v1/profile/connected-accounts/:platform/sync
  /// Rate-limited to once per 5 minutes (enforced server-side, code respects 429).
  Future<void> sync(SocialPlatform platform) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.post(
          '/api/v1/profile/connected-accounts/${platform.name}/sync');
      await _load();
    } on DioException catch (e) {
      if (e.response?.statusCode == 429) {
        // Server enforces 5-min rate limit — silently swallow (already fresh data)
      }
    }
  }
}

final connectedAccountsProvider = NotifierProvider.autoDispose<
    ConnectedAccountsNotifier, ConnectedAccountsState>(ConnectedAccountsNotifier.new);

// ── Screen ─────────────────────────────────────────────────────────

/// G3 — Connected Accounts screen (IAM-FR-009).
/// Lists Instagram and YouTube connections; lets user connect/disconnect.
class ConnectedAccountsScreen extends ConsumerWidget {
  const ConnectedAccountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(connectedAccountsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
          behavior: HitTestBehavior.opaque,
          child: const SizedBox(
            width: 44,
            height: 44,
            child: Icon(
              PhosphorIconsRegular.arrowLeft,
              size: 22,
              color: AppColors.ink,
            ),
          ),
        ),
        title: Text('Connected accounts', style: AppTypography.h3),
        centerTitle: false,
      ),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: () =>
              ref.read(connectedAccountsProvider.notifier).refresh(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH, Spacing.lg,
                    Layout.screenPaddingH, Spacing.sm,
                  ),
                  child: Text(
                    'Link your social accounts to display your follower count and show verified social reach on your creator profile.',
                    style: AppTypography.body.copyWith(color: AppColors.inkSoft),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.md)),

              // Permissions transparency card (IAM-FR-012)
              SliverToBoxAdapter(
                child: _PermissionsCard(),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: Spacing.xl)),

              // Platform tiles
              if (state.isLoading && state.accounts.isEmpty)
                const SliverToBoxAdapter(child: _LoadingTiles())
              else ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Layout.screenPaddingH,
                    ),
                    child: Text('Accounts', style: AppTypography.h4),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: Spacing.md)),
                SliverToBoxAdapter(
                  child: _PlatformList(state: state),
                ),
              ],

              if (state.error != null)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Layout.screenPaddingH,
                      vertical: Spacing.md,
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(Spacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.dangerSurface,
                        borderRadius:
                            BorderRadius.circular(Layout.cardRadius),
                      ),
                      child: Text(
                        state.error!,
                        style: AppTypography.bodySmall
                            .copyWith(color: AppColors.danger),
                      ),
                    ),
                  ),
                ),

              const SliverToBoxAdapter(
                child: SizedBox(height: Spacing.xxxl),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Permissions card (IAM-FR-012) ─────────────────────────────────

class _PermissionsCard extends StatefulWidget {
  @override
  State<_PermissionsCard> createState() => _PermissionsCardState();
}

class _PermissionsCardState extends State<_PermissionsCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Container(
        padding: const EdgeInsets.all(Layout.cardPadding),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  PhosphorIcons.shieldCheck(PhosphorIconsStyle.fill),
                  size: 16,
                  color: AppColors.success,
                ),
                const SizedBox(width: Spacing.xs),
                Text(
                  'What we access',
                  style: AppTypography.label.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _expanded = !_expanded);
                  },
                  child: Icon(
                    _expanded
                        ? PhosphorIcons.caretUp()
                        : PhosphorIcons.caretDown(),
                    size: 16,
                    color: AppColors.inkSoft,
                  ),
                ),
              ],
            ),
            if (_expanded) ...[
              const SizedBox(height: Spacing.md),
              _PermissionRow(
                icon: PhosphorIconsRegular.check,
                text: 'Username and follower count (read-only)',
                allowed: true,
              ),
              const SizedBox(height: Spacing.xs),
              _PermissionRow(
                icon: PhosphorIconsRegular.check,
                text: 'Display on your CreatorHub profile',
                allowed: true,
              ),
              const SizedBox(height: Spacing.xs),
              _PermissionRow(
                icon: PhosphorIconsRegular.x,
                text: 'Post, message, or modify your content',
                allowed: false,
              ),
              const SizedBox(height: Spacing.xs),
              _PermissionRow(
                icon: PhosphorIconsRegular.x,
                text: 'Access DMs or private data',
                allowed: false,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PermissionRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final bool allowed;

  const _PermissionRow({
    required this.icon,
    required this.text,
    required this.allowed,
  });

  @override
  Widget build(BuildContext context) {
    final color = allowed ? AppColors.success : AppColors.inkSoft;
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: Spacing.sm),
        Expanded(
          child: Text(
            text,
            style: AppTypography.bodySmall.copyWith(color: color),
          ),
        ),
      ],
    );
  }
}

// ── Platform list ──────────────────────────────────────────────────

class _PlatformList extends ConsumerWidget {
  final ConnectedAccountsState state;

  const _PlatformList({required this.state});

  bool _isConnected(SocialPlatform platform) =>
      state.accounts.any((a) => a.platform == platform);

  ConnectedAccount? _account(SocialPlatform platform) =>
      state.accounts.where((a) => a.platform == platform).firstOrNull;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        children: SocialPlatform.values.map((platform) {
          final connected = _isConnected(platform);
          final account = _account(platform);
          return Padding(
            padding: const EdgeInsets.only(bottom: Spacing.sm),
            child: _PlatformTile(
              platform: platform,
              account: account,
              isConnected: connected,
              onConnect: () => _handleConnect(context, platform),
              onDisconnect: () => _handleDisconnect(context, ref, platform),
              onSync: () =>
                  ref.read(connectedAccountsProvider.notifier).sync(platform),
            ),
          );
        }).toList(),
      ),
    );
  }

  void _handleConnect(BuildContext context, SocialPlatform platform) {
    HapticFeedback.lightImpact();
    // IAM-FR-009: OAuth flow — opens platform OAuth URL.
    // In M1, deep-link back via /profile/connected-accounts?connected=instagram
    // For now shows a coming-soon sheet.
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _ConnectSheet(platform: platform),
    );
  }

  Future<void> _handleDisconnect(
    BuildContext context,
    WidgetRef ref,
    SocialPlatform platform,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.bg,
        title: Text(
          'Disconnect ${platform.displayName}?',
          style: AppTypography.h4,
        ),
        content: Text(
          'Your ${platform.displayName} follower count will no longer appear on your profile.',
          style: AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(
              'Cancel',
              style: AppTypography.body.copyWith(color: AppColors.inkSoft),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(
              'Disconnect',
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref
          .read(connectedAccountsProvider.notifier)
          .disconnect(platform);
    }
  }
}

class _PlatformTile extends StatelessWidget {
  final SocialPlatform platform;
  final ConnectedAccount? account;
  final bool isConnected;
  final VoidCallback onConnect;
  final VoidCallback onDisconnect;
  final VoidCallback onSync;

  const _PlatformTile({
    required this.platform,
    required this.account,
    required this.isConnected,
    required this.onConnect,
    required this.onDisconnect,
    required this.onSync,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(
          color: isConnected
              ? platform.brandColor.withValues(alpha: 0.3)
              : AppColors.hairline,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Brand icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: platform.brandColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  platform.icon,
                  size: 22,
                  color: platform.brandColor,
                ),
              ),
              const SizedBox(width: Spacing.md),

              // Platform name + handle
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      platform.displayName,
                      style: AppTypography.body.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (isConnected && account != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        '${platform.handlePrefix}${account!.handle} · ${_fmtCount(account!.followerCount)} followers',
                        style: AppTypography.caption
                            .copyWith(color: AppColors.inkSoft),
                      ),
                    ] else ...[
                      const SizedBox(height: 2),
                      Text(
                        'Not connected',
                        style: AppTypography.caption
                            .copyWith(color: AppColors.inkFaint),
                      ),
                    ],
                  ],
                ),
              ),

              // Connect / Disconnect button
              if (isConnected)
                GestureDetector(
                  onTap: onDisconnect,
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.md,
                      vertical: Spacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceAlt,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.hairline),
                    ),
                    child: Text(
                      'Disconnect',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.inkSoft,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                )
              else
                AppButton(
                  label: 'Connect',
                  onPressed: onConnect,
                  variant: AppButtonVariant.outline,
                  size: AppButtonSize.small,
                ),
            ],
          ),

          // Last synced + manual sync (IAM-FR-009: 5-min rate limit enforced server-side)
          if (isConnected && account != null) ...[
            const SizedBox(height: Spacing.md),
            const Divider(color: AppColors.hairline, height: 1),
            const SizedBox(height: Spacing.sm),
            Row(
              children: [
                Icon(
                  PhosphorIcons.arrowsClockwise(PhosphorIconsStyle.regular),
                  size: 13,
                  color: AppColors.inkFaint,
                ),
                const SizedBox(width: Spacing.xs),
                Text(
                  account!.lastSyncedAt != null
                      ? 'Synced ${_fmtRelative(account!.lastSyncedAt!)}'
                      : 'Never synced',
                  style: AppTypography.caption
                      .copyWith(color: AppColors.inkFaint),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: onSync,
                  behavior: HitTestBehavior.opaque,
                  child: const SizedBox(
                    height: Layout.minTapTarget,
                    child: Center(
                      child: Text(
                        'Sync now',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.coral,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _fmtCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }

  String _fmtRelative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

// ── Connect sheet ──────────────────────────────────────────────────

class _ConnectSheet extends StatelessWidget {
  final SocialPlatform platform;

  const _ConnectSheet({required this.platform});

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Layout.sheetRadius),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        Spacing.xl, Spacing.lg, Spacing.xl, bottom + Spacing.xl,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: Layout.sheetHandleWidth,
              height: Layout.sheetHandleHeight,
              decoration: BoxDecoration(
                color: AppColors.hairlineStrong.withValues(alpha: 0.3),
                borderRadius:
                    BorderRadius.circular(Layout.sheetHandleHeight / 2),
              ),
            ),
          ),
          const SizedBox(height: Spacing.lg),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: platform.brandColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(platform.icon, size: 26, color: platform.brandColor),
          ),
          const SizedBox(height: Spacing.md),
          Text(
            'Connect ${platform.displayName}',
            style: AppTypography.h4,
          ),
          const SizedBox(height: Spacing.xs),
          Text(
            'You\'ll be redirected to ${platform.displayName} to authorise read-only access to your follower count. We never post on your behalf.',
            style: AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),
          AppButton(
            label: 'Continue to ${platform.displayName}',
            onPressed: () {
              // TODO M1: launch OAuth URL via url_launcher
              // The redirect URI will be: creatorhub://profile/connected-accounts
              HapticFeedback.lightImpact();
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('OAuth integration coming in M1'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            variant: AppButtonVariant.primary,
            fullWidth: true,
          ),
          const SizedBox(height: Spacing.sm),
          AppButton(
            label: 'Cancel',
            onPressed: () => Navigator.of(context).pop(),
            variant: AppButtonVariant.ghost,
            fullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Loading state ──────────────────────────────────────────────────

class _LoadingTiles extends StatelessWidget {
  const _LoadingTiles();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
        child: Column(
          children: [
            SkeletonRect(height: 88, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.sm),
            SkeletonRect(height: 88, borderRadius: Layout.cardRadius),
          ],
        ),
      ),
    );
  }
}
