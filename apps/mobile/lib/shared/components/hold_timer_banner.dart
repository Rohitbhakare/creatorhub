import 'dart:async';

import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../theme/colors.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// Coral-tinted banner shown on the booking review step. Counts down to
/// [expiresAt] every second and fires [onExpiry] exactly once when the
/// hold runs out. The countdown is rendered as MM:SS (e.g. "09:42").
///
/// Coral is allowed here under DD-013 #8 (critical/overnight signal).
class HoldTimerBanner extends StatefulWidget {
  final DateTime expiresAt;
  final VoidCallback onExpiry;

  const HoldTimerBanner({
    super.key,
    required this.expiresAt,
    required this.onExpiry,
  });

  @override
  State<HoldTimerBanner> createState() => _HoldTimerBannerState();
}

class _HoldTimerBannerState extends State<HoldTimerBanner> {
  Timer? _timer;
  bool _firedExpiry = false;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _remaining = _calcRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    // Edge case: expiresAt is already in the past on first frame.
    if (_remaining <= Duration.zero) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _fireExpiry());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _timer = null;
    super.dispose();
  }

  Duration _calcRemaining() {
    final diff = widget.expiresAt.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  void _tick() {
    if (!mounted) return;
    final next = _calcRemaining();
    setState(() => _remaining = next);
    if (next <= Duration.zero) _fireExpiry();
  }

  void _fireExpiry() {
    if (_firedExpiry) return;
    _firedExpiry = true;
    _timer?.cancel();
    _timer = null;
    widget.onExpiry();
  }

  String _formatMmSs(Duration d) {
    final mm = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final ss = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    final hh = d.inHours;
    return hh > 0 ? '${hh.toString().padLeft(2, '0')}:$mm:$ss' : '$mm:$ss';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: AppColors.coral.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            PhosphorIcons.timer(),
            size: 16,
            color: AppColors.coral,
          ),
          const SizedBox(width: Spacing.sm),
          Expanded(
            child: Text(
              'Spots reserved · ${_formatMmSs(_remaining)}',
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.coral,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
