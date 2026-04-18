import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/review_provider.dart';
import '../widgets/rating_stars.dart';

/// Screen to write and submit a review for a completed booking.
///
/// Layout:
/// 1. AppBar: "Write a Review"
/// 2. Star rating selector (5 stars, tappable, coral filled)
/// 3. Review text field (multiline, max 500 chars, char counter)
/// 4. Info banner: "Reviews are revealed 14 days after completion"
/// 5. Submit button (primary, full width)
class WriteReviewScreen extends ConsumerStatefulWidget {
  final String bookingId;

  const WriteReviewScreen({super.key, required this.bookingId});

  @override
  ConsumerState<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends ConsumerState<WriteReviewScreen> {
  static const int _maxChars = 500;

  final _textController = TextEditingController();
  int _rating = 0;

  bool get _canSubmit =>
      _rating > 0 && _textController.text.trim().isNotEmpty;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_canSubmit) return;
    unawaited(HapticFeedback.lightImpact());

    final notifier = ref.read(submitReviewProvider.notifier);
    final success = await notifier.submit(
      bookingId: widget.bookingId,
      rating: _rating,
      reviewerText: _textController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Review submitted! It will be revealed in 14 days.'),
          backgroundColor: AppColors.success,
        ),
      );
      context.pop();
    } else {
      final errorState = ref.read(submitReviewProvider).value;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorState?.error ?? 'Failed to submit review'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final submitState = ref.watch(submitReviewProvider);
    final isLoading = submitState.isLoading;

    return SafeArea(
      child: Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          elevation: 0,
          title: Text('Write a Review', style: typ.AppTypography.h3),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.ink),
            onPressed: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: Layout.screenPaddingH,
            vertical: Spacing.xl,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Star rating ────────────────────────────────────
              Text('Your rating', style: typ.AppTypography.h4),
              const SizedBox(height: Spacing.md),
              Center(
                child: RatingStars(
                  rating: _rating.toDouble(),
                  size: 40,
                  interactive: true,
                  onRatingChanged: (value) {
                    setState(() => _rating = value.toInt());
                  },
                ),
              ),
              if (_rating == 0)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.xs),
                  child: Center(
                    child: Text(
                      'Tap a star to rate',
                      style: typ.AppTypography.caption,
                    ),
                  ),
                ),

              const SizedBox(height: Spacing.xl),

              // ── Review text ────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Your review', style: typ.AppTypography.h4),
                  ValueListenableBuilder<TextEditingValue>(
                    valueListenable: _textController,
                    builder: (context, value, child) => Text(
                      '${value.text.length}/$_maxChars',
                      style: typ.AppTypography.caption,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.sm),
              TextField(
                controller: _textController,
                maxLength: _maxChars,
                maxLines: 6,
                minLines: 4,
                buildCounter: (_,
                        {required currentLength,
                        required isFocused,
                        maxLength}) =>
                    null, // hide built-in counter (we show our own)
                textInputAction: TextInputAction.newline,
                style: typ.AppTypography.body,
                decoration: InputDecoration(
                  hintText:
                      'Share your experience — what did you enjoy most?',
                  hintStyle: typ.AppTypography.body.copyWith(
                    color: AppColors.inkMuted,
                  ),
                  filled: true,
                  fillColor: AppColors.surfaceAlt,
                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(Layout.inputRadius),
                    borderSide: const BorderSide(color: AppColors.hairline),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(Layout.inputRadius),
                    borderSide: const BorderSide(color: AppColors.hairline),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(Layout.inputRadius),
                    borderSide: const BorderSide(
                      color: AppColors.ink,
                      width: 1.5,
                    ),
                  ),
                  contentPadding: const EdgeInsets.all(Spacing.md),
                ),
                onChanged: (_) => setState(() {}),
              ),

              const SizedBox(height: Spacing.xl),

              // ── Blind review info banner ───────────────────────
              Container(
                padding: const EdgeInsets.all(Spacing.md),
                decoration: BoxDecoration(
                  color: AppColors.infoSurface,
                  borderRadius: BorderRadius.circular(Layout.cardRadius),
                  border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      size: 18,
                      color: AppColors.info,
                    ),
                    const SizedBox(width: Spacing.sm),
                    Expanded(
                      child: Text(
                        'Reviews are revealed 14 days after experience completion. '
                        'Neither you nor the creator can see each other\'s responses until then.',
                        style: typ.AppTypography.bodySmall.copyWith(
                          color: AppColors.info,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: Spacing.xxxl),

              // ── Submit button ──────────────────────────────────
              AppButton(
                label: 'Submit Review',
                variant: AppButtonVariant.primary,
                size: AppButtonSize.large,
                fullWidth: true,
                isLoading: isLoading,
                onPressed: _canSubmit && !isLoading ? _submit : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
