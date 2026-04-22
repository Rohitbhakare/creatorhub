import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../models/feed_models.dart';

/// Full-width photo-overlay hero card (220h). Title + creator chip
/// sit on a bottom gradient scrim. Tab-aware eyebrow comes from caller.
class HeroCard extends StatefulWidget {
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
  State<HeroCard> createState() => _HeroCardState();
}

class _HeroCardState extends State<HeroCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final url = widget.item.coverImageUrl;
    final creator = widget.item.creator?.displayName;

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
                height: 220,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (url != null)
                      CachedNetworkImage(
                        imageUrl: url,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => const _Placeholder(),
                        errorWidget: (_, _, _) => const _Placeholder(),
                      )
                    else
                      const _Placeholder(),
                    // Bottom scrim for legibility
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Color(0x00000000),
                            Color(0x4D000000),
                            Color(0xB3000000),
                          ],
                          stops: [0.35, 0.65, 1.0],
                        ),
                      ),
                    ),
                    // Eyebrow top-left
                    Positioned(
                      top: 16,
                      left: 16,
                      right: 16,
                      child: Text(
                        widget.eyebrow.toUpperCase(),
                        style: AppTypography.label.copyWith(
                          color: AppColors.coral,
                          letterSpacing: 1.1,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    // Title + creator bottom-left
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
                                  color: Color(0x66000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 1),
                                ),
                              ],
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (creator != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              'by $creator',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.surface.withValues(alpha: 0.88),
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
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
}

class _Placeholder extends StatelessWidget {
  const _Placeholder();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surfaceAlt, AppColors.hairline],
        ),
      ),
    );
  }
}
