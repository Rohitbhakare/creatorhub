import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/colors.dart';
import '../theme/typography.dart' as typ;

/// Avatar component: circle image with fallback initials.
/// Size variants: 24, 32, 40, 56dp. Optional verified badge overlay.
class AppAvatar extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double size;
  final bool showVerified;

  const AppAvatar({
    super.key,
    this.imageUrl,
    required this.name,
    this.size = 40,
    this.showVerified = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: showVerified ? size + 4 : size,
      height: showVerified ? size + 4 : size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Avatar
          ClipOval(
            child: SizedBox(
              width: size,
              height: size,
              child: imageUrl != null && imageUrl!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: imageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => _buildInitials(),
                      errorWidget: (_, _, _) => _buildInitials(),
                    )
                  : _buildInitials(),
            ),
          ),

          // Verified badge (bottom-right)
          if (showVerified)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: _badgeSize,
                height: _badgeSize,
                decoration: BoxDecoration(
                  color: AppColors.coral,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.surface, width: 1.5),
                ),
                child: Icon(
                  Icons.check,
                  size: _badgeSize * 0.6,
                  color: AppColors.surface,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInitials() {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final fontSize = size * 0.4;

    return Container(
      color: AppColors.surfaceAlt,
      alignment: Alignment.center,
      child: Text(
        initial,
        style: typ.AppTypography.body.copyWith(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: AppColors.inkSoft,
        ),
      ),
    );
  }

  double get _badgeSize {
    if (size >= 56) return 18;
    if (size >= 40) return 16;
    return 14;
  }
}
