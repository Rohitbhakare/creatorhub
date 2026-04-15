import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/utils/format.dart';
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
      backgroundColor: AppColors.surface,
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
        Expanded(child: _buildScrollContent(context, detail, days, selectedDay, isLocked)),
        EngagementBar(
          contentId: widget.itineraryId,
          contentType: 'itinerary',
          contentTitle: detail.title,
          initialIsLiked: detail.isLiked,
          initialLikeCount: detail.likeCount,
          commentCount: detail.commentCount,
          initialIsSaved: detail.isSaved,
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
    return CustomScrollView(
      slivers: [
        // Map placeholder
        SliverToBoxAdapter(
          child: Stack(
            children: [
              // TODO: integrate Google Maps widget
              Container(
                width: double.infinity,
                height: 280,
                color: AppColors.sunken,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        PhosphorIconsFill.mapTrifold,
                        size: 48,
                        color: AppColors.softInk.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: Spacing.sm),
                      Text(
                        'Map',
                        style: typ.AppTypography.body
                            .copyWith(color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
              ),

              // Back button
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

              // Price badge
              Positioned(
                top: MediaQuery.of(context).padding.top + Spacing.sm,
                right: Layout.screenPaddingH,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Spacing.md,
                    vertical: Spacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: detail.isFree
                        ? AppColors.success
                        : AppColors.coral,
                    borderRadius: BorderRadius.circular(Layout.chipRadius),
                  ),
                  child: Text(
                    formatPrice(detail.pricePaisa),
                    style: typ.AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.white,
                    ),
                  ),
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
                        .copyWith(color: AppColors.muted),
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

        // Creator header
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              Layout.screenPaddingH,
              Spacing.xl,
              Layout.screenPaddingH,
              0,
            ),
            child: _CreatorHeader(creator: detail.creator),
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
                              : AppColors.sunken,
                          borderRadius:
                              BorderRadius.circular(Layout.chipRadius),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.ink
                                : AppColors.border,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Day ${index + 1}',
                            style: typ.AppTypography.bodySmall.copyWith(
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? AppColors.white
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
        Icon(icon, size: 14, color: AppColors.muted),
        const SizedBox(width: Spacing.xs),
        Text(
          label,
          style: typ.AppTypography.caption.copyWith(color: AppColors.muted),
        ),
      ],
    );
  }
}

// ── Creator Header ────────────────────────────────────────────

class _CreatorHeader extends StatelessWidget {
  final ItineraryCreator creator;

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
                    placeholder: (_, _) => Container(
                      color: AppColors.shimmerBase,
                    ),
                    errorWidget: (_, _, _) => _AvatarPlaceholder(),
                  )
                : _AvatarPlaceholder(),
          ),
        ),
        const SizedBox(width: Spacing.md),

        // Name + verified
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    creator.displayName,
                    style: typ.AppTypography.body
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                  if (creator.isVerified) ...[
                    const SizedBox(width: Spacing.xs),
                    const Icon(
                      PhosphorIconsFill.sealCheck,
                      size: 16,
                      color: AppColors.success,
                    ),
                  ],
                ],
              ),
              Text(
                'Creator',
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
            // TODO: implement follow
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
        child: Icon(
          PhosphorIconsFill.user,
          size: 20,
          color: AppColors.softInk,
        ),
      ),
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
    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Spot number
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: _spotColor(spot.stopType).withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${index + 1}',
                style: typ.AppTypography.label.copyWith(
                  color: _spotColor(spot.stopType),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: Spacing.md),

          // Thumbnail
          if (spot.thumbnailUrl != null)
            Padding(
              padding: const EdgeInsets.only(right: Spacing.md),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: spot.thumbnailUrl!,
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
                    color: AppColors.sunken,
                    child: const Icon(
                      PhosphorIconsFill.mapPin,
                      size: 22,
                      color: AppColors.softInk,
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
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _spotColor(spot.stopType),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: Spacing.xs),
                    Text(
                      spot.stopType.label,
                      style: typ.AppTypography.caption.copyWith(
                        color: _spotColor(spot.stopType),
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
                        .copyWith(color: AppColors.muted),
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

Color _spotColor(StopType stopType) {
  return switch (stopType) {
    StopType.regular => AppColors.info,
    StopType.overnight => AppColors.coral,
    StopType.meal => AppColors.warning,
    StopType.viewpoint => AppColors.success,
    StopType.activity => const Color(0xFF7B61FF),
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
          color: AppColors.sunken,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const Icon(
              PhosphorIconsFill.lock,
              size: 40,
              color: AppColors.muted,
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
                  typ.AppTypography.body.copyWith(color: AppColors.muted),
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
                  typ.AppTypography.body.copyWith(color: AppColors.muted),
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
