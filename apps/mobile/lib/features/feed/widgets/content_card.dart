import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../models/feed_models.dart';

/// Airbnb-inspired content card. Two variants share the same anatomy
/// (photo → title → meta row) but differ in aspect ratio, width, and
/// meta density. No border, no shadow at rest — photo-first hierarchy.
enum ContentCardVariant { rail, vertical }

class ContentCard extends StatefulWidget {
  final FeedContentItem item;
  final ContentCardVariant variant;
  final VoidCallback? onTap;

  /// Rail variant requires an explicit width (2 visible on a 375-wide screen).
  final double? railWidth;

  const ContentCard({
    super.key,
    required this.item,
    required this.variant,
    this.onTap,
    this.railWidth,
  });

  @override
  State<ContentCard> createState() => _ContentCardState();
}

class _ContentCardState extends State<ContentCard> {
  bool _pressed = false;

  String get _typeLabel {
    switch (widget.item.type) {
      case 'post':
        return 'Story';
      case 'self_paced_itinerary':
      case 'itinerary':
        return 'Itinerary';
      case 'scheduled_experience':
        return 'Experience';
      case 'event':
        return 'Event';
      default:
        return widget.item.type.replaceAll('_', ' ');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRail = widget.variant == ContentCardVariant.rail;
    return Listener(
      onPointerDown: (_) => setState(() => _pressed = true),
      onPointerUp: (_) => setState(() => _pressed = false),
      onPointerCancel: (_) => setState(() => _pressed = false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          widget.onTap?.call();
        },
        child: AnimatedScale(
          scale: _pressed ? 0.98 : 1,
          duration: const Duration(milliseconds: 90),
          child: isRail ? _buildRail() : _buildVertical(),
        ),
      ),
    );
  }

  // ── Rail (horizontal scroll, 1:1 photo) ────────────────────────
  Widget _buildRail() {
    return SizedBox(
      width: widget.railWidth ?? 180,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: AspectRatio(
              aspectRatio: 1,
              child: _coverImage(showTypePill: true),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.item.title,
            style: AppTypography.bodyLarge.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w600,
              height: 1.25,
              fontSize: 15,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          _metaRow(compact: true),
        ],
      ),
    );
  }

  // ── Vertical (full-width, 3:2 photo) ───────────────────────────
  Widget _buildVertical() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 3 / 2,
              child: _coverImage(showTypePill: true),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  widget.item.title,
                  style: AppTypography.h4.copyWith(
                    color: AppColors.ink,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                formatPrice(widget.item.pricePaisa),
                style: AppTypography.bodyLarge.copyWith(
                  color: widget.item.pricePaisa == 0
                      ? AppColors.success
                      : AppColors.ink,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          _metaRow(compact: false),
        ],
      ),
    );
  }

  // ── Cover image + optional type pill overlay ───────────────────
  Widget _coverImage({required bool showTypePill}) {
    final url = widget.item.coverImageUrl;
    final placeholder = Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surfaceAlt, AppColors.hairline],
        ),
      ),
    );

    return Stack(
      fit: StackFit.expand,
      children: [
        if (url != null)
          CachedNetworkImage(
            imageUrl: url,
            fit: BoxFit.cover,
            placeholder: (_, _) => placeholder,
            errorWidget: (_, _, _) => placeholder,
          )
        else
          placeholder,
        if (showTypePill)
          Positioned(
            top: 10,
            left: 10,
            child: _TypePill(label: _typeLabel),
          ),
      ],
    );
  }

  // ── Meta row (creator + engagement + age / duration) ──────────
  Widget _metaRow({required bool compact}) {
    final creator = widget.item.creator?.displayName;
    final likes = widget.item.likeCount;
    final comments = widget.item.commentCount;
    final duration = widget.item.durationMinutes;
    final publishedAt = widget.item.publishedAt;

    final style = AppTypography.caption.copyWith(
      color: AppColors.inkMuted,
      fontSize: compact ? 11 : 12,
    );

    final children = <Widget>[];

    if (creator != null && creator.isNotEmpty) {
      children.add(Flexible(
        child: Text(
          creator,
          style: style.copyWith(fontWeight: FontWeight.w600, color: AppColors.inkSoft),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ));
    }

    if (likes > 0) {
      children.addAll([
        _dot(style),
        Icon(PhosphorIconsFill.heart, size: compact ? 11 : 12, color: AppColors.inkMuted),
        const SizedBox(width: 3),
        Text(formatCount(likes), style: style),
      ]);
    }

    if (!compact && comments > 0) {
      children.addAll([
        _dot(style),
        const Icon(PhosphorIconsFill.chatCircle, size: 12, color: AppColors.inkMuted),
        const SizedBox(width: 3),
        Text(formatCount(comments), style: style),
      ]);
    }

    if (duration != null && duration > 0) {
      children.addAll([
        _dot(style),
        Text(formatDuration(duration), style: style),
      ]);
    } else if (publishedAt != null && !compact) {
      children.addAll([
        _dot(style),
        Text(formatTimeAgo(publishedAt), style: style),
      ]);
    }

    // Compact rail variant also shows price inline (no price column)
    if (compact) {
      children.add(const Spacer());
      children.add(Text(
        formatPrice(widget.item.pricePaisa),
        style: style.copyWith(
          color: widget.item.pricePaisa == 0 ? AppColors.success : AppColors.ink,
          fontWeight: FontWeight.w700,
        ),
      ));
    }

    if (children.isEmpty) return const SizedBox.shrink();

    return Row(
      children: children,
    );
  }

  Widget _dot(TextStyle s) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: Text('·', style: s),
      );
}

class _TypePill extends StatelessWidget {
  final String label;
  const _TypePill({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: AppTypography.caption.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w700,
          fontSize: 10,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
