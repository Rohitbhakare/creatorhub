import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// Full-bleed editorial photo tile used in the 2-column Discover themes grid.
///
/// Shows a cover photo with a bottom gradient scrim, a Fraunces title, and a
/// monospace subtitle (e.g. "214 chapters"). Tapping fires [onTap] with
/// haptic feedback and a press-scale animation.
class EditorialTile extends StatefulWidget {
  final String title;
  final String subtitle;
  final String? coverImageUrl;
  final VoidCallback? onTap;

  const EditorialTile({
    super.key,
    required this.title,
    required this.subtitle,
    this.coverImageUrl,
    this.onTap,
  });

  @override
  State<EditorialTile> createState() => _EditorialTileState();
}

class _EditorialTileState extends State<EditorialTile> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => setState(() => _pressed = true),
      onPointerUp: (_) => setState(() => _pressed = false),
      onPointerCancel: (_) => setState(() => _pressed = false),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          widget.onTap?.call();
        },
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1.0,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeInOut,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 3 / 4,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _cover(),
                  // Gradient scrim — top subtle, bottom heavy for text legibility
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color(0x00000000),
                          Color(0x33000000),
                          Color(0xBF000000),
                        ],
                        stops: [0.25, 0.55, 1.0],
                      ),
                    ),
                  ),
                  // Title + subtitle anchored to bottom
                  Positioned(
                    left: 14,
                    right: 14,
                    bottom: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.title,
                          style: AppTypography.h2.copyWith(
                            color: AppColors.surface,
                            fontSize: 19,
                            height: 1.15,
                            shadows: const [
                              Shadow(
                                color: Color(0x55000000),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 5),
                        Text(
                          widget.subtitle,
                          style: AppTypography.label.copyWith(
                            color: AppColors.surface.withValues(alpha: 0.75),
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
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
    );
  }

  Widget _cover() {
    final url = widget.coverImageUrl;
    final placeholder = _SubcategoryGradient(title: widget.title);
    if (url == null || url.isEmpty) return placeholder;
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (_, _) => placeholder,
      errorWidget: (_, _, _) => placeholder,
    );
  }
}

/// Tasteful ink-tone placeholder when no cover image is available.
/// Uses a subtle tonal gradient derived from the title hash to differentiate tiles.
class _SubcategoryGradient extends StatelessWidget {
  final String title;
  const _SubcategoryGradient({required this.title});

  // Deterministic palette of warm-neutral gradient pairs
  static const _palettes = [
    [Color(0xFF2C2823), Color(0xFF3D3228)], // deep ink / warm brown
    [Color(0xFF1E2B2A), Color(0xFF2A3D3B)], // deep teal
    [Color(0xFF2B1E1A), Color(0xFF3D2B24)], // deep terracotta
    [Color(0xFF1E221E), Color(0xFF2A332A)], // deep moss
    [Color(0xFF221E2B), Color(0xFF2E2A3A)], // deep violet
    [Color(0xFF2B2818), Color(0xFF3D3822)], // deep amber
  ];

  @override
  Widget build(BuildContext context) {
    final idx = title.hashCode.abs() % _palettes.length;
    final pair = _palettes[idx];
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: pair,
        ),
      ),
    );
  }
}
