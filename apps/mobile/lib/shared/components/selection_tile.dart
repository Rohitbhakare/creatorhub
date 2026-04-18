import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsBold;

import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/typography.dart';

/// Standard selection tile — SRS C-26 "Selection state language".
///
/// Use for any selectable card/tile: interests picker, create-kind picker,
/// filter chips, publish-kind picker, KYC doc-type picker, booking pay-method
/// picker.
///
/// Rest state  — surface fill + 1.5dp hairlineStrong border + light shadow.
/// Selected    — surface fill + 1.5dp coral border + 3dp primaryTint halo
///                + coral icon tint + 18dp coral check badge (top-right).
///
/// Dark-fill selected states are disallowed by C-26. This widget enforces
/// the rule by construction — callers cannot choose an inverted fill.
class SelectionTile extends StatelessWidget {
  /// Optional leading icon. Rendered at its own color when not selected;
  /// tinted coral when selected.
  final Widget? leading;

  /// Primary label (required).
  final String label;

  /// Optional secondary label below `label` — e.g. counts, helper text.
  final String? sublabel;

  /// Whether this tile is currently selected.
  final bool selected;

  /// Tap callback. When null the tile is disabled (40% opacity, no tap).
  final VoidCallback? onTap;

  /// Corner radius. Defaults to `Layout.cardRadius`.
  final double radius;

  /// Minimum height for the tile body. The widget itself adapts but
  /// callers (grids) often want a consistent row height.
  final double? minHeight;

  /// Padding around the tile contents.
  final EdgeInsetsGeometry padding;

  /// Layout orientation.
  /// - `vertical` (default) — icon stacked above label (grid tiles)
  /// - `horizontal` — icon + label in a row (list rows, chips)
  final SelectionTileAxis axis;

  const SelectionTile({
    super.key,
    this.leading,
    required this.label,
    this.sublabel,
    required this.selected,
    required this.onTap,
    this.radius = Layout.cardRadius,
    this.minHeight,
    this.padding = const EdgeInsets.all(Layout.cardPadding),
    this.axis = SelectionTileAxis.vertical,
  });

  void _handleTap() {
    HapticFeedback.selectionClick();
    onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;
    final opacity = disabled ? 0.4 : 1.0;

    final borderColor = selected ? AppColors.coral : AppColors.hairlineStrong;
    const borderWidth = 1.5;

    // Selected-state halo: outer shadow of primaryTint, spread 3dp.
    // Rest-state shadow: subtle single-layer hairline shadow.
    final List<BoxShadow> shadow = selected
        ? const [
            BoxShadow(
              color: AppColors.primaryTint,
              spreadRadius: 3,
              blurRadius: 0,
            ),
          ]
        : const [
            BoxShadow(
              color: Color(0x0A101828),
              offset: Offset(0, 1),
              blurRadius: 3,
            ),
          ];

    final content = axis == SelectionTileAxis.vertical
        ? _buildVertical()
        : _buildHorizontal();

    return Opacity(
      opacity: opacity,
      child: GestureDetector(
        onTap: disabled ? null : _handleTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          curve: Curves.easeOut,
          constraints: BoxConstraints(minHeight: minHeight ?? 0),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: borderColor, width: borderWidth),
            boxShadow: shadow,
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Padding(padding: padding, child: content),
              if (selected) const Positioned(
                top: -6,
                right: -6,
                child: _CheckBadge(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVertical() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (leading != null) ...[
          IconTheme.merge(
            data: IconThemeData(
              color: selected ? AppColors.coral : null,
            ),
            child: leading!,
          ),
          const SizedBox(height: 8),
        ],
        Text(
          label,
          style: AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.ink,
          ),
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        if (sublabel != null) ...[
          const SizedBox(height: 2),
          Text(
            sublabel!,
            style: AppTypography.caption.copyWith(
              color: AppColors.inkMuted,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ],
    );
  }

  Widget _buildHorizontal() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (leading != null) ...[
          IconTheme.merge(
            data: IconThemeData(
              color: selected ? AppColors.coral : null,
            ),
            child: leading!,
          ),
          const SizedBox(width: 10),
        ],
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (sublabel != null)
                Text(
                  sublabel!,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.inkMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
      ],
    );
  }
}

enum SelectionTileAxis { vertical, horizontal }

class _CheckBadge extends StatelessWidget {
  const _CheckBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: AppColors.coral,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.surface, width: 1.5),
      ),
      alignment: Alignment.center,
      child: const Icon(
        PhosphorIconsBold.check,
        size: 11,
        color: AppColors.surface,
      ),
    );
  }
}
