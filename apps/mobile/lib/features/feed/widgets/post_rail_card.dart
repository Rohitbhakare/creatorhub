import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/initial_avatar.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../saved/providers/saved_provider.dart';
import '../../saved/widgets/save_to_list_sheet.dart';
import '../models/feed_models.dart';

/// Polaroid-style post card for the Stories rail.
///
/// Strips the chrome that makes posts read like sellable trips: no category
/// tag, no price badge, no meta row. Keeps cover + 2-line Fraunces caption
/// preview + creator row + save toggle. Same 170 rail width as
/// `ContentCard(rail)` so the parent SizedBox sizing stays untouched.
class PostRailCard extends ConsumerStatefulWidget {
  final FeedContentItem item;
  final VoidCallback? onTap;
  final double width;

  const PostRailCard({
    super.key,
    required this.item,
    this.onTap,
    this.width = 170,
  });

  @override
  ConsumerState<PostRailCard> createState() => _PostRailCardState();
}

class _PostRailCardState extends ConsumerState<PostRailCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final item = widget.item;

    final body = Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F101828),
            blurRadius: 18,
            spreadRadius: -4,
            offset: Offset(0, 6),
          ),
          BoxShadow(
            color: Color(0x08101828),
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
          Flexible(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Title flexes to 1 line when the parent constraint is
                  // tight (cards in horizontal rails sit inside a fixed
                  // height) and to 2 when there is room.
                  Flexible(
                    child: Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.postBody.copyWith(
                        color: AppColors.ink,
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                        height: 1.3,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  _creatorRow(),
                ],
              ),
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

    return SizedBox(width: widget.width, child: pressable);
  }

  Widget _cover() {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(10),
        bottomRight: Radius.circular(10),
      ),
      child: AspectRatio(
        aspectRatio: 4 / 5,
        child: Stack(
          fit: StackFit.expand,
          children: [
            _coverImage(),
            Positioned(
              top: 8,
              right: 8,
              child: _SaveToggle(contentId: widget.item.id),
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

  Widget _creatorRow() {
    final creator = widget.item.creator;
    final name = shortAuthorName(
      displayName: creator?.displayName,
      username: creator?.username,
    );
    final likes = widget.item.likeCount;
    return Row(
      children: [
        InitialAvatar(
          name: creator?.displayName ?? creator?.username ?? '',
          avatarUrl: creator?.avatarUrl,
          size: 20,
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.caption.copyWith(
              color: AppColors.inkSoft,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
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
          Text(
            formatCount(likes),
            style: AppTypography.caption.copyWith(
              color: AppColors.inkMuted,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }
}

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

