import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;

/// Venue / meeting point card shown on event detail page.
///
/// Shows venue name, address, and a map placeholder.
class MeetingPointCard extends StatelessWidget {
  final String? venueName;
  final String? venueAddress;
  final double? venueLat;
  final double? venueLng;

  const MeetingPointCard({
    super.key,
    this.venueName,
    this.venueAddress,
    this.venueLat,
    this.venueLng,
  });

  @override
  Widget build(BuildContext context) {
    final hasLocation = venueLat != null && venueLng != null;

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
          // Map placeholder (Google Maps widget in a future sprint)
          Container(
            width: double.infinity,
            height: 120,
            color: AppColors.surfaceAlt,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    PhosphorIconsFill.mapPin,
                    size: 32,
                    color: AppColors.coral.withValues(alpha: 0.5),
                  ),
                  if (hasLocation)
                    Padding(
                      padding: const EdgeInsets.only(top: Spacing.xs),
                      child: Text(
                        '${venueLat!.toStringAsFixed(4)}, '
                        '${venueLng!.toStringAsFixed(4)}',
                        style: typ.AppTypography.caption
                            .copyWith(color: AppColors.inkMuted),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Venue details
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
                      if (venueName != null && venueName!.isNotEmpty)
                        Text(
                          venueName!,
                          style: typ.AppTypography.body
                              .copyWith(fontWeight: FontWeight.w600),
                        ),
                      if (venueAddress != null && venueAddress!.isNotEmpty) ...[
                        const SizedBox(height: Spacing.xs),
                        Text(
                          venueAddress!,
                          style: typ.AppTypography.bodySmall
                              .copyWith(color: AppColors.inkSoft),
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
