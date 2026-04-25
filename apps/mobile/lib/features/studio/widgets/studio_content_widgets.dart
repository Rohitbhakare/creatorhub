import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../content/providers/wizard_provider.dart';
import '../providers/studio_provider.dart';

// ── Filter Chips ────────────────────────────────────────────────────

class StudioFilterChips extends ConsumerWidget {
  final String currentFilter;
  final ValueChanged<String> onChanged;

  const StudioFilterChips({
    super.key,
    required this.currentFilter,
    required this.onChanged,
  });

  static const _filters = [
    ('all', 'All'),
    ('published', 'Published'),
    ('draft', 'Drafts'),
    ('archived', 'Archived'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final countsAsync = ref.watch(studioContentCountsProvider);
    final counts = countsAsync.asData?.value ?? const ContentCounts();

    return SizedBox(
      height: 36,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        scrollDirection: Axis.horizontal,
        itemCount: _filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: Spacing.sm),
        itemBuilder: (context, i) {
          final (value, label) = _filters[i];
          final isSelected = currentFilter == value;
          final count = counts.forFilter(value);
          final displayLabel = count > 0 ? '$label ($count)' : label;
          return GestureDetector(
            onTap: () => onChanged(value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.lg,
                vertical: Spacing.sm,
              ),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.coral : AppColors.surface,
                borderRadius: BorderRadius.circular(Layout.chipRadius),
                border: Border.all(
                  color: isSelected ? AppColors.coral : AppColors.hairline,
                ),
              ),
              child: Text(
                displayLabel,
                style: AppTypography.bodySmall.copyWith(
                  color: isSelected ? AppColors.surface : AppColors.ink,
                  fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Content Card ────────────────────────────────────────────────────

class StudioContentCard extends ConsumerWidget {
  final StudioContentItem item;

  const StudioContentCard({super.key, required this.item});

  void _onTap(BuildContext context, WidgetRef ref) {
    HapticFeedback.lightImpact();
    if (item.status == 'draft') {
      ref.read(wizardProvider.notifier).initWizard(
            _contentTypeFromString(item.contentType),
            'travel',
          );
      context.push('/content/wizard');
      return;
    }
    switch (item.contentType) {
      case 'post':
        context.push('/posts/${item.id}');
      case 'itinerary':
        context.push('/itineraries/${item.id}');
      case 'event':
        context.push('/events/${item.id}');
      default:
        context.push('/posts/${item.id}');
    }
  }

  ContentType _contentTypeFromString(String type) => switch (type) {
        'itinerary' => ContentType.selfPacedItinerary,
        'event' => ContentType.event,
        'experience' => ContentType.scheduledExperience,
        _ => ContentType.post,
      };

  String _typeLabel() => switch (item.contentType) {
        'post' => 'Post',
        'itinerary' => 'Itinerary',
        'event' => 'Event',
        'experience' => 'Experience',
        _ => item.contentType,
      };

  Color _typeColor() => switch (item.contentType) {
        'itinerary' => const Color(0xFF7C5CFC),
        'event' => const Color(0xFF0EA5E9),
        _ => AppColors.coral,
      };

  int get _completionPercent {
    int score = 0;
    if (item.title.trim().isNotEmpty) score += 50;
    if (item.coverUrl != null) score += 50;
    return score;
  }

  String _motivationalText() {
    final pct = _completionPercent;
    if (pct == 0) return 'Start here — add a title to get going';
    if (pct == 50) return 'Almost there — add a cover to finish';
    return 'Ready to go — tap to review and publish';
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    final hasContent = item.title.trim().isNotEmpty || item.coverUrl != null;
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
        title: Text('Delete draft?', style: AppTypography.h4),
        content: Text(
          hasContent
              ? 'This draft will be permanently deleted and cannot be recovered.'
              : "You haven't added any content yet. Discard this empty draft?",
          style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              'Keep editing',
              style: AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.of(ctx).pop();
              ref.read(studioContentProvider.notifier).deleteContent(item.id);
            },
            child: Text(
              hasContent ? 'Delete' : 'Discard',
              style: AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.danger,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDraft = item.status == 'draft';
    final isPublished = item.status == 'published';
    final pct = _completionPercent;
    final typeColor = _typeColor();

    return GestureDetector(
      onTap: () => _onTap(context, ref),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.hairline),
          boxShadow: AppColors.cardRaisedShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: item.coverUrl != null
                      ? CachedNetworkImage(
                          imageUrl: item.coverUrl!,
                          width: 64,
                          height: 64,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            width: 64,
                            height: 64,
                            color: AppColors.surfaceAlt,
                          ),
                          errorWidget: (_, __, ___) => StudioThumbnailPlaceholder(
                            contentType: item.contentType,
                          ),
                        )
                      : StudioThumbnailPlaceholder(contentType: item.contentType),
                ),
                const SizedBox(width: Spacing.md),

                // Content info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Type badge row
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: typeColor.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _typeLabel().toUpperCase(),
                              style: AppTypography.caption.copyWith(
                                color: typeColor,
                                fontWeight: FontWeight.w700,
                                fontSize: 9,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          if (isPublished && item.likeCount > 100) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF3E0),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '🔥 TRENDING',
                                style: AppTypography.caption.copyWith(
                                  color: const Color(0xFFE65100),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 9,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 5),

                      // Title
                      Text(
                        item.title.trim().isNotEmpty
                            ? item.title
                            : 'Untitled ${_typeLabel()}',
                        style: AppTypography.bodySmall.copyWith(
                          fontWeight: FontWeight.w600,
                          color: item.title.trim().isNotEmpty
                              ? AppColors.ink
                              : AppColors.inkMuted,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),

                      // Status + price
                      if (!isDraft)
                        Text(
                          '${item.isFree ? 'Free' : formatPrice(item.pricePaisa)} · ${isPublished ? 'Published' : 'Archived'}',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.inkSoft,
                          ),
                        ),
                    ],
                  ),
                ),

                // Delete icon for drafts
                if (isDraft)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _confirmDelete(context, ref);
                    },
                    behavior: HitTestBehavior.opaque,
                    child: const SizedBox(
                      width: 36,
                      height: 36,
                      child: Align(
                        alignment: Alignment.topRight,
                        child: Icon(
                          PhosphorIconsRegular.trash,
                          size: 16,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // Draft progress
            if (isDraft) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: pct / 100,
                        minHeight: 4,
                        backgroundColor: AppColors.surfaceAlt,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          pct == 100
                              ? const Color(0xFF16A34A)
                              : AppColors.coral,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$pct%',
                    style: AppTypography.caption.copyWith(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.inkSoft,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              Text(
                _motivationalText(),
                style: AppTypography.caption.copyWith(
                  color: pct == 100
                      ? const Color(0xFF16A34A)
                      : AppColors.coral,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],

            // Published engagement gamification
            if (isPublished) ...[
              const SizedBox(height: 10),
              const Divider(height: 1, color: AppColors.hairline),
              const SizedBox(height: 10),
              Row(
                children: [
                  StudioEngageStat(
                    icon: PhosphorIcons.heart(PhosphorIconsStyle.fill),
                    value: formatCount(item.likeCount),
                    color: const Color(0xFFE15A41),
                  ),
                  const SizedBox(width: Spacing.md),
                  StudioEngageStat(
                    icon: PhosphorIcons.chatCircle(PhosphorIconsStyle.regular),
                    value: formatCount(item.commentCount),
                    color: AppColors.inkMuted,
                  ),
                  const SizedBox(width: Spacing.md),
                  StudioEngageStat(
                    icon: PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.regular),
                    value: formatCount(item.saveCount),
                    color: AppColors.inkMuted,
                  ),
                  const Spacer(),
                  Icon(
                    PhosphorIcons.caretRight(PhosphorIconsStyle.regular),
                    size: 14,
                    color: AppColors.inkFaint,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Engage Stat ─────────────────────────────────────────────────────

class StudioEngageStat extends StatelessWidget {
  final IconData icon;
  final String value;
  final Color color;

  const StudioEngageStat({
    super.key,
    required this.icon,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 3),
        Text(
          value,
          style: AppTypography.caption.copyWith(
            color: AppColors.inkSoft,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// ── Thumbnail Placeholder ────────────────────────────────────────────

class StudioThumbnailPlaceholder extends StatelessWidget {
  final String contentType;
  final double size;

  const StudioThumbnailPlaceholder({
    super.key,
    required this.contentType,
    this.size = 64,
  });

  @override
  Widget build(BuildContext context) {
    final icon = switch (contentType) {
      'post' => PhosphorIcons.newspaper(PhosphorIconsStyle.regular),
      'itinerary' => PhosphorIcons.mapTrifold(PhosphorIconsStyle.regular),
      'event' => PhosphorIcons.calendarBlank(PhosphorIconsStyle.regular),
      _ => PhosphorIcons.file(PhosphorIconsStyle.regular),
    };

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 22, color: AppColors.inkMuted),
    );
  }
}

// ── Skeleton ─────────────────────────────────────────────────────────

class StudioContentSkeleton extends StatelessWidget {
  const StudioContentSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        child: Column(
          children: List.generate(3, (i) {
            return Padding(
              padding: const EdgeInsets.only(bottom: Spacing.sm),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Row(
                  children: [
                    const SkeletonRect(width: 64, height: 64, borderRadius: 8),
                    const SizedBox(width: Spacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SkeletonRect(height: 16, width: 60, borderRadius: 4),
                          const SizedBox(height: 6),
                          FractionallySizedBox(
                            widthFactor: 0.70,
                            child: SkeletonLine(height: 13),
                          ),
                          const SizedBox(height: 6),
                          FractionallySizedBox(
                            widthFactor: 0.45,
                            child: SkeletonLine(height: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ── Empty State ──────────────────────────────────────────────────────

class StudioContentEmpty extends StatelessWidget {
  final String filter;

  const StudioContentEmpty({super.key, required this.filter});

  @override
  Widget build(BuildContext context) {
    final description = filter == 'all'
        ? 'Create your first post, itinerary, or event to get started.'
        : "You don't have any ${filter == 'draft' ? 'drafts' : filter == 'published' ? 'published content' : 'archived content'} yet.";

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.mlg,
        vertical: Spacing.xl,
      ),
      child: EmptyState(
        icon: PhosphorIcons.pencilSimpleLine(PhosphorIconsStyle.regular),
        title: 'Nothing here yet',
        description: description,
        ctaLabel: filter == 'all' ? 'Create something' : null,
        onCtaPressed: filter == 'all'
            ? () {
                HapticFeedback.lightImpact();
                context.push('/content/create');
              }
            : null,
      ),
    );
  }
}

// ── Error State ──────────────────────────────────────────────────────

class StudioContentError extends StatelessWidget {
  final VoidCallback onRetry;

  const StudioContentError({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.mlg,
        vertical: Spacing.xl,
      ),
      child: EmptyState(
        icon: PhosphorIcons.warningCircle(PhosphorIconsStyle.regular),
        title: 'Could not load content',
        description: 'Check your connection and try again.',
        ctaLabel: 'Retry',
        onCtaPressed: onRetry,
      ),
    );
  }
}
