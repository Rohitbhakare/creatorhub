import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../models/feed_models.dart';

/// Date-block card for time-bound events / scheduled experiences.
///
/// Anatomy: small SAT/12 date chip on the left, then eyebrow (MEETUP/EVENT)
/// + title + time row + social-proof row stacked on the right. No cover photo
/// — events convert on date + social proof, not imagery.
class EventCard extends StatefulWidget {
  final FeedContentItem item;
  final VoidCallback? onTap;
  final double width;

  const EventCard({
    super.key,
    required this.item,
    this.onTap,
    this.width = 280,
  });

  @override
  State<EventCard> createState() => _EventCardState();
}

class _EventCardState extends State<EventCard> {
  bool _pressed = false;

  static const _dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  String _formatTime(DateTime dt) {
    final local = dt.toLocal();
    final hour24 = local.hour;
    final hour12 = hour24 == 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24);
    final mm = local.minute.toString().padLeft(2, '0');
    final period = hour24 < 12 ? 'AM' : 'PM';
    return '$hour12:$mm $period';
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final start = item.startAt?.toLocal();
    final isMeetup = item.isCreatorMeetup;
    final eyebrow = isMeetup ? 'MEETUP' : 'EVENT';
    final eyebrowColor = isMeetup ? AppColors.coral : AppColors.inkSoft;

    final creatorName = shortAuthorName(
      displayName: item.creator?.displayName,
      username: item.creator?.username,
    );

    final timeStr = start != null ? _formatTime(start) : null;
    final timeRow = [
      if (timeStr != null) timeStr,
      if (creatorName.isNotEmpty) creatorName,
    ].join(' · ');

    final card = Container(
      width: widget.width,
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
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DateBlock(start: start, dayNames: _dayNames),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  eyebrow,
                  style: AppTypography.label.copyWith(
                    color: eyebrowColor,
                    letterSpacing: 0.6,
                    fontSize: 10,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.body.copyWith(
                    color: AppColors.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 4),
                if (timeRow.isNotEmpty)
                  Text(
                    timeRow,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.inkMuted,
                      fontSize: 11,
                    ),
                  ),
                const SizedBox(height: 4),
                _SocialProof(item: item),
              ],
            ),
          ),
        ],
      ),
    );

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
          child: card,
        ),
      ),
    );
  }
}

class _DateBlock extends StatelessWidget {
  final DateTime? start;
  final List<String> dayNames;
  const _DateBlock({required this.start, required this.dayNames});

  @override
  Widget build(BuildContext context) {
    final hasDate = start != null;
    final dayLabel = hasDate ? dayNames[start!.weekday % 7] : '—';
    final dayNum = hasDate ? start!.day.toString() : '·';

    return Container(
      width: 52,
      height: 64,
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            dayLabel,
            style: AppTypography.label.copyWith(
              color: AppColors.coral,
              fontSize: 10,
              letterSpacing: 0.6,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            dayNum,
            style: AppTypography.h2.copyWith(
              color: AppColors.ink,
              fontSize: 22,
              fontWeight: FontWeight.w600,
              height: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}

class _SocialProof extends StatelessWidget {
  final FeedContentItem item;
  const _SocialProof({required this.item});

  @override
  Widget build(BuildContext context) {
    final going = item.goingCount ?? 0;
    final cap = item.capacity;
    final spotsLeft = (cap != null && going >= 0) ? cap - going : null;
    final isPaid = item.pricePaisa > 0;

    // Fallback when there's no traction yet — show the price (paid) or "Free".
    if (going <= 0) {
      final text = isPaid ? formatPrice(item.pricePaisa) : 'Free';
      return Text(
        text,
        style: AppTypography.caption.copyWith(
          color: AppColors.inkSoft,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      );
    }

    final showSpotsLeft =
        spotsLeft != null && spotsLeft > 0 && spotsLeft <= 5;
    final spotsLow = showSpotsLeft;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$going going',
          style: AppTypography.caption.copyWith(
            color: AppColors.inkMuted,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (showSpotsLeft) ...[
          Text(
            ' · ',
            style: AppTypography.caption.copyWith(
              color: AppColors.inkFaint,
              fontSize: 11,
            ),
          ),
          Text(
            '$spotsLeft spots left',
            style: AppTypography.caption.copyWith(
              color: spotsLow ? AppColors.coral : AppColors.inkMuted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ] else if (isPaid) ...[
          Text(
            ' · ',
            style: AppTypography.caption.copyWith(
              color: AppColors.inkFaint,
              fontSize: 11,
            ),
          ),
          Text(
            formatPrice(item.pricePaisa),
            style: AppTypography.caption.copyWith(
              color: AppColors.inkSoft,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
    );
  }
}
