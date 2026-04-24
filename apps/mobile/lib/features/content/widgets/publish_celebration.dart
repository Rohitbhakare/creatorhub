import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../providers/wizard_provider.dart';

/// Full-screen celebratory overlay shown after a successful publish.
///
/// Auto-dismisses after ~1.6s. Shows a contextual headline per content type.
/// Honours [MediaQuery.disableAnimations] — fades only when reduce motion
/// is on.
class PublishCelebration {
  static const _visibleDuration = Duration(milliseconds: 1600);

  /// Displays the overlay and resolves when it is dismissed.
  static Future<void> show(
    BuildContext context, {
    required ContentType contentType,
  }) {
    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierLabel: 'Publish celebration',
      barrierColor: AppColors.ink.withValues(alpha: 0.85),
      transitionDuration: const Duration(milliseconds: 240),
      pageBuilder: (ctx, _, _) => _CelebrationContent(contentType: contentType),
      transitionBuilder: (_, anim, _, child) {
        return FadeTransition(opacity: anim, child: child);
      },
    );
  }
}

String _headlineFor(ContentType type) => switch (type) {
      ContentType.post => 'Your story is live.',
      ContentType.selfPacedItinerary => 'Ready for travelers.',
      ContentType.event => 'Event is live.',
      ContentType.scheduledExperience => 'Experience is live.',
    };

String _subheadFor(ContentType type) => switch (type) {
      ContentType.post => 'Thanks for sharing.',
      ContentType.selfPacedItinerary => 'Go inspire a trip.',
      ContentType.event => 'Let the RSVPs roll in.',
      ContentType.scheduledExperience => 'Hosts ready, doors open.',
    };

class _CelebrationContent extends StatefulWidget {
  final ContentType contentType;
  const _CelebrationContent({required this.contentType});

  @override
  State<_CelebrationContent> createState() => _CelebrationContentState();
}

class _CelebrationContentState extends State<_CelebrationContent> {
  @override
  void initState() {
    super.initState();
    Future.delayed(PublishCelebration._visibleDuration, () {
      if (!mounted) return;
      Navigator.of(context).pop();
    });
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    const icon = Icon(
      PhosphorIconsFill.sparkle,
      size: 56,
      color: AppColors.coral,
    );

    final animatedIcon = reduceMotion
        ? icon
        : icon
            .animate()
            .scale(
              begin: const Offset(0.6, 0.6),
              end: const Offset(1.0, 1.0),
              duration: 360.ms,
              curve: Curves.easeOutBack,
            )
            .rotate(
              begin: -0.04,
              end: 0.04,
              duration: 600.ms,
              curve: Curves.easeInOut,
            );

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            animatedIcon,
            const SizedBox(height: Spacing.xl),
            Text(
              _headlineFor(widget.contentType),
              textAlign: TextAlign.center,
              style: GoogleFonts.fraunces(
                fontSize: 32,
                fontWeight: FontWeight.w500,
                height: 1.15,
                color: AppColors.surface,
              ),
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              _subheadFor(widget.contentType),
              textAlign: TextAlign.center,
              style: GoogleFonts.fraunces(
                fontSize: 16,
                fontStyle: FontStyle.italic,
                color: AppColors.surface.withValues(alpha: 0.85),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
