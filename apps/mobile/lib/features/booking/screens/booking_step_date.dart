import 'dart:async' show unawaited;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/toast.dart';
import '../../experiences/providers/experience_provider.dart';
import '../providers/waitlist_provider.dart';

/// Step 1 of the booking flow (experience only): pick a scheduled date.
///
/// Sold-out dates render with a coral "Join waitlist" affordance instead of
/// being selectable. Selecting a date hands the chosen [ScheduledDate]
/// back to the parent shell via [onSelected].
class BookingStepDate extends ConsumerWidget {
  final String contentId;
  final String? selectedDateId;
  final ValueChanged<ScheduledDate> onSelected;

  const BookingStepDate({
    super.key,
    required this.contentId,
    required this.selectedDateId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final datesAsync = ref.watch(experienceDatesProvider(contentId));

    return datesAsync.when(
      loading: () => const _DateListSkeleton(),
      error: (e, _) => _ErrorView(
        message: e.toString(),
        onRetry: () => ref.invalidate(experienceDatesProvider(contentId)),
      ),
      data: (dates) {
        if (dates.isEmpty) {
          return const _EmptyView();
        }
        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(
            Layout.screenPaddingH,
            Spacing.xl,
            Layout.screenPaddingH,
            Spacing.xxl,
          ),
          itemCount: dates.length + 1,
          separatorBuilder: (_, _) => const SizedBox(height: Spacing.md),
          itemBuilder: (context, index) {
            if (index == 0) {
              return Padding(
                padding: const EdgeInsets.only(bottom: Spacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Choose your date', style: typ.AppTypography.h3),
                    const SizedBox(height: Spacing.xs),
                    Text(
                      'Tap a slot to continue',
                      style: typ.AppTypography.bodySmall
                          .copyWith(color: AppColors.inkSoft),
                    ),
                  ],
                ),
              );
            }
            final date = dates[index - 1];
            return _DateCard(
              date: date,
              selected: date.id == selectedDateId,
              onSelect: () {
                if (!date.isActive || date.isSoldOut) return;
                unawaited(HapticFeedback.selectionClick());
                onSelected(date);
              },
              onJoinWaitlist: () =>
                  _onJoinWaitlist(context, ref, contentId, date),
            );
          },
        );
      },
    );
  }

  Future<void> _onJoinWaitlist(
    BuildContext context,
    WidgetRef ref,
    String contentId,
    ScheduledDate date,
  ) async {
    unawaited(HapticFeedback.lightImpact());
    final ok = await ref.read(waitlistActionProvider.notifier).joinWaitlist(
          contentId: contentId,
          scheduledDateId: date.id,
        );
    if (!context.mounted) return;
    if (ok) {
      showAppToast(context, "We'll notify you if a spot opens up.");
    } else {
      final err = ref.read(waitlistActionProvider).error ??
          'Could not join waitlist';
      showAppToast(context, err);
    }
  }
}

// ── Date Card ─────────────────────────────────────────────────────

class _DateCard extends StatelessWidget {
  final ScheduledDate date;
  final bool selected;
  final VoidCallback onSelect;
  final VoidCallback onJoinWaitlist;

  const _DateCard({
    required this.date,
    required this.selected,
    required this.onSelect,
    required this.onJoinWaitlist,
  });

  @override
  Widget build(BuildContext context) {
    final start = DateTime.tryParse(date.startDate);
    final end = DateTime.tryParse(date.endDate);
    final dateRange = _formatRange(start, end);
    final soldOut = date.isSoldOut;
    final spotsLeft = date.spotsLeft;

    return GestureDetector(
      onTap: soldOut ? null : onSelect,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(Layout.cardPadding),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: selected
                ? AppColors.coral
                : (soldOut ? AppColors.hairline : AppColors.hairlineStrong),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              PhosphorIconsFill.calendarBlank,
              size: 22,
              color: soldOut ? AppColors.inkFaint : AppColors.ink,
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    dateRange,
                    style: typ.AppTypography.h4.copyWith(
                      color: soldOut ? AppColors.inkMuted : AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: Spacing.xs),
                  Text(
                    soldOut
                        ? 'Sold out'
                        : '$spotsLeft of ${date.capacity} spots left',
                    style: typ.AppTypography.caption.copyWith(
                      color: soldOut ? AppColors.danger : AppColors.inkSoft,
                    ),
                  ),
                ],
              ),
            ),
            if (soldOut)
              GestureDetector(
                onTap: onJoinWaitlist,
                behavior: HitTestBehavior.opaque,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Spacing.md,
                    vertical: Spacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primaryTint,
                    borderRadius: BorderRadius.circular(Layout.chipRadius),
                  ),
                  child: Text(
                    'Join waitlist',
                    style: typ.AppTypography.label.copyWith(
                      color: AppColors.coral,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              )
            else if (selected)
              Icon(
                PhosphorIconsFill.checkCircle,
                size: 22,
                color: AppColors.coral,
              ),
          ],
        ),
      ),
    );
  }

  String _formatRange(DateTime? start, DateTime? end) {
    if (start == null) return 'TBA';
    final fmt = DateFormat('d MMM');
    if (end == null || _sameDay(start, end)) {
      return DateFormat('d MMM y').format(start);
    }
    if (start.year == end.year) {
      return '${fmt.format(start)} – ${DateFormat('d MMM y').format(end)}';
    }
    return '${DateFormat('d MMM y').format(start)} – ${DateFormat('d MMM y').format(end)}';
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

// ── Skeleton ──────────────────────────────────────────────────────

class _DateListSkeleton extends StatelessWidget {
  const _DateListSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          Layout.screenPaddingH,
          Spacing.xl,
          Layout.screenPaddingH,
          Spacing.xxl,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SkeletonLine(width: 160, height: 22),
            SizedBox(height: Spacing.lg),
            SkeletonRect(height: 76, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.md),
            SkeletonRect(height: 76, borderRadius: Layout.cardRadius),
            SizedBox(height: Spacing.md),
            SkeletonRect(height: 76, borderRadius: Layout.cardRadius),
          ],
        ),
      ),
    );
  }
}

// ── Empty / Error views ───────────────────────────────────────────

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Layout.screenPaddingH),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIconsFill.calendarBlank,
              size: 36,
              color: AppColors.inkMuted,
            ),
            const SizedBox(height: Spacing.md),
            Text(
              'No upcoming dates yet',
              style: typ.AppTypography.h4,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.xs),
            Text(
              'Check back soon — the host will publish dates here.',
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.inkSoft),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Layout.screenPaddingH),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIconsFill.warningCircle,
              size: 36,
              color: AppColors.danger,
            ),
            const SizedBox(height: Spacing.md),
            Text(message,
                style: typ.AppTypography.bodySmall
                    .copyWith(color: AppColors.inkSoft),
                textAlign: TextAlign.center),
            const SizedBox(height: Spacing.md),
            TextButton(
              onPressed: onRetry,
              child: Text(
                'Retry',
                style: typ.AppTypography.body.copyWith(color: AppColors.coral),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
