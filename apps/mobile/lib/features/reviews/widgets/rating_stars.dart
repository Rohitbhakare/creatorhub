import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';

/// Reusable star rating widget.
///
/// In read-only mode, shows filled/hollow stars based on [rating].
/// In interactive mode, tapping a star updates the rating via [onRatingChanged].
/// Coral-filled up to rating, hollow (outline) after.
class RatingStars extends StatefulWidget {
  /// Current rating value (1–5). Supports half-star precision.
  final double rating;

  /// Size of each star icon in logical pixels.
  final double size;

  /// If true, stars are tappable and call [onRatingChanged].
  final bool interactive;

  /// Called when the user selects a star (interactive mode only).
  final void Function(double rating)? onRatingChanged;

  const RatingStars({
    super.key,
    required this.rating,
    this.size = 24,
    this.interactive = false,
    this.onRatingChanged,
  }) : assert(
          !interactive || onRatingChanged != null,
          'onRatingChanged must be provided when interactive is true',
        );

  @override
  State<RatingStars> createState() => _RatingStarsState();
}

class _RatingStarsState extends State<RatingStars> {
  late double _hoverRating;

  @override
  void initState() {
    super.initState();
    _hoverRating = widget.rating;
  }

  @override
  void didUpdateWidget(RatingStars oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.interactive) {
      _hoverRating = widget.rating;
    }
  }

  void _onStarTap(int starIndex) {
    if (!widget.interactive) return;
    final newRating = starIndex.toDouble();
    HapticFeedback.lightImpact();
    setState(() => _hoverRating = newRating);
    widget.onRatingChanged?.call(newRating);
  }

  @override
  Widget build(BuildContext context) {
    final displayRating = widget.interactive ? _hoverRating : widget.rating;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final starNumber = i + 1;
        final isFilled = displayRating >= starNumber;

        final star = Icon(
          isFilled
              ? PhosphorIconsFill.star
              : PhosphorIcons.star(),
          size: widget.size,
          color: isFilled ? AppColors.coral : AppColors.hairline,
        );

        if (!widget.interactive) {
          return Padding(
            padding: EdgeInsets.only(right: i < 4 ? 2 : 0),
            child: star,
          );
        }

        return GestureDetector(
          onTap: () => _onStarTap(starNumber),
          child: SizedBox(
            width: widget.size + 4,
            height: widget.size + 4,
            child: Padding(
              padding: const EdgeInsets.all(2),
              child: star,
            ),
          ),
        );
      }),
    );
  }
}

/// Compact read-only star display with numeric rating label.
/// E.g. "★ 4.5" used in review tiles.
class RatingBadge extends StatelessWidget {
  final double rating;
  final int reviewCount;

  const RatingBadge({
    super.key,
    required this.rating,
    this.reviewCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            PhosphorIconsFill.star,
            size: 14,
            color: AppColors.coral,
          ),
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
          if (reviewCount > 0) ...[
            const SizedBox(width: 4),
            Text(
              '($reviewCount)',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.inkMuted,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
