import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/host_card.dart';
import '../../../shared/components/review_summary_block.dart';
import '../../../shared/components/share_action_sheet.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/components/static_map_placeholder.dart';
import '../../../shared/components/sticky_booking_bar.dart';
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/widgets/soft_auth_sheet.dart';
import '../../reviews/providers/reviews_summary_provider.dart';
import '../../saved/widgets/save_to_list_sheet.dart';
import '../../social/providers/follow_provider.dart';
import '../../social/utils/share_utils.dart' show canonicalUrl;
import '../../social/widgets/engagement_bar.dart';
import '../providers/itinerary_detail_provider.dart';
import '../providers/itinerary_wizard_provider.dart';

/// Read-only detail screen for a published itinerary.
///
/// Map-first layout with day tabs and spot cards.
/// For paid itineraries, only Day 1 is visible; others show a paywall.
class ItineraryDetailScreen extends ConsumerStatefulWidget {
  final String itineraryId;

  const ItineraryDetailScreen({
    super.key,
    required this.itineraryId,
  });

  @override
  ConsumerState<ItineraryDetailScreen> createState() =>
      _ItineraryDetailScreenState();
}

class _ItineraryDetailScreenState
    extends ConsumerState<ItineraryDetailScreen> {
  int _selectedDayIndex = 0;

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(
      itineraryDetailProvider(widget.itineraryId),
    );

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: detailAsync.when(
        loading: () => const SafeArea(child: _LoadingSkeleton()),
        error: (error, _) => SafeArea(
          child: _ErrorView(
            message: error.toString(),
            onRetry: () => ref.invalidate(
              itineraryDetailProvider(widget.itineraryId),
            ),
          ),
        ),
        data: (detail) => _buildContent(context, detail),
      ),
    );
  }

  Widget _buildContent(BuildContext context, ItineraryDetail detail) {
    final days = detail.days;
    final selectedDay =
        days.isNotEmpty && _selectedDayIndex < days.length
            ? days[_selectedDayIndex]
            : null;
    final isLocked = !detail.isFree && _selectedDayIndex > 0;

    return Column(
      children: [
        Expanded(
          child: _buildScrollContent(
            context,
            detail,
            days,
            selectedDay,
            isLocked,
          ),
        ),
        EngagementBar(
          contentId: widget.itineraryId,
          contentType: 'itinerary',
          contentTitle: detail.title,
          initialIsLiked: detail.isLiked,
          initialLikeCount: detail.likeCount,
          commentCount: detail.commentCount,
          initialIsSaved: detail.isSaved,
        ),
        // Sticky booking bar — only for paid itineraries.
        if (!detail.isFree)
          StickyBookingBar(
            contentType: StickyBookingContentType.itinerary,
            priceLabel:
                '₹${(detail.pricePaisa / 100).toStringAsFixed(0)}',
            subLabel: 'one-time',
            onTap: () async {
              final isAuth = ref.read(authProvider).isAuthenticated;
              if (!isAuth) {
                final signedIn = await showSoftAuthSheet(
                  context,
                  ref,
                  trigger: SoftAuthTrigger.book,
                );
                if (!signedIn || !context.mounted) return;
              }
              if (!context.mounted) return;
              context.push('/book/${detail.id}');
            },
          ),
      ],
    );
  }

  Widget _buildScrollContent(
    BuildContext context,
    ItineraryDetail detail,
    List<DayState> days,
    DayState? selectedDay,
    bool isLocked,
  ) {
    // Flatten spots → MapPins. Overnight stays use coral pins.
    final pins = <MapPin>[];
    for (final day in days) {
      for (final spot in day.spots) {
        if (spot.lat == 0 && spot.lng == 0) continue;
        pins.add(MapPin(
          lat: spot.lat,
          lng: spot.lng,
          isOvernight: spot.stopType == StopType.overnight,
          label: spot.name,
        ));
      }
    }

    return CustomScrollView(
      slivers: [
        // Map placeholder
        SliverToBoxAdapter(
          child: Stack(
            children: [
              SizedBox(
                width: double.infinity,
                height: 280,
                child: StaticMapPlaceholder(
                  pins: pins,
                  aspectRatio: MediaQuery.of(context).size.width / 280,
                ),
              ),

              // Back button
              Positioned(
                top: MediaQuery.of(context).padding.top + Spacing.sm,
                left: Layout.screenPaddingH,
                child: _RoundIconBtn(
                  icon: PhosphorIconsFill.arrowLeft,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop();
                  },
                ),
              ),

              // Share + Save
              Positioned(
                top: MediaQuery.of(context).padding.top + Spacing.sm,
                right: Layout.screenPaddingH,
                child: Row(
                  children: [
                    _RoundIconBtn(
                      icon: PhosphorIconsFill.shareNetwork,
                      onTap: () async {
                        HapticFeedback.lightImpact();
                        await showShareActionSheet(
                          context: context,
                          ref: ref,
                          contentId: detail.id,
                          contentType: 'itinerary',
                          contentTitle: detail.title,
                          shareUrl: canonicalUrl('itinerary', detail.id),
                        );
                      },
                    ),
                    const SizedBox(width: Spacing.sm),
                    _RoundIconBtn(
                      icon: PhosphorIconsFill.bookmarkSimple,
                      tintColor:
                          detail.isSaved ? AppColors.coral : null,
                      onTap: () async {
                        HapticFeedback.lightImpact();
                        final isAuth =
                            ref.read(authProvider).isAuthenticated;
                        if (!isAuth) {
                          await showSoftAuthSheet(
                            context,
                            ref,
                            trigger: SoftAuthTrigger.save,
                          );
                          return;
                        }
                        if (!context.mounted) return;
                        showSaveToListSheet(context, ref, detail.id);
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Title + stats
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
                Text(detail.title, style: typ.AppTypography.h2),
                const SizedBox(height: Spacing.sm),
                if (detail.description.isNotEmpty) ...[
                  Text(
                    detail.description,
                    style: typ.AppTypography.body
                        .copyWith(color: AppColors.inkSoft),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: Spacing.md),
                ],

                // Stats row
                Row(
                  children: [
                    _StatChip(
                      icon: PhosphorIconsFill.calendarDots,
                      label:
                          '${detail.dayCount} ${detail.dayCount == 1 ? 'day' : 'days'}',
                    ),
                    const SizedBox(width: Spacing.md),
                    _StatChip(
                      icon: PhosphorIconsFill.mapPin,
                      label:
                          '${detail.totalSpots} ${detail.totalSpots == 1 ? 'spot' : 'spots'}',
                    ),
                    if (detail.totalDistanceKm > 0) ...[
                      const SizedBox(width: Spacing.md),
                      _StatChip(
                        icon: PhosphorIconsFill.path,
                        label:
                            '${detail.totalDistanceKm.toStringAsFixed(0)} km',
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),

        // Creator host card
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              Layout.screenPaddingH,
              Spacing.xl,
              Layout.screenPaddingH,
              0,
            ),
            child: _ItineraryHostCard(creator: detail.creator),
          ),
        ),

        // Day tab bar
        if (days.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: Spacing.xl),
              child: SizedBox(
                height: Layout.minTapTarget,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: Layout.screenPaddingH,
                  ),
                  itemCount: days.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(width: Spacing.sm),
                  itemBuilder: (context, index) {
                    final isSelected = index == _selectedDayIndex;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _selectedDayIndex = index);
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        constraints: const BoxConstraints(
                          minWidth: Layout.minTapTarget,
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: Spacing.lg,
                          vertical: Spacing.sm,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.ink
                              : AppColors.surfaceAlt,
                          borderRadius:
                              BorderRadius.circular(Layout.chipRadius),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.ink
                                : AppColors.hairline,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Day ${index + 1}',
                            style: typ.AppTypography.bodySmall.copyWith(
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? AppColors.surface
                                  : AppColors.ink,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

        // Day content
        if (isLocked)
          SliverToBoxAdapter(
            child: _PaywallOverlay(
              pricePaisa: detail.pricePaisa,
            ),
          )
        else if (selectedDay != null && selectedDay.spots.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              Layout.screenPaddingH,
              Spacing.lg,
              Layout.screenPaddingH,
              Spacing.xxxl,
            ),
            sliver: SliverList.separated(
              itemCount: selectedDay.spots.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(height: Spacing.sm),
              itemBuilder: (context, index) {
                final spot = selectedDay.spots[index];
                return _ReadOnlySpotCard(spot: spot, index: index);
              },
            ),
          )
        else
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(Spacing.xxl),
              child: Center(
                child: Text('No spots for this day'),
              ),
            ),
          ),

        // Reviews summary
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              Layout.screenPaddingH,
              Spacing.xxl,
              Layout.screenPaddingH,
              0,
            ),
            child: _ItineraryReviewsSection(contentId: detail.id),
          ),
        ),

        // Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: Spacing.xxxl),
        ),
      ],
    );
  }
}

// ── Stat Chip ─────────────────────────────────────────────────

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _StatChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.inkSoft),
        const SizedBox(width: Spacing.xs),
        Text(
          label,
          style: typ.AppTypography.caption.copyWith(color: AppColors.inkSoft),
        ),
      ],
    );
  }
}

// ── Itinerary Host Card ───────────────────────────────────────

class _ItineraryHostCard extends ConsumerWidget {
  final ItineraryCreator creator;

  const _ItineraryHostCard({required this.creator});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followKey = (
      targetUserId: creator.id,
      isFollowing: false,
      followerCount: 0,
    );
    final followState = ref.watch(followProvider(followKey));

    return HostCard(
      creatorId: creator.id,
      displayName: creator.displayName,
      avatarUrl: creator.avatarUrl,
      verified: creator.isVerified,
      tenureLabel: 'Creator on CreatorHub',
      contentCount: 0,
      isFollowing: followState.isFollowing,
      onFollowTap: () async {
        HapticFeedback.lightImpact();
        final isAuth = ref.read(authProvider).isAuthenticated;
        if (!isAuth) {
          await showSoftAuthSheet(
            context,
            ref,
            trigger: SoftAuthTrigger.follow,
          );
          return;
        }
        if (!context.mounted) return;
        handleFollowTap(context, ref, followKey);
      },
      onMessageTap: () {
        HapticFeedback.selectionClick();
        context.push('/profile/${creator.id}');
      },
      onTap: () {
        HapticFeedback.selectionClick();
        context.push('/profile/${creator.id}');
      },
    );
  }
}

// ── Round overlay icon button ─────────────────────────────────

class _RoundIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? tintColor;

  const _RoundIconBtn({
    required this.icon,
    required this.onTap,
    this.tintColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.surface.withValues(alpha: 0.9),
          shape: BoxShape.circle,
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A000000),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Icon(icon, size: 20, color: tintColor ?? AppColors.ink),
      ),
    );
  }
}

// ── Itinerary Reviews Section ─────────────────────────────────

class _ItineraryReviewsSection extends ConsumerWidget {
  final String contentId;

  const _ItineraryReviewsSection({required this.contentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(reviewsSummaryProvider(contentId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Reviews', style: typ.AppTypography.h4),
        const SizedBox(height: Spacing.md),
        summaryAsync.when(
          loading: () => const SkeletonLoader(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 120, height: 28),
                SizedBox(height: Spacing.md),
                SkeletonLine(height: 8),
                SizedBox(height: Spacing.xs),
                SkeletonLine(height: 8),
              ],
            ),
          ),
          error: (_, _) => Text(
            'Reviews unavailable right now',
            style: typ.AppTypography.bodySmall
                .copyWith(color: AppColors.inkSoft),
          ),
          data: (summary) {
            if (summary.count == 0) {
              return Text(
                'Be the first to review',
                style: typ.AppTypography.body
                    .copyWith(color: AppColors.inkSoft),
              );
            }
            return ReviewSummaryBlock(
              average: summary.average,
              count: summary.count,
              breakdown: summary.breakdown,
              recent: summary.recent
                  .map((r) => RecentReview(
                        reviewerName: r.reviewerName,
                        reviewerAvatarUrl: r.reviewerAvatarUrl,
                        rating: r.rating.toDouble(),
                        body: r.body,
                        createdAt: r.createdAt,
                      ))
                  .toList(),
              onSeeAllTap: () =>
                  context.push('/content/$contentId/reviews'),
            );
          },
        ),
      ],
    );
  }
}


// ── Read-Only Spot Card ───────────────────────────────────────

class _ReadOnlySpotCard extends StatelessWidget {
  final SpotState spot;
  final int index;

  const _ReadOnlySpotCard({
    required this.spot,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final spotColor = _spotColor(spot.stopType);
    final spotIcon = _spotIcon(spot.stopType);

    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Spot type — shape-coded icon, monochrome (overnight=coral).
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.hairline),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Icon(spotIcon, size: 14, color: spotColor),
            ),
          ),
          const SizedBox(width: Spacing.md),

          // Thumbnail — creator-uploaded coverUrl takes precedence over the
          // Places photo (DD-032). `displayImageUrl` encapsulates the fallback.
          if (spot.displayImageUrl != null)
            Padding(
              padding: const EdgeInsets.only(right: Spacing.md),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: spot.displayImageUrl!,
                  width: 56,
                  height: 56,
                  fit: BoxFit.cover,
                  placeholder: (_, _) => Container(
                    width: 56,
                    height: 56,
                    color: AppColors.shimmerBase,
                  ),
                  errorWidget: (_, _, _) => Container(
                    width: 56,
                    height: 56,
                    color: AppColors.surfaceAlt,
                    child: const Icon(
                      PhosphorIconsFill.mapPin,
                      size: 22,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ),
              ),
            ),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  spot.name,
                  style: typ.AppTypography.body
                      .copyWith(fontWeight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: Spacing.xs),
                Row(
                  children: [
                    Icon(spotIcon, size: 12, color: spotColor),
                    const SizedBox(width: Spacing.xs),
                    Text(
                      spot.stopType.label,
                      style: typ.AppTypography.caption.copyWith(
                        color: spotColor,
                      ),
                    ),
                    if (spot.durationMinutes != null) ...[
                      const SizedBox(width: Spacing.sm),
                      Text('\u00B7', style: typ.AppTypography.caption),
                      const SizedBox(width: Spacing.sm),
                      Text(
                        formatDuration(spot.durationMinutes!),
                        style: typ.AppTypography.caption,
                      ),
                    ],
                  ],
                ),
                if (spot.creatorNote != null &&
                    spot.creatorNote!.isNotEmpty) ...[
                  const SizedBox(height: Spacing.sm),
                  Text(
                    spot.creatorNote!,
                    style: typ.AppTypography.bodySmall
                        .copyWith(color: AppColors.inkSoft),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Per DD-024, only `overnight` carries the coral accent (one of the 5
/// allowed coral contexts). All other stop types render monochrome.
Color _spotColor(StopType stopType) {
  return switch (stopType) {
    StopType.overnight => AppColors.coral,
    _ => AppColors.ink,
  };
}

/// Phosphor fill icon per stop type — shape carries the meaning so we
/// can drop the colour-coded crutch (matches spot_editor_sheet).
IconData _spotIcon(StopType stopType) {
  return switch (stopType) {
    StopType.regular => PhosphorIconsFill.mapPin,
    StopType.overnight => PhosphorIconsFill.bed,
    StopType.meal => PhosphorIconsFill.forkKnife,
    StopType.viewpoint => PhosphorIconsFill.binoculars,
    StopType.activity => PhosphorIconsFill.mountains,
  };
}

// ── Paywall Overlay ───────────────────────────────────────────

class _PaywallOverlay extends StatelessWidget {
  final int pricePaisa;

  const _PaywallOverlay({required this.pricePaisa});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Layout.screenPaddingH,
        Spacing.xl,
        Layout.screenPaddingH,
        Spacing.xxxl,
      ),
      child: Container(
        padding: const EdgeInsets.all(Spacing.xxl),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Column(
          children: [
            const Icon(
              PhosphorIconsFill.lock,
              size: 40,
              color: AppColors.inkSoft,
            ),
            const SizedBox(height: Spacing.lg),
            Text(
              'Unlock full itinerary',
              style: typ.AppTypography.h3,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              'Day 1 is free to preview. Get the complete itinerary with all days and spots.',
              style:
                  typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.xl),
            AppButton(
              label: 'Unlock for ${formatPrice(pricePaisa)}',
              onPressed: () {
                HapticFeedback.lightImpact();
                // TODO: implement purchase flow
              },
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              fullWidth: true,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Loading Skeleton ──────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Map placeholder
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
                SizedBox(height: Spacing.xl),
                SkeletonRect(height: 56, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.xl),
                SkeletonRect(height: 100, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.md),
                SkeletonRect(height: 100, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.md),
                SkeletonRect(height: 100, borderRadius: Layout.cardRadius),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Error View ────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({
    required this.message,
    required this.onRetry,
  });

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
            Text(
              'Failed to load itinerary',
              style: typ.AppTypography.h3,
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              message,
              style:
                  typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
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
