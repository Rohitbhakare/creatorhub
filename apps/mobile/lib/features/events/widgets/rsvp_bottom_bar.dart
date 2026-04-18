import 'dart:async' show unawaited;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/dio_errors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/event_detail_provider.dart';

/// Fixed bottom bar on the event detail screen.
///
/// Shows:
/// - "RSVP" button if user hasn't RSVP'd and event has capacity
/// - "Cancel RSVP" button if user has already RSVP'd
/// - Disabled "Event Full" button if at capacity
/// - Hidden if event is in the past or user is the creator
class RsvpBottomBar extends ConsumerStatefulWidget {
  final EventDetail event;
  final VoidCallback onRsvpChanged;

  const RsvpBottomBar({
    super.key,
    required this.event,
    required this.onRsvpChanged,
  });

  @override
  ConsumerState<RsvpBottomBar> createState() => _RsvpBottomBarState();
}

class _RsvpBottomBarState extends ConsumerState<RsvpBottomBar> {
  bool _isLoading = false;

  Future<void> _rsvp() async {
    unawaited(HapticFeedback.lightImpact());
    setState(() => _isLoading = true);

    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.post('/api/v1/events/${widget.event.id}/rsvp');
      widget.onRsvpChanged();
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = extractDioErrorMessage(e) ?? 'Failed to RSVP. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            msg,
            style: typ.AppTypography.bodySmall
                .copyWith(color: AppColors.surface),
          ),
          backgroundColor: AppColors.danger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _cancelRsvp() async {
    unawaited(HapticFeedback.lightImpact());
    // Confirm before cancelling
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bg,
        title: Text('Cancel RSVP?', style: typ.AppTypography.h3),
        content: Text(
          'You will lose your spot at this event.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Keep RSVP',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Cancel RSVP',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.danger,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isLoading = true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.delete('/api/v1/events/${widget.event.id}/rsvp');
      widget.onRsvpChanged();
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = extractDioErrorMessage(e) ?? 'Failed to cancel RSVP.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: AppColors.danger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final event = widget.event;
    final authState = ref.watch(authProvider);

    // Hide bar if event is past or user is the creator
    if (!event.isFuture) return const SizedBox.shrink();
    if (authState.isAuthenticated) {
      final userId = authState.user?['id'] as String?;
      if (userId == event.creator.id) return const SizedBox.shrink();
    }

    return Container(
      padding: EdgeInsets.fromLTRB(
        Layout.screenPaddingH,
        Spacing.md,
        Layout.screenPaddingH,
        Spacing.md + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.hairline)),
      ),
      child: Row(
        children: [
          // Capacity summary on the left
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  event.isFree ? 'FREE' : 'Paid',
                  style: typ.AppTypography.body.copyWith(
                    fontWeight: FontWeight.w700,
                    color: event.isFree ? AppColors.success : AppColors.ink,
                  ),
                ),
                Text(
                  event.capacityLabel,
                  style: typ.AppTypography.caption.copyWith(
                    color: AppColors.inkSoft,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.md),

          // Action button
          if (event.hasRsvpd)
            AppButton(
              label: 'Cancel RSVP',
              onPressed: _isLoading ? null : _cancelRsvp,
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.large,
              isLoading: _isLoading,
              leadingIcon: PhosphorIconsFill.calendarX,
            )
          else if (!event.hasSpots)
            const AppButton(
              label: 'Event Full',
              onPressed: null,
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
            )
          else if (!authState.isAuthenticated)
            AppButton(
              label: 'Sign in to RSVP',
              onPressed: () {
                HapticFeedback.lightImpact();
                // TODO: trigger soft auth wall
              },
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
            )
          else
            AppButton(
              label: 'RSVP',
              onPressed: _isLoading ? null : _rsvp,
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              isLoading: _isLoading,
              leadingIcon: PhosphorIconsFill.calendarCheck,
            ),
        ],
      ),
    );
  }
}
