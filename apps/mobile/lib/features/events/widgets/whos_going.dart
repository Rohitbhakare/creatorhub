import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/event_detail_provider.dart';

/// "Who's going" strip showing the first 4 attendee avatars
/// and a text label with the total count.
class WhosGoing extends StatelessWidget {
  final List<EventAttendee> attendees;
  final int attendeeCount;

  const WhosGoing({
    super.key,
    required this.attendees,
    required this.attendeeCount,
  });

  @override
  Widget build(BuildContext context) {
    if (attendeeCount == 0) return const SizedBox.shrink();

    return Row(
      children: [
        // Stacked avatars
        SizedBox(
          height: 32,
          width: _stackWidth(attendees.length),
          child: Stack(
            children: [
              for (int i = 0; i < attendees.length && i < 4; i++)
                Positioned(
                  left: i * 22.0,
                  child: _AttendeeAvatar(attendee: attendees[i]),
                ),
            ],
          ),
        ),
        const SizedBox(width: Spacing.md),

        // Count label
        Expanded(
          child: Text(
            _buildLabel(),
            style: typ.AppTypography.bodySmall.copyWith(
              color: AppColors.muted,
            ),
          ),
        ),
      ],
    );
  }

  double _stackWidth(int count) {
    final visible = count.clamp(0, 4);
    if (visible == 0) return 0;
    return 32 + (visible - 1) * 22.0;
  }

  String _buildLabel() {
    if (attendeeCount == 1) return '1 person going';
    return '$attendeeCount people going';
  }
}

class _AttendeeAvatar extends StatelessWidget {
  final EventAttendee attendee;

  const _AttendeeAvatar({required this.attendee});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.surface, width: 2),
      ),
      child: ClipOval(
        child: attendee.avatarUrl != null
            ? CachedNetworkImage(
                imageUrl: attendee.avatarUrl!,
                fit: BoxFit.cover,
                placeholder: (_, _) => _Placeholder(),
                errorWidget: (_, _, _) => _Placeholder(),
              )
            : _Placeholder(),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.sunken,
      child: const Center(
        child: Icon(
          PhosphorIconsFill.user,
          size: 16,
          color: AppColors.softInk,
        ),
      ),
    );
  }
}
