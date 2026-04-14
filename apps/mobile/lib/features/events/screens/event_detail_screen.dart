import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/event_detail_provider.dart';
import '../widgets/date_block.dart';
import '../widgets/facts_grid.dart';
import '../widgets/meeting_point_card.dart';
import '../widgets/rsvp_bottom_bar.dart';
import '../widgets/whos_going.dart';

/// Read-only detail screen for a published event.
///
/// Layout: cover image → title → facts → date block → meeting point
/// → who's going → what to bring → creator → RSVP bottom bar
class EventDetailScreen extends ConsumerStatefulWidget {
  final String eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(eventDetailProvider(widget.eventId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: detailAsync.when(
        loading: () => const SafeArea(child: _LoadingSkeleton()),
        error: (error, _) => SafeArea(
          child: _ErrorView(
            message: error.toString(),
            onRetry: () =>
                ref.invalidate(eventDetailProvider(widget.eventId)),
          ),
        ),
        data: (event) => _buildContent(event),
      ),
    );
  }

  Widget _buildContent(EventDetail event) {
    return Stack(
      children: [
        // Scrollable content
        CustomScrollView(
          slivers: [
            // Cover image
            SliverToBoxAdapter(child: _buildCoverImage(event)),

            // Title + description
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  Layout.screenPaddingH,
                  Spacing.xl,
                  Layout.screenPaddingH,
                  0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(event.title, style: typ.AppTypography.h2),
                    if (event.description.isNotEmpty) ...[
                      const SizedBox(height: Spacing.sm),
                      Text(
                        event.description,
                        style: typ.AppTypography.body
                            .copyWith(color: AppColors.muted),
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: Spacing.lg),
                    FactsGrid(event: event),
                  ],
                ),
              ),
            ),

            // Date block
            if (event.startAt != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.xl,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: DateBlock(
                    startAt: event.startAt!,
                    endAt: event.endAt,
                  ),
                ),
              ),

            // Meeting point card
            if (event.venueName != null || event.venueAddress != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.xl,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Meeting point', style: typ.AppTypography.h4),
                      const SizedBox(height: Spacing.sm),
                      MeetingPointCard(
                        venueName: event.venueName,
                        venueAddress: event.venueAddress,
                        venueLat: event.venueLat,
                        venueLng: event.venueLng,
                      ),
                    ],
                  ),
                ),
              ),

            // Who's going
            if (event.attendeeCount > 0)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.xl,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Who's going", style: typ.AppTypography.h4),
                      const SizedBox(height: Spacing.md),
                      WhosGoing(
                        attendees: event.attendees,
                        attendeeCount: event.attendeeCount,
                      ),
                    ],
                  ),
                ),
              ),

            // What to bring
            if (event.whatToBring.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.xl,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('What to bring', style: typ.AppTypography.h4),
                      const SizedBox(height: Spacing.md),
                      Wrap(
                        spacing: Spacing.sm,
                        runSpacing: Spacing.sm,
                        children: event.whatToBring
                            .map(
                              (item) => _WhatToBringChip(label: item),
                            )
                            .toList(),
                      ),
                    ],
                  ),
                ),
              ),

            // Creator header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  Layout.screenPaddingH,
                  Spacing.xl,
                  Layout.screenPaddingH,
                  0,
                ),
                child: _CreatorHeader(creator: event.creator),
              ),
            ),

            // Engagement bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  Layout.screenPaddingH,
                  Spacing.lg,
                  Layout.screenPaddingH,
                  Spacing.xxxl + 80, // extra bottom padding for the fixed bar
                ),
                child: _EngagementBar(event: event),
              ),
            ),
          ],
        ),

        // Back button overlay
        Positioned(
          top: MediaQuery.of(context).padding.top + Spacing.sm,
          left: Layout.screenPaddingH,
          child: GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              Navigator.of(context).pop();
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.white.withValues(alpha: 0.9),
                shape: BoxShape.circle,
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1A000000),
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                PhosphorIconsFill.arrowLeft,
                size: 20,
                color: AppColors.ink,
              ),
            ),
          ),
        ),

        // Fixed RSVP bottom bar
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: RsvpBottomBar(
            event: event,
            onRsvpChanged: () =>
                ref.invalidate(eventDetailProvider(widget.eventId)),
          ),
        ),
      ],
    );
  }

  Widget _buildCoverImage(EventDetail event) {
    if (event.mediaUrls.isEmpty) {
      return Container(
        width: double.infinity,
        height: 280,
        color: AppColors.sunken,
        child: Center(
          child: Icon(
            PhosphorIconsFill.calendarBlank,
            size: 48,
            color: AppColors.softInk.withValues(alpha: 0.5),
          ),
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: event.mediaUrls.first,
      width: double.infinity,
      height: 280,
      fit: BoxFit.cover,
      placeholder: (_, _) => Container(
        height: 280,
        color: AppColors.shimmerBase,
      ),
      errorWidget: (_, _, _) => Container(
        height: 280,
        color: AppColors.sunken,
        child: const Center(
          child: Icon(
            PhosphorIconsFill.calendarBlank,
            size: 48,
            color: AppColors.softInk,
          ),
        ),
      ),
    );
  }
}

// ── What To Bring Chip ────────────────────────────────────────────

class _WhatToBringChip extends StatelessWidget {
  final String label;

  const _WhatToBringChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            PhosphorIconsFill.checkCircle,
            size: 14,
            color: AppColors.success,
          ),
          const SizedBox(width: Spacing.xs),
          Text(label, style: typ.AppTypography.bodySmall),
        ],
      ),
    );
  }
}

// ── Creator Header ────────────────────────────────────────────────

class _CreatorHeader extends StatelessWidget {
  final EventCreator creator;

  const _CreatorHeader({required this.creator});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Avatar
        ClipOval(
          child: SizedBox(
            width: 40,
            height: 40,
            child: creator.avatarUrl != null
                ? CachedNetworkImage(
                    imageUrl: creator.avatarUrl!,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => _AvatarPlaceholder(),
                    errorWidget: (_, _, _) => _AvatarPlaceholder(),
                  )
                : _AvatarPlaceholder(),
          ),
        ),
        const SizedBox(width: Spacing.md),

        // Name + hosted by
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                creator.displayName,
                style: typ.AppTypography.body
                    .copyWith(fontWeight: FontWeight.w600),
              ),
              Text(
                creator.username != null
                    ? '@${creator.username}'
                    : 'Creator',
                style: typ.AppTypography.caption,
              ),
            ],
          ),
        ),

        // Follow button
        AppButton(
          label: 'Follow',
          onPressed: () {
            HapticFeedback.lightImpact();
            // TODO: implement follow (E1.7 Social)
          },
          variant: AppButtonVariant.secondary,
          size: AppButtonSize.small,
        ),
      ],
    );
  }
}

class _AvatarPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.sunken,
      child: const Center(
        child: Icon(PhosphorIconsFill.user, size: 20, color: AppColors.softInk),
      ),
    );
  }
}

// ── Engagement Bar ────────────────────────────────────────────────

class _EngagementBar extends StatelessWidget {
  final EventDetail event;

  const _EngagementBar({required this.event});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _EngagementAction(
            icon: PhosphorIconsFill.heart,
            label: '${event.likeCount}',
            isActive: event.isLiked,
            onTap: () {
              HapticFeedback.lightImpact();
              // TODO: implement like (E1.7)
            },
          ),
          _EngagementAction(
            icon: PhosphorIconsFill.chatCircle,
            label: '${event.commentCount}',
            onTap: () {
              HapticFeedback.lightImpact();
              // TODO: implement comment (E1.7)
            },
          ),
          _EngagementAction(
            icon: PhosphorIconsFill.shareFat,
            label: 'Share',
            onTap: () {
              HapticFeedback.lightImpact();
              // TODO: implement share (E1.7)
            },
          ),
          _EngagementAction(
            icon: PhosphorIconsFill.bookmarkSimple,
            label: 'Save',
            isActive: event.isSaved,
            onTap: () {
              HapticFeedback.lightImpact();
              // TODO: implement save (E1.7)
            },
          ),
        ],
      ),
    );
  }
}

class _EngagementAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _EngagementAction({
    required this.icon,
    required this.label,
    this.isActive = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.sm,
          vertical: Spacing.xs,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: isActive ? AppColors.coral : AppColors.muted,
            ),
            const SizedBox(height: Spacing.xs),
            Text(
              label,
              style: typ.AppTypography.caption.copyWith(
                color: isActive ? AppColors.coral : AppColors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Loading Skeleton ──────────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonRect(height: 280, borderRadius: 0),
          Padding(
            padding: EdgeInsets.all(Layout.screenPaddingH),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: Spacing.lg),
                SkeletonLine(width: 240, height: 24),
                SizedBox(height: Spacing.md),
                SkeletonLine(height: 14),
                SizedBox(height: Spacing.xl),
                SkeletonRect(height: 72, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.xl),
                SkeletonRect(height: 160, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.xl),
                Row(
                  children: [
                    SkeletonCircle(size: 40),
                    SizedBox(width: Spacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonLine(width: 120, height: 14),
                          SizedBox(height: Spacing.xs),
                          SkeletonLine(width: 60, height: 12),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Error View ────────────────────────────────────────────────────

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
            const Icon(
              PhosphorIconsFill.warningCircle,
              size: 48,
              color: AppColors.danger,
            ),
            const SizedBox(height: Spacing.lg),
            Text('Failed to load event', style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              message,
              style: typ.AppTypography.body.copyWith(color: AppColors.muted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.xl),
            AppButton(
              label: 'Retry',
              onPressed: onRetry,
              variant: AppButtonVariant.primary,
              size: AppButtonSize.medium,
            ),
          ],
        ),
      ),
    );
  }
}
