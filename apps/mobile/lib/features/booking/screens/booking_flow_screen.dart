import 'dart:async' show unawaited;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../auth/providers/auth_provider.dart';
import '../../auth/widgets/soft_auth_sheet.dart';
import '../../events/providers/event_detail_provider.dart';
import '../../experiences/providers/experience_provider.dart';
import '../../itineraries/providers/itinerary_detail_provider.dart';
import 'booking_self_paced_screen.dart';
import 'booking_step_date.dart';
import 'booking_step_review.dart';
import 'booking_step_travellers.dart';

/// Router-aware booking shell mounted at `/book/:contentId`.
///
/// Resolves the content type from the API, runs a soft-auth guard for
/// guests, then forks:
///  - **Experience**: 3 steps — Date → Travellers → Review
///  - **Event paid**:  2 steps — Travellers → Review
///  - **Itinerary paid**: handed off to [BookingSelfPacedScreen]
///  - **Event free**: not entered (RSVP path only — guard redirects)
class BookingFlowScreen extends ConsumerStatefulWidget {
  final String contentId;

  const BookingFlowScreen({super.key, required this.contentId});

  @override
  ConsumerState<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends ConsumerState<BookingFlowScreen> {
  bool _authChecked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensureAuth());
  }

  Future<void> _ensureAuth() async {
    if (_authChecked || !mounted) return;
    _authChecked = true;
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated) return;
    final signedIn = await showSoftAuthSheet(
      context,
      ref,
      trigger: SoftAuthTrigger.book,
    );
    if (!mounted) return;
    if (!signedIn) {
      // Bail out cleanly — bring the user back to the prior screen.
      Navigator.of(context).maybePop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final experienceAsync =
        ref.watch(experienceDetailProvider(widget.contentId));

    // First try the experience endpoint; on failure fall back to event,
    // then itinerary. Each is auto-disposed.
    return experienceAsync.when(
      loading: () => const _ShellLoading(),
      data: (detail) {
        // Experience: 3-step flow.
        return _ExperienceFlow(
          contentId: widget.contentId,
          detail: detail,
        );
      },
      error: (_, _) {
        final eventAsync = ref.watch(eventDetailProvider(widget.contentId));
        return eventAsync.when(
          loading: () => const _ShellLoading(),
          data: (event) {
            if (event.isFree) {
              // Free events go through RSVP — bounce.
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!mounted) return;
                Navigator.of(context).maybePop();
              });
              return const _ShellLoading();
            }
            return _EventPaidFlow(
              contentId: widget.contentId,
              event: event,
            );
          },
          error: (_, _) {
            final itineraryAsync =
                ref.watch(itineraryDetailProvider(widget.contentId));
            return itineraryAsync.when(
              loading: () => const _ShellLoading(),
              data: (it) {
                if (it.isFree) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (!mounted) return;
                    Navigator.of(context).maybePop();
                  });
                  return const _ShellLoading();
                }
                return BookingSelfPacedScreen(contentId: widget.contentId);
              },
              error: (e, _) => _ShellError(message: e.toString()),
            );
          },
        );
      },
    );
  }
}

// ── Experience flow (3 steps) ─────────────────────────────────────

class _ExperienceFlow extends ConsumerStatefulWidget {
  final String contentId;
  final ExperienceDetail detail;

  const _ExperienceFlow({required this.contentId, required this.detail});

  @override
  ConsumerState<_ExperienceFlow> createState() => _ExperienceFlowState();
}

class _ExperienceFlowState extends ConsumerState<_ExperienceFlow> {
  final PageController _pageCtrl = PageController();
  int _step = 0; // 0 = date, 1 = travellers, 2 = review
  ScheduledDate? _selectedDate;
  TravellerInfo? _traveller;

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  void _goTo(int step) {
    setState(() => _step = step);
    _pageCtrl.animateToPage(
      step,
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeInOut,
    );
  }

  void _onDateSelected(ScheduledDate date) {
    setState(() => _selectedDate = date);
    _goTo(1);
  }

  void _onTravellerChanged(TravellerInfo info) {
    setState(() => _traveller = info);
  }

  void _onBack() {
    HapticFeedback.lightImpact();
    if (_step == 0) {
      Navigator.of(context).maybePop();
      return;
    }
    _goTo(_step - 1);
  }

  void _onNext() {
    HapticFeedback.lightImpact();
    if (_step == 1) {
      final t = _traveller;
      if (t == null || !t.isValid) return;
      _goTo(2);
      return;
    }
  }

  void _onBookingConfirmed(String bookingId) {
    if (!mounted) return;
    context.go('/bookings/$bookingId/confirmation');
  }

  void _onHoldExpired() {
    setState(() => _selectedDate = null);
    _goTo(0);
  }

  @override
  Widget build(BuildContext context) {
    final detail = widget.detail;
    final basePrice = detail.pricePaisa ?? 0;
    final maxTravellers = (_selectedDate?.spotsLeft ?? 10).clamp(1, 10);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: _BookingAppBar(
        title: 'Confirm booking',
        onBack: _onBack,
      ),
      body: SafeArea(
        child: Column(
          children: [
            _StepIndicator(currentStep: _step, totalSteps: 3),
            Expanded(
              child: PageView(
                controller: _pageCtrl,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  BookingStepDate(
                    contentId: widget.contentId,
                    selectedDateId: _selectedDate?.id,
                    onSelected: _onDateSelected,
                  ),
                  if (_selectedDate != null)
                    BookingStepTravellers(
                      key: ValueKey('travellers-${_selectedDate!.id}'),
                      initialCount: _traveller?.count ?? 1,
                      maxTravellers: maxTravellers,
                      initialName: _traveller?.name,
                      initialPhone: _traveller?.phone,
                      onChanged: _onTravellerChanged,
                    )
                  else
                    const SizedBox.shrink(),
                  if (_selectedDate != null && _traveller != null)
                    BookingStepReview(
                      key: ValueKey(
                          'review-${_selectedDate!.id}-${_traveller!.count}'),
                      contentType: 'experience',
                      contentId: widget.contentId,
                      scheduledDateId: _selectedDate!.id,
                      title: detail.title,
                      creatorName: detail.creator.displayName,
                      coverImageUrl: detail.coverImageUrl,
                      dateLabel: _formatDateLabel(
                        _selectedDate!.startDate,
                        _selectedDate!.endDate,
                      ),
                      basePricePaisa: basePrice,
                      traveller: _traveller!,
                      onBookingConfirmed: _onBookingConfirmed,
                      onHoldExpired: _onHoldExpired,
                    )
                  else
                    const SizedBox.shrink(),
                ],
              ),
            ),
            if (_step == 1)
              _BottomNavBar(
                canAdvance: (_traveller?.isValid ?? false),
                onNext: _onNext,
              ),
          ],
        ),
      ),
    );
  }
}

String _formatDateLabel(String startIso, String endIso) {
  final start = DateTime.tryParse(startIso);
  final end = DateTime.tryParse(endIso);
  if (start == null) return '';
  final fmt = DateFormat('d MMM');
  if (end == null || _sameDay(start, end)) {
    return DateFormat('d MMM y').format(start);
  }
  if (start.year == end.year) {
    return '${fmt.format(start)} – ${DateFormat('d MMM y').format(end)}';
  }
  return '${DateFormat('d MMM y').format(start)} – ${DateFormat('d MMM y').format(end)}';
}

bool _sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

// ── Event paid flow (2 steps) ─────────────────────────────────────

class _EventPaidFlow extends ConsumerStatefulWidget {
  final String contentId;
  final EventDetail event;

  const _EventPaidFlow({required this.contentId, required this.event});

  @override
  ConsumerState<_EventPaidFlow> createState() => _EventPaidFlowState();
}

class _EventPaidFlowState extends ConsumerState<_EventPaidFlow> {
  final PageController _pageCtrl = PageController();
  int _step = 0; // 0 = travellers, 1 = review
  TravellerInfo? _traveller;

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  void _goTo(int step) {
    setState(() => _step = step);
    _pageCtrl.animateToPage(
      step,
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeInOut,
    );
  }

  void _onBack() {
    HapticFeedback.lightImpact();
    if (_step == 0) {
      Navigator.of(context).maybePop();
      return;
    }
    _goTo(_step - 1);
  }

  void _onNext() {
    HapticFeedback.lightImpact();
    final t = _traveller;
    if (t == null || !t.isValid) return;
    if (_step == 0) _goTo(1);
  }

  void _onBookingConfirmed(String bookingId) {
    if (!mounted) return;
    context.go('/bookings/$bookingId/confirmation');
  }

  void _onHoldExpired() {
    if (!mounted) return;
    Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    final event = widget.event;
    // Events use a synthetic price field — server stores price on
    // content, not event_occurrence; we don't have it on EventDetail
    // yet, so default to 0 (UI surfaces "Pay FREE" gracefully — the
    // actual amount comes from the booking-intent + server response).
    final basePrice = 0;
    final spotsLeft = event.capacity == null
        ? 10
        : (event.capacity! - event.spotsBooked).clamp(1, 10);

    final coverUrl = event.mediaUrls.isNotEmpty ? event.mediaUrls.first : null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: _BookingAppBar(
        title: 'Reserve seat',
        onBack: _onBack,
      ),
      body: SafeArea(
        child: Column(
          children: [
            _StepIndicator(currentStep: _step, totalSteps: 2),
            Expanded(
              child: PageView(
                controller: _pageCtrl,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  BookingStepTravellers(
                    initialCount: _traveller?.count ?? 1,
                    maxTravellers: spotsLeft,
                    initialName: _traveller?.name,
                    initialPhone: _traveller?.phone,
                    onChanged: (t) => setState(() => _traveller = t),
                  ),
                  if (_traveller != null)
                    BookingStepReview(
                      key: ValueKey('review-event-${_traveller!.count}'),
                      contentType: 'event',
                      contentId: widget.contentId,
                      eventOccurrenceId: event.id,
                      title: event.title,
                      creatorName: event.creator.displayName,
                      coverImageUrl: coverUrl,
                      dateLabel: event.startAt != null
                          ? DateFormat('d MMM y, h:mm a')
                              .format(event.startAt!.toLocal())
                          : null,
                      basePricePaisa: basePrice,
                      traveller: _traveller!,
                      onBookingConfirmed: _onBookingConfirmed,
                      onHoldExpired: _onHoldExpired,
                    )
                  else
                    const SizedBox.shrink(),
                ],
              ),
            ),
            if (_step == 0)
              _BottomNavBar(
                canAdvance: (_traveller?.isValid ?? false),
                onNext: _onNext,
              ),
          ],
        ),
      ),
    );
  }
}

// ── Shared chrome ─────────────────────────────────────────────────

class _BookingAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback onBack;

  const _BookingAppBar({required this.title, required this.onBack});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.bg,
      elevation: 0,
      title: Text(title, style: typ.AppTypography.h4),
      centerTitle: true,
      leading: IconButton(
        icon: const Icon(PhosphorIconsRegular.arrowLeft, color: AppColors.ink),
        onPressed: onBack,
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const _StepIndicator({
    required this.currentStep,
    required this.totalSteps,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.sm,
      ),
      child: Row(
        children: List.generate(totalSteps, (i) {
          final active = i <= currentStep;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(
                right: i < totalSteps - 1 ? Spacing.xs : 0,
              ),
              height: 3,
              decoration: BoxDecoration(
                color: active ? AppColors.ink : AppColors.hairline,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _BottomNavBar extends StatelessWidget {
  final bool canAdvance;
  final VoidCallback onNext;

  const _BottomNavBar({required this.canAdvance, required this.onNext});

  @override
  Widget build(BuildContext context) {
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
      child: SizedBox(
        height: 52,
        child: ElevatedButton(
          onPressed: canAdvance ? onNext : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.coral,
            disabledBackgroundColor: AppColors.coral.withValues(alpha: 0.4),
            foregroundColor: AppColors.surface,
            disabledForegroundColor: AppColors.surface,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Layout.buttonRadius),
            ),
          ),
          child: Text(
            'Continue',
            style: typ.AppTypography.body.copyWith(
              color: AppColors.surface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Loading / Error views ─────────────────────────────────────────

class _ShellLoading extends StatelessWidget {
  const _ShellLoading();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: const SafeArea(
        child: SkeletonLoader(
          child: Padding(
            padding: EdgeInsets.all(Layout.screenPaddingH),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: Spacing.xl),
                SkeletonLine(width: 160, height: 22),
                SizedBox(height: Spacing.lg),
                SkeletonRect(height: 80, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.md),
                SkeletonRect(height: 80, borderRadius: Layout.cardRadius),
                SizedBox(height: Spacing.md),
                SkeletonRect(height: 80, borderRadius: Layout.cardRadius),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ShellError extends StatelessWidget {
  final String message;

  const _ShellError({required this.message});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(PhosphorIconsRegular.x, color: AppColors.ink),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(Layout.screenPaddingH),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  PhosphorIconsFill.warningCircle,
                  size: 36,
                  color: AppColors.danger,
                ),
                const SizedBox(height: Spacing.md),
                Text(
                  'Could not start booking',
                  style: typ.AppTypography.h4,
                ),
                const SizedBox(height: Spacing.xs),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: typ.AppTypography.bodySmall
                      .copyWith(color: AppColors.inkSoft),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Suppress unused-import warning if the routing pkg isn't used elsewhere.
// ignore: unused_element
void _suppressUnused() => unawaited(Future<void>.value());
