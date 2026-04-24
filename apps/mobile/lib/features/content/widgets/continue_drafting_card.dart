import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/animations.dart';
import '../../../shared/theme/colors.dart';
import '../providers/wizard_provider.dart';

/// Gated off in v1 — no local draft store or "fetch latest draft" endpoint.
/// Flip `contentTypePickerDraftCardEnabled` in the screen when the endpoint
/// ships.
class DraftSummary {
  final ContentType contentType;
  final String? coverUrl;
  final String destinationSeed;
  final String bodyFragment;
  final int wordCount;
  final String relativeTimeLabel;
  final VoidCallback? onTap;

  const DraftSummary({
    required this.contentType,
    required this.destinationSeed,
    required this.bodyFragment,
    required this.wordCount,
    required this.relativeTimeLabel,
    this.coverUrl,
    this.onTap,
  });
}

class ContinueDraftingCard extends StatefulWidget {
  final DraftSummary draft;

  const ContinueDraftingCard({super.key, required this.draft});

  @override
  State<ContinueDraftingCard> createState() => _ContinueDraftingCardState();
}

class _ContinueDraftingCardState extends State<ContinueDraftingCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pressController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _pressController = AnimationController(
      vsync: this,
      duration: Anim.cardPressDuration,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: Anim.cardPressScale)
        .animate(CurvedAnimation(
      parent: _pressController,
      curve: Anim.pressCurve,
    ));
  }

  @override
  void dispose() {
    _pressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.draft;
    final quotedFragment =
        d.bodyFragment.length <= 60 ? d.bodyFragment : '${d.bodyFragment.substring(0, 60)}…';
    final wordsLabel = d.wordCount == 1 ? '1 word' : '${d.wordCount} words';

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _pressController.forward(),
      onTapUp: (_) => _pressController.reverse(),
      onTapCancel: () => _pressController.reverse(),
      onTap: () {
        HapticFeedback.lightImpact();
        d.onTap?.call();
      },
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (_, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: AppColors.cardRaisedShadow,
          ),
          child: Row(
            children: [
              _Thumbnail(coverUrl: d.coverUrl, seed: d.destinationSeed),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      d.relativeTimeLabel.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.8,
                        height: 1.2,
                        color: AppColors.inkMuted,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '\u201C$quotedFragment\u201D',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.fraunces(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        height: 1.35,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Draft · $wordsLabel',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w400,
                        height: 1.3,
                        color: AppColors.inkSoft,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                PhosphorIconsRegular.caretRight,
                size: 18,
                color: AppColors.inkMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  final String? coverUrl;
  final String seed;

  const _Thumbnail({this.coverUrl, required this.seed});

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(12);
    if (coverUrl != null && coverUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: radius,
        child: CachedNetworkImage(
          imageUrl: coverUrl!,
          width: 44,
          height: 44,
          fit: BoxFit.cover,
          placeholder: (_, _) => _gradientFallback(seed, radius),
          errorWidget: (_, _, _) => _gradientFallback(seed, radius),
        ),
      );
    }
    return _gradientFallback(seed, radius);
  }

  Widget _gradientFallback(String seed, BorderRadius radius) {
    final hash = seed.codeUnits.fold<int>(0, (acc, c) => acc + c);
    final palette = [
      [const Color(0xFFFAECE7), const Color(0xFFF5C4B3)],
      [const Color(0xFFE6F1FB), const Color(0xFFB5D4F4)],
      [const Color(0xFFEAF3DE), const Color(0xFFC0DD97)],
      [const Color(0xFFF3EAFB), const Color(0xFFCFB5F4)],
    ];
    final stops = palette[hash % palette.length];
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        borderRadius: radius,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: stops,
        ),
      ),
    );
  }
}
