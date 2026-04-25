import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../saved/providers/saved_provider.dart';
import '../../saved/widgets/save_to_list_sheet.dart';
import '../models/feed_models.dart';

/// Home-feed content card.
///
/// Two variants share an identical anatomy and only differ in sizing:
/// - [grid]  → fills the width of a column in a 2-col `GridView`.
/// - [rail]  → fixed width for horizontal `ListView` rails.
///
/// Cover is 4:5 portrait with three overlays:
///   top-left:  category tag ("Itinerary · 7d"-style for itineraries)
///   top-right: save/bookmark toggle (coral fill when saved — DD-013, SOC-FR-004)
///   bottom-right: price pill (paid content only; free items show no badge)
/// Below the cover: sub-category pill (if present) → 14/500 title (2-line ellipsis)
///   → row 1 (avatar · author · likes).
enum ContentCardVariant { grid, rail }

/// Display names for known sub-category IDs (travel + stories verticals).
const _kSubCatNames = <String, String>{
  'travel.road_trips': 'Road Trips',
  'travel.trekking': 'Trekking',
  'travel.adventure': 'Adventure',
  'travel.heritage': 'Heritage & Culture',
  'travel.food_trails': 'Food Trails',
  'travel.wildlife': 'Wildlife',
  'travel.photo_walks': 'Photo Walks',
  'travel.wellness': 'Wellness',
  'travel.family': 'Family',
  'travel.luxury': 'Luxury',
  'travel.offbeat': 'Offbeat',
  'travel.nightlife': 'Nightlife',
  'stories.travel_stories': 'Travel Stories',
  'stories.photo_essays': 'Photo Essays',
  'stories.tips_guides': 'Tips & Guides',
};

class ContentCard extends ConsumerStatefulWidget {
  final FeedContentItem item;
  final ContentCardVariant variant;
  final VoidCallback? onTap;

  /// Rail variant width. Grid variant ignores this (fills parent column).
  final double? railWidth;

  const ContentCard({
    super.key,
    required this.item,
    required this.variant,
    this.onTap,
    this.railWidth,
  });

  @override
  ConsumerState<ContentCard> createState() => _ContentCardState();
}

class _ContentCardState extends ConsumerState<ContentCard> {
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

  String get _categoryLabel {
    final type = widget.item.type;
    final isItinerary = type == 'itinerary' || type == 'self_paced_itinerary';
    final isPost = type == 'post' || type == 'story';
    if (isItinerary) {
      final d = widget.item.durationMinutes;
      if (d != null && d > 0) return '$_typeLabel · ${formatDurationCompact(d)}';
    }
    if (isPost) {
      final r = widget.item.tags.readTimeMin;
      if (r != null && r > 0) return '$_typeLabel · $r min';
    }
    return _typeLabel;
  }

  @override
  Widget build(BuildContext context) {
    final allMeta = _metaItems(widget.item);
    // Rail shows max 2 meta items (width-constrained); grid shows up to 3.
    final metaItems = widget.variant == ContentCardVariant.rail
        ? allMeta.take(2).toList()
        : allMeta;
    final body = Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
        boxShadow: const [
          // Ambient halo — no directional bias, renders a soft diffuse ring.
          BoxShadow(
            color: Color(0x0F101828), // ~6% ink
            blurRadius: 18,
            spreadRadius: -4,
            offset: Offset(0, 6),
          ),
          // Close contact — a hair tighter so the card doesn't feel floaty.
          BoxShadow(
            color: Color(0x08101828), // ~3% ink
            blurRadius: 4,
            spreadRadius: -1,
            offset: Offset(0, 1),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.max,
        children: [
          _cover(),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Sub-category pill — grid variant only, when id is known
                if (widget.variant == ContentCardVariant.grid)
                  _SubCategoryBadge(subCategoryId: widget.item.subCategoryId),
                _title(),
                const SizedBox(height: 6),
                _creatorRow(),
                if (metaItems.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  _MetaRow(items: metaItems),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    final pressable = Listener(
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
          child: body,
        ),
      ),
    );

    if (widget.variant == ContentCardVariant.rail) {
      return SizedBox(width: widget.railWidth ?? 170, child: pressable);
    }
    return pressable;
  }

  // ── Cover (4:5 portrait, three overlays) ────────────────────────
  Widget _cover() {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(10),
        bottomRight: Radius.circular(10),
      ),
      child: AspectRatio(
        aspectRatio: 1.0,
        child: Stack(
          fit: StackFit.expand,
          children: [
            _coverImage(),
            Positioned(
              top: 8,
              left: 8,
              child: _CategoryTag(label: _categoryLabel),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: _SaveToggle(contentId: widget.item.id),
            ),
            if (widget.item.pricePaisa > 0)
              Positioned(
                bottom: 8,
                right: 8,
                child: _PriceBadge(pricePaisa: widget.item.pricePaisa),
              ),
          ],
        ),
      ),
    );
  }

  Widget _coverImage() {
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

    if (url == null || url.isEmpty) return placeholder;
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (_, _) => placeholder,
      errorWidget: (_, _, _) => placeholder,
    );
  }

  // ── Title ──────────────────────────────────────────────────────
  Widget _title() {
    return Text(
      widget.item.title,
      style: AppTypography.body.copyWith(
        color: AppColors.ink,
        fontSize: 12,
        fontWeight: FontWeight.w600,
        height: 1.3,
      ),
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
  }

  // ── Creator row (avatar · short name · likes) ─────────────────
  Widget _creatorRow() {
    final creator = widget.item.creator;
    final name = shortAuthorName(
      displayName: creator?.displayName,
      username: creator?.username,
    );
    final avatarUrl = creator?.avatarUrl;
    final likes = widget.item.likeCount;

    final nameStyle = AppTypography.caption.copyWith(
      color: AppColors.inkSoft,
      fontSize: 11,
      fontWeight: FontWeight.w500,
    );
    final likesStyle = AppTypography.caption.copyWith(
      color: AppColors.inkMuted,
      fontSize: 11,
      fontWeight: FontWeight.w500,
    );

    return Row(
      children: [
        _CreatorAvatar(
          name: creator?.displayName ?? creator?.username ?? '',
          avatarUrl: avatarUrl,
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            name,
            style: nameStyle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (likes > 0) ...[
          const SizedBox(width: 6),
          const Icon(
            PhosphorIconsFill.heart,
            size: 12,
            color: AppColors.inkMuted,
          ),
          const SizedBox(width: 3),
          Text(formatCount(likes), style: likesStyle),
        ],
      ],
    );
  }
}

// ── Sub-category badge (below cover, grid variant only) ──────────────────────

class _SubCategoryBadge extends StatelessWidget {
  final String? subCategoryId;
  const _SubCategoryBadge({this.subCategoryId});

  @override
  Widget build(BuildContext context) {
    final name = subCategoryId != null ? _kSubCatNames[subCategoryId] : null;
    if (name == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          name,
          style: AppTypography.caption.copyWith(
            color: AppColors.inkMuted,
            fontSize: 10,
            fontWeight: FontWeight.w500,
            height: 1.2,
          ),
        ),
      ),
    );
  }
}

// ── Row-2 meta items (icon + label, below creator row) ────────────────────────

class _MetaItem {
  final IconData icon;
  final String label;
  const _MetaItem(this.icon, this.label);
}

/// Builds up to 3 meta items for [item]. Each item is an icon + label pair.
/// Falls back to the type label so the row is never empty.
List<_MetaItem> _metaItems(FeedContentItem item) {
  final tags = item.tags;
  final results = <_MetaItem>[];

  void add(IconData icon, String? value) {
    if (value == null || value.trim().isEmpty) return;
    results.add(_MetaItem(icon, value.trim()));
  }

  switch (item.type) {
    case 'post':
    case 'story':
      add(PhosphorIcons.mapPin(PhosphorIconsStyle.regular), tags.locationLabel);
      final rt = tags.readTimeMin;
      if (rt != null && rt > 0) add(PhosphorIcons.clock(PhosphorIconsStyle.regular), '${rt}m read');
      add(PhosphorIcons.users(PhosphorIconsStyle.regular), _pretty(tags.audience));

    case 'self_paced_itinerary':
    case 'itinerary':
      final d = item.durationMinutes;
      if (d != null && d > 0) {
        add(PhosphorIcons.clock(PhosphorIconsStyle.regular), formatDurationCompact(d));
      }
      add(PhosphorIcons.mapPin(PhosphorIconsStyle.regular), tags.locationLabel);
      add(PhosphorIcons.leaf(PhosphorIconsStyle.regular), _pretty(tags.season));

    case 'scheduled_experience':
      add(PhosphorIcons.mapPin(PhosphorIconsStyle.regular), tags.locationLabel);
      add(PhosphorIcons.leaf(PhosphorIconsStyle.regular), _pretty(tags.season));
      final bt = tags.budgetTier;
      if (bt != null && bt.isNotEmpty) {
        add(PhosphorIcons.tag(PhosphorIconsStyle.regular), bt == 'free' ? 'Free' : bt);
      }

    case 'event':
      add(PhosphorIcons.mapPin(PhosphorIconsStyle.regular), tags.locationLabel);
      add(PhosphorIcons.users(PhosphorIconsStyle.regular), _pretty(tags.audience));
      final eb = tags.budgetTier;
      if (eb != null && eb.isNotEmpty) {
        add(PhosphorIcons.tag(PhosphorIconsStyle.regular), eb == 'free' ? 'Free' : eb);
      }
  }

  // Fallback — always show at least the content type
  if (results.isEmpty) {
    final label = switch (item.type) {
      'post' || 'story' => 'Story',
      'self_paced_itinerary' || 'itinerary' => 'Itinerary',
      'scheduled_experience' => 'Experience',
      'event' => 'Event',
      _ => item.type.replaceAll('_', ' '),
    };
    results.add(_MetaItem(PhosphorIcons.bookOpen(PhosphorIconsStyle.regular), label));
  }

  return results.take(3).toList();
}

String? _pretty(String? raw) {
  if (raw == null) return null;
  final s = raw.trim();
  if (s.isEmpty) return null;
  final parts = s.split('_');
  final head = _cap(parts.first);
  if (parts.length == 1) return head;
  return '$head-${parts.skip(1).map((p) => p.toLowerCase()).join('-')}';
}

String _cap(String word) {
  if (word.isEmpty) return word;
  return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

class _MetaRow extends StatelessWidget {
  final List<_MetaItem> items;
  const _MetaRow({required this.items});

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      if (i > 0) {
        children.add(
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text('·',
                style: AppTypography.caption
                    .copyWith(color: AppColors.inkFaint, fontSize: 10, height: 1.2)),
          ),
        );
      }
      final it = items[i];
      children.add(
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(it.icon, size: 10, color: AppColors.inkMuted),
            const SizedBox(width: 3),
            Flexible(
              child: Text(
                it.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption.copyWith(
                  color: AppColors.inkMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  height: 1.2,
                ),
              ),
            ),
          ],
        ),
      );
    }
    return Row(mainAxisSize: MainAxisSize.min, children: children);
  }
}

// ── Category tag (top-left cover overlay) ──────────────────────────

class _CategoryTag extends StatelessWidget {
  final String label;
  const _CategoryTag({required this.label});

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
          fontWeight: FontWeight.w600,
          fontSize: 10,
          letterSpacing: 0.3,
          height: 1.1,
        ),
      ),
    );
  }
}

// ── Save toggle (top-right cover overlay) ──────────────────────────

class _SaveToggle extends ConsumerWidget {
  final String contentId;
  const _SaveToggle({required this.contentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedTo = ref.watch(saveStatusProvider(contentId));
    final isSaved = savedTo.isNotEmpty;

    return Semantics(
      button: true,
      toggled: isSaved,
      label: isSaved ? 'Remove from saved' : 'Save for later',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => showSaveToListSheet(context, ref, contentId),
        child: Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: 0.95),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Icon(
            isSaved
                ? PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.fill)
                : PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.regular),
            size: 16,
            color: isSaved ? AppColors.coral : AppColors.ink,
          ),
        ),
      ),
    );
  }
}

// ── Price badge (bottom-right cover overlay, paid only) ────────────

class _PriceBadge extends StatelessWidget {
  final int pricePaisa;
  const _PriceBadge({required this.pricePaisa});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        formatPrice(pricePaisa),
        style: AppTypography.caption.copyWith(
          color: AppColors.surface,
          fontWeight: FontWeight.w700,
          fontSize: 11,
          height: 1.1,
        ),
      ),
    );
  }
}

// ── Creator avatar (image or deterministic initial circle) ─────────

class _CreatorAvatar extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  const _CreatorAvatar({required this.name, this.avatarUrl});

  // Deterministic palette keyed by the hash of the creator's name.
  static const _initialPalette = [
    Color(0xFFB8860B), // amber
    Color(0xFF5A7247), // olive
    Color(0xFF7C5CBF), // violet
    Color(0xFFE15A41), // coral
    Color(0xFF3B7DD8), // blue
    Color(0xFF2D8F6F), // jade
    Color(0xFF8B4F8B), // plum
    Color(0xFF888888), // gray
  ];

  @override
  Widget build(BuildContext context) {
    final fallback = _initialCircle();
    if (avatarUrl == null || avatarUrl!.isEmpty) return fallback;

    return ClipOval(
      child: SizedBox(
        width: 20,
        height: 20,
        child: CachedNetworkImage(
          imageUrl: avatarUrl!,
          fit: BoxFit.cover,
          placeholder: (_, _) => fallback,
          errorWidget: (_, _, _) => fallback,
        ),
      ),
    );
  }

  Widget _initialCircle() {
    final color = _initialPalette[name.hashCode.abs() % _initialPalette.length];
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
          height: 1,
        ),
      ),
    );
  }
}
