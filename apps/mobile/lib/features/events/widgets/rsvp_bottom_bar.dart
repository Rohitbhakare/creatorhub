import 'dart:async' show unawaited;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/dio_errors.dart';
import '../../../shared/utils/toast.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/widgets/soft_auth_sheet.dart';
import '../../booking/providers/waitlist_provider.dart';
import '../providers/event_detail_provider.dart';

/// Fixed bottom bar on the event detail screen.
///
/// Free events:
///   - "RSVP" (or "Cancel RSVP" if already RSVP'd)
///   - "Event Full" if at capacity
///
/// Paid events:
///   - "Reserve seat" pushes /book/:eventId
///   - "Join waitlist" if at capacity
///   - "Cancel booking" path is on the booking detail screen, not here
///
/// Hidden if event is in the past or user is the creator.
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

  Future<void> _onReserveSeat() async {
    unawaited(HapticFeedback.lightImpact());
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      final signedIn = await showSoftAuthSheet(
        context,
        ref,
        trigger: SoftAuthTrigger.book,
      );
      if (!signedIn || !mounted) return;
    }
    if (!mounted) return;
    context.push('/book/${widget.event.id}');
  }

  Future<void> _onJoinWaitlist() async {
    unawaited(HapticFeedback.lightImpact());
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      final signedIn = await showSoftAuthSheet(
        context,
        ref,
        trigger: SoftAuthTrigger.book,
      );
      if (!signedIn || !mounted) return;
    }
    final ok = await ref.read(waitlistActionProvider.notifier).joinWaitlist(
      contentId: widget.event.id,
      eventOccurrenceId: widget.event.id,
    );
    if (!mounted) return;
    if (ok) {
      showAppToast(context, "We'll notify you if a spot opens up.");
    } else {
      final err = ref.read(waitlistActionProvider).error ??
          'Could not join waitlist';
      showAppToast(context, err);
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

    final spotsLeft = event.capacity == null
        ? null
        : (event.capacity! - event.spotsBooked).clamp(0, event.capacity!);

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
          // Capacity / price summary on the left
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
                  spotsLeft != null
                      ? '$spotsLeft spots left'
                      : event.capacityLabel,
                  style: typ.AppTypography.caption.copyWith(
                    color: AppColors.inkSoft,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.md),

          // Action button
          _buildActionButton(event, authState, spotsLeft),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    EventDetail event,
    AuthState authState,
    int? spotsLeft,
  ) {
    // Free flow — RSVP / Cancel / Full
    if (event.isFree) {
      if (event.hasRsvpd) {
        return AppButton(
          label: 'Cancel RSVP',
          onPressed: _isLoading ? null : _cancelRsvp,
          variant: AppButtonVariant.secondary,
          size: AppButtonSize.large,
          isLoading: _isLoading,
          leadingIcon: PhosphorIconsFill.calendarX,
        );
      }
      if (!event.hasSpots) {
        return const AppButton(
          label: 'Event Full',
          onPressed: null,
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
        );
      }
      if (!authState.isAuthenticated) {
        return AppButton(
          label: 'Sign in to RSVP',
          onPressed: () async {
            HapticFeedback.lightImpact();
            await showSoftAuthSheet(context, ref, trigger: SoftAuthTrigger.book);
          },
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
        );
      }
      return AppButton(
        label: 'RSVP',
        onPressed: _isLoading ? null : _rsvp,
        variant: AppButtonVariant.primary,
        size: AppButtonSize.large,
        isLoading: _isLoading,
        leadingIcon: PhosphorIconsFill.calendarCheck,
      );
    }

    // Paid flow — Reserve seat or Join waitlist (DD-013 #4: booking primary CTA)
    final soldOut = !event.hasSpots;
    return AppButton(
      label: soldOut ? 'Join waitlist' : 'Reserve seat',
      onPressed: _isLoading
          ? null
          : (soldOut ? _onJoinWaitlist : _onReserveSeat),
      variant: AppButtonVariant.primary,
      size: AppButtonSize.large,
      isLoading: _isLoading,
      leadingIcon: soldOut
          ? PhosphorIconsFill.bellRinging
          : PhosphorIconsFill.ticket,
    );
  }
}
