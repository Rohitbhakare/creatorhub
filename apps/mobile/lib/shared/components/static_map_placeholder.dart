import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../theme/colors.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// One pin to plot on the placeholder map.
class MapPin {
  final double lat;
  final double lng;

  /// Overnight stops are highlighted in coral (the only authorised
  /// coral usage on this widget — DD-013 #5).
  final bool isOvernight;
  final String? label;

  const MapPin({
    required this.lat,
    required this.lng,
    this.isOvernight = false,
    this.label,
  });
}

/// City-tinted radial gradient with plotted dots — no external map SDK.
///
/// The widget normalises pin lat/lng into the available bounding box and
/// paints them as filled phosphor mapPins (coral for overnight, ink for
/// regular). When [pins] is empty the empty-state shows a tinted compass
/// icon centered.
class StaticMapPlaceholder extends StatelessWidget {
  final List<MapPin> pins;
  final double aspectRatio;

  /// Center tint of the radial gradient. Defaults to a soft slate.
  final Color cityTint;

  const StaticMapPlaceholder({
    super.key,
    required this.pins,
    this.aspectRatio = 16 / 9,
    this.cityTint = const Color(0xFFE3E7EE),
  });

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: aspectRatio,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              colors: [cityTint, AppColors.surface],
              stops: const [0.0, 1.0],
              radius: 0.9,
            ),
          ),
          child: pins.isEmpty
              ? _buildEmpty()
              : LayoutBuilder(
                  builder: (context, constraints) => CustomPaint(
                    size: Size(constraints.maxWidth, constraints.maxHeight),
                    painter: _MapDotsPainter(pins: pins),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          PhosphorIcons.compass(),
          size: 36,
          color: AppColors.inkMuted,
        ),
        const SizedBox(height: Spacing.xs),
        Text('Map preview', style: AppTypography.caption),
      ],
    );
  }
}

class _MapDotsPainter extends CustomPainter {
  final List<MapPin> pins;
  _MapDotsPainter({required this.pins});

  @override
  void paint(Canvas canvas, Size size) {
    if (pins.isEmpty) return;

    final lats = pins.map((p) => p.lat).toList();
    final lngs = pins.map((p) => p.lng).toList();
    var minLat = lats.reduce((a, b) => a < b ? a : b);
    var maxLat = lats.reduce((a, b) => a > b ? a : b);
    var minLng = lngs.reduce((a, b) => a < b ? a : b);
    var maxLng = lngs.reduce((a, b) => a > b ? a : b);

    // Avoid divide-by-zero when all pins coincide; expand a tiny window.
    if ((maxLat - minLat).abs() < 1e-6) {
      minLat -= 0.005;
      maxLat += 0.005;
    }
    if ((maxLng - minLng).abs() < 1e-6) {
      minLng -= 0.005;
      maxLng += 0.005;
    }

    const padX = 24.0;
    const padY = 24.0;
    final w = size.width - 2 * padX;
    final h = size.height - 2 * padY;

    Offset project(MapPin p) {
      final nx = (p.lng - minLng) / (maxLng - minLng);
      // Latitude grows north → screen y decreases with higher latitude.
      final ny = 1 - (p.lat - minLat) / (maxLat - minLat);
      return Offset(padX + nx * w, padY + ny * h);
    }

    // Draw faint connecting line between sequential pins.
    if (pins.length > 1) {
      final linePaint = Paint()
        ..color = AppColors.inkMuted.withValues(alpha: 0.4)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke;
      final path = Path()..moveTo(project(pins.first).dx, project(pins.first).dy);
      for (var i = 1; i < pins.length; i++) {
        final pt = project(pins[i]);
        path.lineTo(pt.dx, pt.dy);
      }
      canvas.drawPath(path, linePaint);
    }

    final regularPaint = Paint()..color = AppColors.ink;
    final overnightPaint = Paint()..color = AppColors.coral;

    for (final p in pins) {
      final c = project(p);
      final radius = p.isOvernight ? 7.0 : 5.0;
      // White ring backdrop so the dot reads on busy gradients.
      canvas.drawCircle(
        c,
        radius + 2,
        Paint()..color = AppColors.surface,
      );
      canvas.drawCircle(c, radius, p.isOvernight ? overnightPaint : regularPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _MapDotsPainter old) => old.pins != pins;
}
