import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Monochrome circular avatar — image when available, otherwise an
/// initial on a warm-neutral grayscale background. Replaces the older
/// 8-color palette pattern that violated the monochrome rule.
class InitialAvatar extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  final double size;

  const InitialAvatar({
    super.key,
    required this.name,
    this.avatarUrl,
    this.size = 20,
  });

  static const _palette = <Color>[
    Color(0xFF6B6660),
    Color(0xFF9C9689),
    Color(0xFF2C2823),
    Color(0xFF8B847A),
  ];

  @override
  Widget build(BuildContext context) {
    final fallback = _initialCircle();
    if (avatarUrl == null || avatarUrl!.isEmpty) return fallback;
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
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
    final color = _palette[name.hashCode.abs() % _palette.length];
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: size * 0.5,
          fontWeight: FontWeight.w700,
          color: color,
          height: 1,
        ),
      ),
    );
  }
}
