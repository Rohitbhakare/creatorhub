import 'package:flutter/material.dart';

import '../theme/colors.dart';
import '../theme/layout.dart';

/// Shared card primitive — v2 Paper White elevation (SRS C-27).
///
/// Raised by default with the layered Paper-White shadow stack from
/// `AppColors.cardRaisedShadow`. Pass `flat: true` to force a border-only
/// variant for in-card info blocks, sunken rows, or cards that sit inside
/// other raised surfaces.
///
/// This widget does not participate in ink-selection semantics — for
/// selectable surfaces use `SelectionTile` (SRS C-26).
class AppCard extends StatelessWidget {
  final Widget child;
  final bool flat;
  final EdgeInsetsGeometry padding;
  final double radius;
  final VoidCallback? onTap;
  final Color? background;

  const AppCard({
    super.key,
    required this.child,
    this.flat = false,
    this.padding = const EdgeInsets.all(Layout.cardPadding),
    this.radius = Layout.cardRadius,
    this.onTap,
    this.background,
  });

  @override
  Widget build(BuildContext context) {
    final decoration = BoxDecoration(
      color: background ?? AppColors.surface,
      borderRadius: BorderRadius.circular(radius),
      border: flat
          ? Border.all(color: AppColors.hairline)
          : null,
      boxShadow: flat ? null : AppColors.cardRaisedShadow,
    );

    Widget content = Padding(padding: padding, child: child);

    if (onTap != null) {
      content = Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(radius),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(radius),
          child: content,
        ),
      );
    }

    return DecoratedBox(
      decoration: decoration,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: content,
      ),
    );
  }
}
