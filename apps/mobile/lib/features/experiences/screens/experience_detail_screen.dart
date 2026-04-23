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
import '../../../shared/utils/format.dart';
import '../../itineraries/providers/itinerary_wizard_provider.dart'
    show StopType;
import '../../social/providers/follow_provider.dart';
import '../providers/experience_provider.dart';

/// Public-facing detail page for a scheduled experience.
///
/// Layout: cover image → title + price → creator → location chip →
/// available dates → meeting point → day-by-day → about → tags →
/// sticky book-now bar.
class ExperienceDetailScreen extends ConsumerStatefulWidget {
  final String id;

  const ExperienceDetailScreen({super.key, required this.id});

  @override
  ConsumerState<ExperienceDetailScreen> createState() =>
      _ExperienceDetailScreenState();
}

class _ExperienceDetailScreenState
    extends ConsumerState<ExperienceDetailScreen> {
  String? _selectedDateId;

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(experienceDetailProvider(widget.id));
    final datesAsync = ref.watch(experienceDatesProvider(widget.id));

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: detailAsync.when(
        loading: () => const SafeArea(child: _LoadingSkeleton()),
        error: (error, _) => SafeArea(
          child: _ErrorView(
            message: error.toString(),
            onRetry: () {
              ref.invalidate(experienceDetailProvider(widget.id));
              ref.invalidate(experienceDatesProvider(widget.id));
            },
          ),
        ),
        data: (detail) {
          final dates = datesAsync.value ?? [];
          return _buildContent(context, detail, dates);
        },
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    ExperienceDetail detail,
    List<ScheduledDate> dates,
  ) {
    final selectedDate = dates.isEmpty
        ? null
        : dates.firstWhere(
            (d) => d.id == _selectedDateId,
            orElse: () => dates.first,
          );

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            // ── Cover Image (SliverAppBar) ─────────────────────
            SliverAppBar(
              expandedHeight: 260,
              pinned: false,
              floating: false,
              backgroundColor: AppColors.surfaceAlt,
              automaticallyImplyLeading: false,
              flexibleSpace: FlexibleSpaceBar(
                background: detail.coverImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: detail.coverImageUrl!,
                        width: double.infinity,
                        height: 260,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(
                          height: 260,
                          color: AppColors.shimmerBase,
                        ),
                        errorWidget: (_, _, _) => _CoverPlaceholder(),
                      )
                    : _CoverPlaceholder(),
              ),
            ),

            // ── Title + Price ──────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  Layout.screenPaddingH,
                  Spacing.xl,
                  Layout.screenPaddingH,
                  0,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        detail.title,
                        style: typ.AppTypography.h1,
                      ),
                    ),
                    const SizedBox(width: Spacing.md),
                    _PriceBadge(
                      pricePaisa: detail.pricePaisa ?? 0,
                      isFree: detail.isFree,
                    ),
                  ],
                ),
              ),
            ),

            // ── Creator Row ────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  Layout.screenPaddingH,
                  Spacing.xl,
                  Layout.screenPaddingH,
                  0,
                ),
                child: _CreatorRow(creator: detail.creator),
              ),
            ),

            // ── Location Chip ──────────────────────────────────
            if (detail.locationName != null && detail.locationName!.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.lg,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: _LocationChip(locationName: detail.locationName!),
                ),
              ),

            // ── Available Dates ────────────────────────────────
            if (ref.watch(experienceDatesProvider(widget.id)).isLoading)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.xl,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: _DatesSkeleton(),
                ),
              )
            else if (dates.isNotEmpty)
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(
                        Layout.screenPaddingH,
                        Spacing.xl,
                        Layout.screenPaddingH,
                        Spacing.md,
                      ),
                      child: Text(
                        'Available Dates',
                        style: typ.AppTypography.h4,
                      ),
                    ),
                    SizedBox(
                      height: 56,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(
                          horizontal: Layout.screenPaddingH,
                        ),
                        itemCount: dates.length,
                        separatorBuilder: (_, _) =>
                            const SizedBox(width: Spacing.sm),
                        itemBuilder: (context, index) {
                          final date = dates[index];
                          final isSelected =
                              (selectedDate?.id ?? dates.first.id) == date.id;
                          return _DateChip(
                            date: date,
                            isSelected: isSelected,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _selectedDateId = date.id);
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              )
            else
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.xl,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: _EmptyDatesCard(),
                ),
              ),

            // ── Meeting Point ──────────────────────────────────
            if (detail.meetingPoint != null)
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
                      Text('Meeting Point', style: typ.AppTypography.h4),
                      const SizedBox(height: Spacing.md),
                      _MeetingPointCard(info: detail.meetingPoint!),
                    ],
                  ),
                ),
              ),

            // ── Day-by-Day Plan ────────────────────────────────
            if (detail.days.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.xl,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: Text('Day-by-Day', style: typ.AppTypography.h4),
                ),
              ),
            if (detail.days.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  Layout.screenPaddingH,
                  Spacing.md,
                  Layout.screenPaddingH,
                  0,
                ),
                sliver: SliverList.separated(
                  itemCount: detail.days.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: Spacing.sm),
                  itemBuilder: (context, index) {
                    return _DayCard(day: detail.days[index]);
                  },
                ),
              ),

            // ── About (Description) ────────────────────────────
            if (detail.description.isNotEmpty)
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
                      Text('About', style: typ.AppTypography.h4),
                      const SizedBox(height: Spacing.md),
                      Text(
                        detail.description,
                        style: typ.AppTypography.postBody,
                      ),
                    ],
                  ),
                ),
              ),

            // ── Tags ───────────────────────────────────────────
            if (detail.tags.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    Spacing.lg,
                    Layout.screenPaddingH,
                    0,
                  ),
                  child: Wrap(
                    spacing: Spacing.sm,
                    runSpacing: Spacing.sm,
                    children: detail.tags
                        .map((tag) => _TagChip(label: tag))
                        .toList(),
                  ),
                ),
              ),

            // ── Bottom spacer for sticky bar ───────────────────
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        ),

        // ── Back + Share overlay ───────────────────────────────
        Positioned(
          top: MediaQuery.of(context).padding.top + Spacing.sm,
          left: Layout.screenPaddingH,
          right: Layout.screenPaddingH,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _CircleIconButton(
                icon: PhosphorIconsFill.arrowLeft,
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).pop();
                },
              ),
              _CircleIconButton(
                icon: PhosphorIconsFill.shareNetwork,
                onTap: () {
                  HapticFeedback.lightImpact();
                  // TODO: share experience (E2.x Social)
                },
              ),
            ],
          ),
        ),

        // ── Sticky Book Now bar ────────────────────────────────
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: _BookNowBar(
            detail: detail,
            selectedDate: selectedDate,
          ),
        ),
      ],
    );
  }
}

// ── Price Badge ────────────────────────────────────────────────────

class _PriceBadge extends StatelessWidget {
  final int pricePaisa;
  final bool isFree;

  const _PriceBadge({required this.pricePaisa, required this.isFree});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.xs,
      ),
      decoration: BoxDecoration(
        color: isFree ? AppColors.success : AppColors.coral,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
      ),
      child: Text(
        isFree ? 'FREE' : '${formatPrice(pricePaisa)}/person',
        style: typ.AppTypography.bodySmall.copyWith(
          fontWeight: FontWeight.w700,
          color: AppColors.surface,
        ),
      ),
    );
  }
}

// ── Creator Row ────────────────────────────────────────────────────

class _CreatorRow extends ConsumerWidget {
  final ExperienceCreator creator;

  const _CreatorRow({required this.creator});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followKey = (
      targetUserId: creator.id,
      isFollowing: false,
      followerCount: 0,
    );
    final followState = ref.watch(followProvider(followKey));

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

        // Name + username
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
              if (creator.username != null)
                Text(
                  '@${creator.username}',
                  style: typ.AppTypography.caption,
                ),
            ],
          ),
        ),

        // Follow button
        AppButton(
          label: followState.isFollowing ? 'Following' : 'Follow',
          onPressed: () {
            HapticFeedback.lightImpact();
            handleFollowTap(context, ref, followKey);
          },
          variant: followState.isFollowing
              ? AppButtonVariant.secondary
              : AppButtonVariant.primary,
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
      color: AppColors.surfaceAlt,
      child: const Center(
        child: Icon(PhosphorIconsFill.user, size: 20, color: AppColors.inkMuted),
      ),
    );
  }
}

// ── Location Chip ──────────────────────────────────────────────────

class _LocationChip extends StatelessWidget {
  final String locationName;

  const _LocationChip({required this.locationName});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(
          PhosphorIconsFill.mapPin,
          size: 16,
          color: AppColors.coral,
        ),
        const SizedBox(width: Spacing.xs),
        Flexible(
          child: Text(
            locationName,
            style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ── Date Chip ──────────────────────────────────────────────────────

class _DateChip extends StatelessWidget {
  final ScheduledDate date;
  final bool isSelected;
  final VoidCallback onTap;

  const _DateChip({
    required this.date,
    required this.isSelected,
    required this.onTap,
  });

  String _formatDateRange(String startDate, String endDate) {
    // Parse "YYYY-MM-DD" to "d MMM" format
    try {
      final start = DateTime.parse(startDate);
      final end = DateTime.parse(endDate);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      if (start.month == end.month) {
        return '${start.day}–${end.day} ${months[start.month - 1]}';
      }
      return '${start.day} ${months[start.month - 1]} – ${end.day} ${months[end.month - 1]}';
    } catch (_) {
      return '$startDate – $endDate';
    }
  }

  @override
  Widget build(BuildContext context) {
    final soldOut = date.isSoldOut || !date.isActive;

    return GestureDetector(
      onTap: soldOut ? null : onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        constraints: const BoxConstraints(minHeight: Layout.minTapTarget),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.ink
              : soldOut
                  ? AppColors.surfaceAlt.withValues(alpha: 0.6)
                  : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.hairline,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _formatDateRange(date.startDate, date.endDate),
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected
                    ? AppColors.surface
                    : soldOut
                        ? AppColors.inkMuted
                        : AppColors.ink,
              ),
            ),
            Text(
              soldOut ? 'Sold Out' : '${date.spotsLeft} spots left',
              style: typ.AppTypography.caption.copyWith(
                color: isSelected
                    ? AppColors.surface.withValues(alpha: 0.7)
                    : soldOut
                        ? AppColors.inkMuted
                        : AppColors.inkSoft,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Meeting Point Card ─────────────────────────────────────────────

class _MeetingPointCard extends StatelessWidget {
  final MeetingPointInfo info;

  const _MeetingPointCard({required this.info});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Map-pin placeholder
          Container(
            width: double.infinity,
            height: 100,
            color: AppColors.surfaceAlt,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    PhosphorIconsFill.mapPin,
                    size: 28,
                    color: AppColors.coral.withValues(alpha: 0.5),
                  ),
                  if (info.lat != null && info.lng != null && info.isRevealed)
                    Padding(
                      padding: const EdgeInsets.only(top: Spacing.xs),
                      child: Text(
                        '${info.lat!.toStringAsFixed(4)}, '
                        '${info.lng!.toStringAsFixed(4)}',
                        style: typ.AppTypography.caption
                            .copyWith(color: AppColors.inkMuted),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Location details
          Padding(
            padding: const EdgeInsets.all(Layout.cardPadding),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  PhosphorIconsFill.mapPin,
                  size: 18,
                  color: AppColors.coral,
                ),
                const SizedBox(width: Spacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        info.publicAreaName,
                        style: typ.AppTypography.body
                            .copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: Spacing.xs),
                      if (info.isRevealed && info.privateExactName != null) ...[
                        Text(
                          info.privateExactName!,
                          style: typ.AppTypography.bodySmall
                              .copyWith(color: AppColors.inkSoft),
                        ),
                      ] else ...[
                        Row(
                          children: [
                            const Icon(
                              PhosphorIconsFill.lock,
                              size: 13,
                              color: AppColors.inkMuted,
                            ),
                            const SizedBox(width: Spacing.xs),
                            Text(
                              'Exact location shared 24h before',
                              style: typ.AppTypography.caption
                                  .copyWith(color: AppColors.inkMuted),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Day Card ───────────────────────────────────────────────────────

class _DayCard extends StatefulWidget {
  final ExperienceDay day;

  const _DayCard({required this.day});

  @override
  State<_DayCard> createState() => _DayCardState();
}

class _DayCardState extends State<_DayCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Day header row (tappable)
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _expanded = !_expanded);
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.all(Layout.cardPadding),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.ink,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        '${widget.day.dayNumber}',
                        style: typ.AppTypography.bodySmall.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.surface,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.day.title ?? 'Day ${widget.day.dayNumber}',
                          style: typ.AppTypography.body
                              .copyWith(fontWeight: FontWeight.w600),
                        ),
                        if (widget.day.spots.isNotEmpty)
                          Text(
                            '${widget.day.spots.length} '
                            '${widget.day.spots.length == 1 ? 'spot' : 'spots'}',
                            style: typ.AppTypography.caption,
                          ),
                      ],
                    ),
                  ),
                  Icon(
                    _expanded
                        ? PhosphorIconsFill.caretUp
                        : PhosphorIconsFill.caretDown,
                    size: 16,
                    color: AppColors.inkSoft,
                  ),
                ],
              ),
            ),
          ),

          // Expandable spot list
          if (_expanded && widget.day.spots.isNotEmpty) ...[
            const Divider(
              height: 1,
              color: AppColors.hairline,
            ),
            ...widget.day.spots.asMap().entries.map((entry) {
              return _SpotRow(
                spot: entry.value,
                index: entry.key,
                isLast: entry.key == widget.day.spots.length - 1,
              );
            }),
          ],
        ],
      ),
    );
  }
}

class _SpotRow extends StatelessWidget {
  final ExperienceDaySpot spot;
  final int index;
  final bool isLast;

  const _SpotRow({
    required this.spot,
    required this.index,
    required this.isLast,
  });

  Color _colorForType(String type) {
    return switch (type) {
      'overnight' => AppColors.coral,
      'meal' => AppColors.warning,
      'viewpoint' => AppColors.success,
      'activity' => const Color(0xFF7B61FF),
      _ => AppColors.info,
    };
  }

  String _labelForType(String type) {
    return switch (type) {
      'overnight' => StopType.overnight.label,
      'meal' => StopType.meal.label,
      'viewpoint' => StopType.viewpoint.label,
      'activity' => StopType.activity.label,
      _ => StopType.regular.label,
    };
  }

  @override
  Widget build(BuildContext context) {
    final spotColor = _colorForType(spot.stopType);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(Layout.cardPadding),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Index badge
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: spotColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: typ.AppTypography.label.copyWith(
                      color: spotColor,
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
                      width: 52,
                      height: 52,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(
                        width: 52,
                        height: 52,
                        color: AppColors.shimmerBase,
                      ),
                      errorWidget: (_, _, _) => Container(
                        width: 52,
                        height: 52,
                        color: AppColors.surfaceAlt,
                        child: const Icon(
                          PhosphorIconsFill.mapPin,
                          size: 20,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                  ),
                ),

              // Spot info
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
                            color: spotColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: Spacing.xs),
                        Text(
                          _labelForType(spot.stopType),
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
        ),
        if (!isLast)
          const Divider(height: 1, color: AppColors.hairline),
      ],
    );
  }
}

// ── Tag Chip ───────────────────────────────────────────────────────

class _TagChip extends StatelessWidget {
  final String label;

  const _TagChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Text(
        '#$label',
        style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
      ),
    );
  }
}

// ── Book Now Bar ───────────────────────────────────────────────────

class _BookNowBar extends StatelessWidget {
  final ExperienceDetail detail;
  final ScheduledDate? selectedDate;

  const _BookNowBar({required this.detail, this.selectedDate});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        Layout.screenPaddingH,
        Spacing.md,
        Layout.screenPaddingH,
        MediaQuery.of(context).padding.bottom + Spacing.md,
      ),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.hairline, width: 1)),
      ),
      child: Row(
        children: [
          // Price
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  formatPrice(detail.pricePaisa ?? 0),
                  style: typ.AppTypography.h3.copyWith(
                    color: detail.isFree ? AppColors.success : AppColors.ink,
                  ),
                ),
                if (!detail.isFree)
                  Text(
                    'per person',
                    style: typ.AppTypography.caption,
                  ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.lg),

          // Book Now button
          Expanded(
            flex: 2,
            child: AppButton(
              label: 'Book Now',
              onPressed: selectedDate != null && !selectedDate!.isSoldOut
                  ? () {
                      HapticFeedback.lightImpact();
                      // TODO: navigate to booking flow (E2.2 Booking)
                    }
                  : null,
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              fullWidth: true,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Cover Placeholder ──────────────────────────────────────────────

class _CoverPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 260,
      color: AppColors.surfaceAlt,
      child: Center(
        child: Icon(
          PhosphorIconsFill.compass,
          size: 48,
          color: AppColors.inkMuted.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}

// ── Circle Icon Button ─────────────────────────────────────────────

class _CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleIconButton({required this.icon, required this.onTap});

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
        child: Icon(icon, size: 20, color: AppColors.ink),
      ),
    );
  }
}

// ── Empty Dates Card ───────────────────────────────────────────────

class _EmptyDatesCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.xl),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        children: [
          const Icon(
            PhosphorIconsFill.calendarX,
            size: 36,
            color: AppColors.inkMuted,
          ),
          const SizedBox(height: Spacing.md),
          Text(
            'No dates available',
            style: typ.AppTypography.h4,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.xs),
          Text(
            'The creator hasn\'t added any upcoming dates yet.',
            style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ── Dates Skeleton ─────────────────────────────────────────────────

class _DatesSkeleton extends StatelessWidget {
  const _DatesSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Row(
        children: [
          SkeletonRect(width: 120, height: 52, borderRadius: Layout.chipRadius),
          SizedBox(width: Spacing.sm),
          SkeletonRect(width: 120, height: 52, borderRadius: Layout.chipRadius),
        ],
      ),
    );
  }
}

// ── Loading Skeleton ───────────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonRect(height: 260, borderRadius: 0),
          Padding(
            padding: EdgeInsets.all(Layout.screenPaddingH),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: Spacing.xl),
                SkeletonLine(width: 260, height: 28),
                SizedBox(height: Spacing.md),
                SkeletonLine(width: 120, height: 14),
                SizedBox(height: Spacing.xl),
                Row(
                  children: [
                    SkeletonCircle(size: 40),
                    SizedBox(width: Spacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonLine(width: 140, height: 14),
                          SizedBox(height: Spacing.xs),
                          SkeletonLine(width: 80, height: 12),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: Spacing.xl),
                SkeletonRect(height: 56, borderRadius: Layout.chipRadius),
                SizedBox(height: Spacing.xl),
                SkeletonRect(height: 160, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.xl),
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

// ── Error View ─────────────────────────────────────────────────────

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
            Text('Failed to load experience', style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              message,
              style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
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
