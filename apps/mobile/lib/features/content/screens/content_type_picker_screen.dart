import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsRegular;

import '../../../shared/theme/animations.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/utils/toast.dart';
import '../../kyc/providers/kyc_provider.dart';
import '../config/create_tile_config.dart';
import '../providers/wizard_provider.dart';
import '../services/daily_prompt_service.dart';
import '../widgets/continue_drafting_card.dart';
import '../widgets/create_tile.dart';
import '../widgets/prompt_of_the_day_card.dart';

/// When the fetch-latest-draft API endpoint ships, flip this to `true` and
/// wire a provider that supplies a `DraftSummary?`.
const bool kContinueDraftingEnabled = false;

class ContentTypePickerScreen extends ConsumerWidget {
  const ContentTypePickerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reduceMotion = Anim.shouldReduceMotion(context);
    final DraftSummary? draft =
        kContinueDraftingEnabled ? _resolveLatestDraft(ref) : null;
    // KYC badge: show on tiles that requiresKyc when user is not yet verified
    final kycAsync = ref.watch(kycStatusProvider);
    final kycVerified = kycAsync.asData?.value.status == 'verified';

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _TopBar(),
              const SizedBox(height: 28),
              const _EditorialHeading(),
              if (draft != null) ...[
                const SizedBox(height: 24),
                _animateIn(
                  index: 0,
                  reduceMotion: reduceMotion,
                  child: ContinueDraftingCard(draft: draft),
                ),
              ],
              const SizedBox(height: 22),
              const _SectionLabel('OR START SOMETHING NEW'),
              const SizedBox(height: 14),
              for (var i = 0; i < kCreateTiles.length; i++) ...[
                if (i > 0) const SizedBox(height: 12),
                _animateIn(
                  index: i + 1,
                  reduceMotion: reduceMotion,
                  child: CreateTile(
                    spec: kCreateTiles[i],
                    onTap: () => _selectType(context, ref, kCreateTiles[i].contentType),
                    onNotifyMe: () => _onNotifyMe(context),
                    showKycBadge: !kycVerified,
                  ),
                ),
              ],
              const SizedBox(height: 22),
              _animateIn(
                index: kCreateTiles.length + 1,
                reduceMotion: reduceMotion,
                child: _PromptSlot(
                  onTap: (prompt) => _startPostFromPrompt(context, ref, prompt),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _animateIn({
    required int index,
    required bool reduceMotion,
    required Widget child,
  }) {
    if (reduceMotion) {
      return child.animate().fadeIn(duration: const Duration(milliseconds: 120));
    }
    return child
        .animate()
        .fadeIn(
          delay: Duration(milliseconds: index * 60),
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        )
        .moveY(
          begin: 8,
          end: 0,
          delay: Duration(milliseconds: index * 60),
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
  }

  DraftSummary? _resolveLatestDraft(WidgetRef ref) {
    // Intentionally unimplemented until the fetch-latest-draft API ships.
    // Keeping the hook visible so wiring is a one-line change.
    return null;
  }

  void _selectType(BuildContext context, WidgetRef ref, ContentType type) {
    ref.read(wizardProvider.notifier).initWizard(type, 'travel');
    context.push(
      '/content/wizard',
      extra: {'type': type.name, 'vertical': 'travel'},
    );
  }

  void _startPostFromPrompt(
    BuildContext context,
    WidgetRef ref,
    DailyPrompt prompt,
  ) {
    ref.read(wizardProvider.notifier)
      ..initWizard(ContentType.post, 'travel')
      ..setTitle(prompt.text);
    context.push(
      '/content/wizard',
      extra: {'type': ContentType.post.name, 'vertical': 'travel'},
    );
  }

  void _onNotifyMe(BuildContext context) {
    showAppToast(context, "We'll let you know when Experiences launch");
  }
}

class _TopBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat('MMMM d').format(DateTime.now());
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            HapticFeedback.lightImpact();
            if (context.canPop()) context.pop();
          },
          child: const SizedBox(
            width: 44,
            height: 44,
            child: Align(
              alignment: Alignment.centerLeft,
              child: Icon(
                PhosphorIconsRegular.arrowLeft,
                size: 22,
                color: AppColors.ink,
              ),
            ),
          ),
        ),
        const Spacer(),
        Text(
          dateLabel,
          style: GoogleFonts.fraunces(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            fontStyle: FontStyle.italic,
            height: 1.2,
            color: AppColors.inkSoft,
          ),
        ),
      ],
    );
  }
}

class _EditorialHeading extends StatelessWidget {
  const _EditorialHeading();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "TODAY'S PAGE",
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            letterSpacing: 1.1,
            height: 1.2,
            color: AppColors.coral,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Every place holds a story.',
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w500,
            height: 1.22,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          "Which one's yours today?",
          style: GoogleFonts.fraunces(
            fontSize: 18,
            fontWeight: FontWeight.w400,
            fontStyle: FontStyle.italic,
            height: 1.35,
            color: AppColors.inkSoft,
          ),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        letterSpacing: 1.0,
        height: 1.2,
        color: AppColors.inkSoft,
      ),
    );
  }
}

class _PromptSlot extends ConsumerWidget {
  final void Function(DailyPrompt) onTap;
  const _PromptSlot({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(dailyPromptProvider);
    return async.when(
      data: (prompt) => PromptOfTheDayCard(
        prompt: prompt,
        onTap: () => onTap(prompt),
      ),
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}
