import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/theme/animations.dart';
import '../../../shared/theme/colors.dart';
import '../config/create_tile_config.dart';

class CreateTile extends StatefulWidget {
  final CreateTileSpec spec;
  final VoidCallback? onTap;
  final VoidCallback? onNotifyMe;

  const CreateTile({
    super.key,
    required this.spec,
    this.onTap,
    this.onNotifyMe,
  });

  @override
  State<CreateTile> createState() => _CreateTileState();
}

class _CreateTileState extends State<CreateTile>
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
    if (widget.spec.comingSoon) return;
    _pressController.forward();
  }

  void _onTapUp(TapUpDetails _) => _pressController.reverse();
  void _onTapCancel() => _pressController.reverse();

  void _onTap() {
    if (widget.spec.comingSoon) return;
    HapticFeedback.lightImpact();
    widget.onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    final spec = widget.spec;
    final shadow = spec.comingSoon
        ? const [
            BoxShadow(
              color: Color(0x0A101828),
              offset: Offset(0, 1),
              blurRadius: 3,
            ),
            BoxShadow(
              color: Color(0x0A101828),
              offset: Offset(0, 2),
              blurRadius: 6,
            ),
          ]
        : AppColors.cardRaisedShadow;

    final cardInterior = Padding(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: spec.iconFill,
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: Icon(spec.icon, size: 22, color: spec.iconForeground),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  spec.title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    height: 1.25,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  spec.descriptor,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    height: 1.4,
                    color: AppColors.inkSoft,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    final card = Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: shadow,
      ),
      child: Stack(
        children: [
          if (spec.comingSoon)
            Opacity(opacity: 0.65, child: cardInterior)
          else
            cardInterior,
          if (spec.comingSoon)
            Positioned(
              top: 14,
              right: 14,
              child: _NotifyMeButton(onTap: widget.onNotifyMe),
            ),
        ],
      ),
    );

    return Semantics(
      button: true,
      label: '${spec.title}: ${spec.descriptor}',
      enabled: !spec.comingSoon,
      child: GestureDetector(
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        onTap: _onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (_, child) => Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          ),
          child: card,
        ),
      ),
    );
  }
}

class _NotifyMeButton extends StatelessWidget {
  final VoidCallback? onTap;
  const _NotifyMeButton({this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Notify me when Experiences launch',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.lightImpact();
          onTap?.call();
        },
        child: Container(
          constraints: const BoxConstraints(
            minWidth: 44,
            minHeight: 44,
          ),
          alignment: Alignment.center,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0x26000000),
                width: 0.5,
              ),
            ),
            child: Text(
              'Notify me',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                height: 1.2,
                color: AppColors.ink,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
