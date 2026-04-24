import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/theme/animations.dart';
import '../../../shared/theme/colors.dart';
import '../services/daily_prompt_service.dart';

class PromptOfTheDayCard extends StatefulWidget {
  final DailyPrompt prompt;
  final VoidCallback? onTap;

  const PromptOfTheDayCard({
    super.key,
    required this.prompt,
    this.onTap,
  });

  @override
  State<PromptOfTheDayCard> createState() => _PromptOfTheDayCardState();
}

class _PromptOfTheDayCardState extends State<PromptOfTheDayCard>
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
    return Semantics(
      button: true,
      label: 'Prompt of the day: ${widget.prompt.text}',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => _pressController.forward(),
        onTapUp: (_) => _pressController.reverse(),
        onTapCancel: () => _pressController.reverse(),
        onTap: () {
          HapticFeedback.lightImpact();
          widget.onTap?.call();
        },
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (_, child) => Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                boxShadow: AppColors.cardRaisedShadow,
              ),
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(width: 3, color: AppColors.coral),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 14, 18, 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'NEED A NUDGE?',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                                letterSpacing: 0.9,
                                height: 1.2,
                                color: AppColors.coral,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              widget.prompt.text,
                              style: GoogleFonts.fraunces(
                                fontSize: 14,
                                fontWeight: FontWeight.w400,
                                fontStyle: FontStyle.italic,
                                height: 1.4,
                                color: AppColors.ink,
                              ),
                            ),
                          ],
                        ),
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
