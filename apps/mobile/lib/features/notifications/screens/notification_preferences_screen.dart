import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../providers/notification_provider.dart';

// ── Category + channel constants ──────────────────────────────────

const _categoryLabels = {
  'bookings_trips': 'Bookings & Trips',
  'messages_creators': 'Messages from Creators',
  'new_content_followed': 'New Content from Follows',
  'activity_own_content': 'Activity on Your Content',
  'platform_updates': 'Platform Updates',
  'promotions': 'Promotions & Offers',
};

/// Ordered list of categories for display.
const _orderedCategories = [
  'bookings_trips',
  'messages_creators',
  'new_content_followed',
  'activity_own_content',
  'platform_updates',
  'promotions',
];

const _channels = ['push', 'whatsapp', 'email'];

/// The bookings_trips + whatsapp cell is locked — cannot be toggled.
bool _isLocked(String category, String channel) =>
    category == 'bookings_trips' && channel == 'whatsapp';

// ── Screen ────────────────────────────────────────────────────────

class NotificationPreferencesScreen extends ConsumerWidget {
  const NotificationPreferencesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifState = ref.watch(notificationPrefsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular),
            color: AppColors.ink,
            size: 22,
          ),
          onPressed: () {
            HapticFeedback.lightImpact();
            Navigator.of(context).maybePop();
          },
        ),
        title: Text('Notifications', style: AppTypography.h4),
        centerTitle: false,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(0.5),
          child: Container(height: 0.5, color: AppColors.hairline),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // DND section
            _DndSection(
              enabled: notifState.dndEnabled,
              isLoading: notifState.isLoading,
              onChanged: (value) {
                HapticFeedback.lightImpact();
                ref
                    .read(notificationPrefsProvider.notifier)
                    .setDnd(value)
                    .catchError((_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Failed to update Do Not Disturb'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                });
              },
            ),

            // Quiet hours placeholder
            _QuietHoursRow(),

            // Preferences matrix
            Expanded(
              child: notifState.isLoading
                  ? _MatrixSkeleton()
                  : notifState.error != null
                      ? _ErrorState(
                          onRetry: () => ref
                              .read(notificationPrefsProvider.notifier)
                              .retry(),
                        )
                      : SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const SizedBox(height: Spacing.lg),
                              const _MatrixHeader(),
                              const Divider(
                                height: 0.5,
                                thickness: 0.5,
                                color: AppColors.hairline,
                              ),
                              ..._orderedCategories.map((category) {
                                return _CategoryRow(
                                  category: category,
                                  state: notifState,
                                  onToggle: (channel, enabled) {
                                    HapticFeedback.lightImpact();
                                    ref
                                        .read(
                                            notificationPrefsProvider.notifier)
                                        .togglePreference(
                                            category, channel, enabled)
                                        .catchError((_) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                                'Failed to update preference'),
                                            behavior: SnackBarBehavior.floating,
                                          ),
                                        );
                                      }
                                    });
                                  },
                                  onLockedTap: () {
                                    HapticFeedback.lightImpact();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Booking WhatsApp alerts cannot be turned off for your safety.',
                                        ),
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  },
                                );
                              }),
                              const SizedBox(height: Spacing.xxl),
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── DND Section ───────────────────────────────────────────────────

class _DndSection extends StatelessWidget {
  final bool enabled;
  final bool isLoading;
  final ValueChanged<bool> onChanged;

  const _DndSection({
    required this.enabled,
    required this.isLoading,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.hairline, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Icon(
            PhosphorIcons.bellSlash(PhosphorIconsStyle.regular),
            size: 24,
            color: enabled ? AppColors.coral : AppColors.inkSoft,
          ),
          const SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Do Not Disturb',
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Pauses push & WhatsApp. Booking alerts always come through.',
                  style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.sm),
          isLoading
              ? const SizedBox(
                  width: 51,
                  height: 31,
                  child: SkeletonLoader(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: AppColors.shimmerBase,
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                    ),
                  ),
                )
              : Switch(
                  value: enabled,
                  onChanged: onChanged,
                  activeColor: AppColors.coral,
                ),
        ],
      ),
    );
  }
}

// ── Quiet Hours Row ───────────────────────────────────────────────

class _QuietHoursRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.hairline, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Icon(
            PhosphorIcons.clock(PhosphorIconsStyle.regular),
            size: 22,
            color: AppColors.inkMuted,
          ),
          const SizedBox(width: Spacing.md),
          Expanded(
            child: Text(
              'Quiet Hours',
              style: AppTypography.body.copyWith(color: AppColors.inkMuted),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.sm,
              vertical: Spacing.xs,
            ),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Coming soon',
              style: AppTypography.label.copyWith(
                fontSize: 10,
                color: AppColors.inkMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Matrix Header ─────────────────────────────────────────────────

class _MatrixHeader extends StatelessWidget {
  const _MatrixHeader();

  @override
  Widget build(BuildContext context) {
    final channelIcons = {
      'push': PhosphorIcons.bell(PhosphorIconsStyle.regular),
      'whatsapp': PhosphorIcons.shareNetwork(PhosphorIconsStyle.regular),
      'email': PhosphorIcons.envelope(PhosphorIconsStyle.regular),
    };
    const channelLabels = {
      'push': 'Push',
      'whatsapp': 'WA',
      'email': 'Email',
    };

    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.sm,
      ),
      child: Row(
        children: [
          // Category label column spacer
          const Expanded(child: SizedBox()),
          // Channel header cells
          ..._channels.map((ch) {
            return SizedBox(
              width: 60,
              child: Column(
                children: [
                  Icon(
                    channelIcons[ch],
                    size: 16,
                    color: AppColors.inkSoft,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    channelLabels[ch] ?? ch,
                    style: AppTypography.caption.copyWith(
                      fontSize: 9,
                      color: AppColors.inkSoft,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ── Category Row ──────────────────────────────────────────────────

class _CategoryRow extends StatelessWidget {
  final String category;
  final NotificationPreferencesState state;
  final void Function(String channel, bool enabled) onToggle;
  final VoidCallback onLockedTap;

  const _CategoryRow({
    required this.category,
    required this.state,
    required this.onToggle,
    required this.onLockedTap,
  });

  /// Transactional categories are not dimmed by DND
  static const _transactional = {'bookings_trips'};

  @override
  Widget build(BuildContext context) {
    final label = _categoryLabels[category] ?? category;
    final isDnd = state.dndEnabled;
    final isTransactional = _transactional.contains(category);
    final isDimmed = isDnd && !isTransactional;

    return Opacity(
      opacity: isDimmed ? 0.5 : 1.0,
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(
            bottom: BorderSide(color: AppColors.hairline, width: 0.5),
          ),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: AppTypography.bodySmall,
              ),
            ),
            ..._channels.map((channel) {
              final locked = _isLocked(category, channel);
              final enabled = state.isEnabled(category, channel);

              return SizedBox(
                width: 60,
                child: Center(
                  child: locked
                      ? GestureDetector(
                          onTap: onLockedTap,
                          behavior: HitTestBehavior.opaque,
                          child: Icon(
                            PhosphorIcons.lock(PhosphorIconsStyle.fill),
                            size: 18,
                            color: AppColors.coral,
                          ),
                        )
                      : Switch(
                          value: enabled,
                          onChanged: isDimmed
                              ? null
                              : (val) => onToggle(channel, val),
                          activeColor: AppColors.coral,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

// ── Loading Skeleton ──────────────────────────────────────────────

class _MatrixSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Column(
        children: List.generate(6, (i) {
          return Container(
            height: 52,
            margin: const EdgeInsets.only(bottom: 0.5),
            color: AppColors.surface,
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.lg,
              vertical: Spacing.sm,
            ),
            child: Row(
              children: [
                Expanded(
                  child: SkeletonLine(
                    width: i.isEven ? 140 : 110,
                    height: 13,
                  ),
                ),
                ...List.generate(
                  3,
                  (_) => const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 14),
                    child: SkeletonLine(width: 32, height: 20),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// ── Error State ───────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Spacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIcons.wifiSlash(PhosphorIconsStyle.regular),
              size: 48,
              color: AppColors.inkMuted,
            ),
            const SizedBox(height: Spacing.lg),
            Text(
              'Could not load preferences',
              style: AppTypography.h4,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              'Check your connection and try again.',
              style: AppTypography.body.copyWith(color: AppColors.inkSoft),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.xl),
            OutlinedButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                onRetry();
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.coral,
                side: const BorderSide(color: AppColors.coral),
                padding: const EdgeInsets.symmetric(
                  horizontal: Spacing.xl,
                  vertical: Spacing.md,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                'Try Again',
                style: AppTypography.body.copyWith(
                  color: AppColors.coral,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
