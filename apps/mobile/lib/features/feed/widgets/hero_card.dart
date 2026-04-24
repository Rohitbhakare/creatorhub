import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../saved/providers/saved_provider.dart';
import '../../saved/widgets/save_to_list_sheet.dart';
import '../models/feed_models.dart';

/// Full-bleed hero card with overlaid pills, save button, title and creator row.
/// Matches the "Editor's pick" card spec from the wireframe.
class HeroCard extends ConsumerStatefulWidget {
  final FeedContentItem item;
  final String eyebrow;
  final VoidCallback? onTap;

  const HeroCard({
    super.key,
    required this.item,
    required this.eyebrow,
    this.onTap,
  });

  @override
  ConsumerState<HeroCard> createState() => _HeroCardState();
}

class _HeroCardState extends ConsumerState<HeroCard> {
  bool _pressed = false;

  String get _typeLabel {
    switch (widget.item.type) {
      case 'post':         return 'Story';
      case 'itinerary':
      case 'self_paced_itinerary': return 'Itinerary';
      case 'scheduled_experience': return 'Experience';
      case 'event':        return 'Event';
      default:             return widget.item.type.replaceAll('_', ' ');
    }
  }

  String get _categoryLabel {
    final isItinerary = widget.item.type == 'itinerary' ||
        widget.item.type == 'self_paced_itinerary';
    if (isItinerary) {
      final d = widget.item.durationMinutes;
      if (d != null && d > 0) return '$_typeLabel · ${formatDurationCompact(d)}';
    }
    return _typeLabel;
  }

  String? get _bestTime {
    final s = widget.item.tags.season;
    if (s == null || s.isEmpty) return null;
    final parts = s.split('_');
    final formatted = parts.map((p) {
      if (p.isEmpty) return '';
      return p[0].toUpperCase() + p.substring(1).toLowerCase();
    }).join('-');
    return 'Best $formatted';
  }

  @override
  Widget build(BuildContext context) {
    final url = widget.item.coverImageUrl;
    final creator = widget.item.creator;
    final savedTo = ref.watch(saveStatusProvider(widget.item.id));
    final isSaved = savedTo.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Listener(
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
            scale: _pressed ? 0.985 : 1,
            duration: const Duration(milliseconds: 90),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: SizedBox(
                height: 280,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // ── Cover image ──────────────────────────────────
                    _coverImage(url),

                    // ── Bottom gradient scrim ────────────────────────
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Color(0x00000000),
                            Color(0x33000000),
                            Color(0xCC000000),
                          ],
                          stops: [0.3, 0.55, 1.0],
                        ),
                      ),
                    ),

                    // ── Top pills row ────────────────────────────────
                    Positioned(
                      top: 12,
                      left: 12,
                      right: 52,
                      child: Row(
                        children: [
                          _HeroPill(
                            label: widget.eyebrow,
                            isEyebrow: true,
                          ),
                          const SizedBox(width: 6),
                          _HeroPill(label: _categoryLabel),
                        ],
                      ),
                    ),

                    // ── Save button ──────────────────────────────────
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => showSaveToListSheet(context, ref, widget.item.id),
                        child: Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: AppColors.surface.withValues(alpha: 0.92),
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Icon(
                            isSaved
                                ? PhosphorIcons.bookmarkSimple(
                                    PhosphorIconsStyle.fill)
                                : PhosphorIcons.bookmarkSimple(
                                    PhosphorIconsStyle.regular),
                            size: 17,
                            color: isSaved ? AppColors.coral : AppColors.ink,
                          ),
                        ),
                      ),
                    ),

                    // ── Bottom: title + creator row ──────────────────
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 16,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            widget.item.title,
                            style: AppTypography.h2.copyWith(
                              color: AppColors.surface,
                              fontSize: 22,
                              height: 1.2,
                              shadows: const [
                                Shadow(
                                  color: Color(0x55000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 1),
                                ),
                              ],
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 10),
                          _HeroCreatorRow(
                            creator: creator,
                            bestTime: _bestTime,
                            likes: widget.item.likeCount,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _coverImage(String? url) {
    final placeholder = const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surfaceAlt, AppColors.hairline],
        ),
      ),
    );
    if (url == null || url.isEmpty) return placeholder;
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (_, _) => placeholder,
      errorWidget: (_, _, _) => placeholder,
    );
  }
}

// ── Top pill (eyebrow or category) ────────────────────────────────────────────

class _HeroPill extends StatelessWidget {
  final String label;
  final bool isEyebrow;
  const _HeroPill({required this.label, this.isEyebrow = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isEyebrow
            ? AppColors.coral.withValues(alpha: 0.92)
            : AppColors.surface.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTypography.caption.copyWith(
          color: isEyebrow ? AppColors.surface : AppColors.ink,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          height: 1.1,
        ),
      ),
    );
  }
}

// ── Creator row at bottom ──────────────────────────────────────────────────────

class _HeroCreatorRow extends StatelessWidget {
  final FeedCreator? creator;
  final String? bestTime;
  final int likes;

  const _HeroCreatorRow({
    required this.creator,
    required this.bestTime,
    required this.likes,
  });

  @override
  Widget build(BuildContext context) {
    final name = creator?.displayName ?? creator?.username ?? '';
    final avatarUrl = creator?.avatarUrl;

    return Row(
      children: [
        _MiniAvatar(name: name, avatarUrl: avatarUrl),
        const SizedBox(width: 7),
        Flexible(
          child: Text(
            name,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.surface,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (bestTime != null) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Text(
              '·',
              style: AppTypography.caption.copyWith(
                color: AppColors.surface.withValues(alpha: 0.6),
              ),
            ),
          ),
          Flexible(
            child: Text(
              bestTime!,
              style: AppTypography.caption.copyWith(
                color: AppColors.surface.withValues(alpha: 0.75),
                fontSize: 11,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
        const Spacer(),
        if (likes > 0) ...[
          const Icon(
            PhosphorIconsFill.heart,
            size: 12,
            color: Color(0xCCFFFFFF),
          ),
          const SizedBox(width: 4),
          Text(
            formatCount(likes),
            style: AppTypography.caption.copyWith(
              color: AppColors.surface.withValues(alpha: 0.85),
              fontWeight: FontWeight.w500,
              fontSize: 11,
            ),
          ),
        ],
      ],
    );
  }
}

class _MiniAvatar extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  const _MiniAvatar({required this.name, this.avatarUrl});

  static const _palette = [
    Color(0xFFB8860B),
    Color(0xFF5A7247),
    Color(0xFF7C5CBF),
    Color(0xFFE15A41),
    Color(0xFF3B7DD8),
    Color(0xFF2D8F6F),
    Color(0xFF8B4F8B),
    Color(0xFF888888),
  ];

  @override
  Widget build(BuildContext context) {
    final initials = _initials(name);
    final color = _palette[name.hashCode.abs() % _palette.length];

    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return ClipOval(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CachedNetworkImage(
            imageUrl: avatarUrl!,
            fit: BoxFit.cover,
            placeholder: (_, _) => _circle(initials, color),
            errorWidget: (_, _, _) => _circle(initials, color),
          ),
        ),
      );
    }
    return _circle(initials, color);
  }

  Widget _circle(String initials, Color color) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.25),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.surface.withValues(alpha: 0.5), width: 1),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.surface,
          height: 1,
        ),
      ),
    );
  }

  String _initials(String n) {
    if (n.isEmpty) return '?';
    final parts = n.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return n[0].toUpperCase();
  }
}
