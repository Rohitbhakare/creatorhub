import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/animations.dart';

/// Button variant.
enum AppButtonVariant { primary, secondary, ghost, danger }

/// Button size.
enum AppButtonSize {
  small(32),
  medium(44),
  large(52);

  final double height;
  const AppButtonSize(this.height);
}

/// CreatorHub button component.
/// Variants: primary (coral), secondary (outline), ghost (text), danger (red).
/// Includes haptic feedback, press animation, loading state (shimmer).
class AppButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool isLoading;
  final bool fullWidth;
  final IconData? leadingIcon;
  final IconData? trailingIcon;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.fullWidth = false,
    this.leadingIcon,
    this.trailingIcon,
  });

  bool get _isDisabled => onPressed == null || isLoading;

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton>
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

  void _onTapDown(TapDownDetails _) {
    if (!widget._isDisabled) _pressController.forward();
  }

  void _onTapUp(TapUpDetails _) {
    _pressController.reverse();
  }

  void _onTapCancel() {
    _pressController.reverse();
  }

  void _onTap() {
    if (widget._isDisabled) return;
    HapticFeedback.lightImpact();
    widget.onPressed?.call();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = Anim.shouldReduceMotion(context);

    Widget button = _buildVariant();

    // Wrap with scale animation
    if (!reduceMotion) {
      button = AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: button,
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: _onTap,
      child: SizedBox(
        width: widget.fullWidth ? double.infinity : null,
        height: widget.size.height,
        child: IgnorePointer(child: button),
      ),
    );
  }

  Widget _buildVariant() {
    return switch (widget.variant) {
      AppButtonVariant.primary => _buildFilled(
          bgColor: AppColors.coral,
          fgColor: AppColors.surface,
        ),
      AppButtonVariant.secondary => _buildOutlined(),
      AppButtonVariant.ghost => _buildGhost(),
      AppButtonVariant.danger => _buildFilled(
          bgColor: AppColors.danger,
          fgColor: AppColors.surface,
        ),
    };
  }

  Widget _buildFilled({required Color bgColor, required Color fgColor}) {
    return Container(
      constraints: const BoxConstraints(minWidth: Layout.minTapTarget),
      decoration: BoxDecoration(
        color: widget._isDisabled ? bgColor.withValues(alpha: 0.4) : bgColor,
        borderRadius: BorderRadius.circular(Layout.buttonRadius),
      ),
      padding: _padding,
      alignment: Alignment.center,
      child: _buildChild(fgColor),
    );
  }

  Widget _buildOutlined() {
    return Container(
      constraints: const BoxConstraints(minWidth: Layout.minTapTarget),
      decoration: BoxDecoration(
        border: Border.all(
          color: widget._isDisabled
              ? AppColors.hairline.withValues(alpha: 0.4)
              : AppColors.hairline,
        ),
        borderRadius: BorderRadius.circular(Layout.buttonRadius),
      ),
      padding: _padding,
      alignment: Alignment.center,
      child: _buildChild(
        widget._isDisabled
            ? AppColors.ink.withValues(alpha: 0.4)
            : AppColors.ink,
      ),
    );
  }

  Widget _buildGhost() {
    return Container(
      constraints: const BoxConstraints(minWidth: Layout.minTapTarget),
      padding: _padding,
      alignment: Alignment.center,
      child: _buildChild(
        widget._isDisabled
            ? AppColors.coral.withValues(alpha: 0.4)
            : AppColors.coral,
      ),
    );
  }

  EdgeInsets get _padding => switch (widget.size) {
        AppButtonSize.small =>
          const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        AppButtonSize.medium =>
          const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        AppButtonSize.large =>
          const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      };

  Widget _buildChild(Color color) {
    if (widget.isLoading) {
      return SizedBox(
        height: 18,
        width: 18,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: color,
        ),
      );
    }

    final textStyle = TextStyle(
      fontSize: widget.size == AppButtonSize.small ? 13 : 15,
      fontWeight: FontWeight.w600,
      color: color,
    );

    if (widget.leadingIcon == null && widget.trailingIcon == null) {
      return Text(
        widget.label,
        style: textStyle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.leadingIcon != null) ...[
          Icon(widget.leadingIcon, size: 18, color: color),
          const SizedBox(width: 8),
        ],
        Flexible(
          child: Text(
            widget.label,
            style: textStyle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (widget.trailingIcon != null) ...[
          const SizedBox(width: 8),
          Icon(widget.trailingIcon, size: 18, color: color),
        ],
      ],
    );
  }
}
