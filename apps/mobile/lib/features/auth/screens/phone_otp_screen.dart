import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:pinput/pinput.dart';

import '../../../shared/components/app_header.dart';
import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../providers/auth_provider.dart';

/// Phone + OTP authentication (S_Phone / S_Otp).
/// SRS: IAM-FR-002 (phone), IAM-FR-003 (send), IAM-FR-004 (verify).
/// Two-step flow: phone → OTP. WhatsApp OTP is rendered disabled (Q4 decision).
class PhoneOtpScreen extends ConsumerStatefulWidget {
  const PhoneOtpScreen({super.key});

  @override
  ConsumerState<PhoneOtpScreen> createState() => _PhoneOtpScreenState();
}

class _PhoneOtpScreenState extends ConsumerState<PhoneOtpScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _phoneFocus = FocusNode();
  final _otpFocus = FocusNode();

  bool _showOtpStep = false;
  bool _isLoading = false;
  String? _verificationId;
  String? _error;

  Timer? _resendTimer;
  int _resendCooldown = 0;
  int _resendCount = 0;
  static const _maxResends = 3;
  static const _cooldownSeconds = 42;

  int _verifyAttempts = 0;
  static const _maxVerifyAttempts = 5;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _phoneFocus.dispose();
    _otpFocus.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  String? _validatePhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 10) return 'Enter a valid 10-digit phone number';
    return null;
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    final err = _validatePhone(phone);
    if (err != null) {
      setState(() => _error = err);
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifier = ref.read(authProvider.notifier);
      final verificationId = await notifier.sendOtp(phone);

      if (verificationId == 'auto') return;

      setState(() {
        _verificationId = verificationId;
        _showOtpStep = true;
        _isLoading = false;
      });
      _startResendTimer();
      _otpFocus.requestFocus();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString().contains('too-many-requests')
            ? 'Too many attempts. Try again in a few minutes.'
            : 'Failed to send OTP. Please try again.';
      });
    }
  }

  Future<void> _verifyOtp(String otp) async {
    if (_verificationId == null) return;
    if (_verifyAttempts >= _maxVerifyAttempts) {
      setState(() {
        _error = 'Too many failed attempts. Please request a new OTP.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifier = ref.read(authProvider.notifier);
      await notifier.verifyOtp(_verificationId!, otp);
    } catch (e) {
      _verifyAttempts++;
      setState(() {
        _isLoading = false;
        _error = _verifyAttempts >= _maxVerifyAttempts
            ? 'Too many failed attempts. Please request a new OTP.'
            : 'Invalid OTP. Please try again.';
        _otpController.clear();
      });
    }
  }

  void _startResendTimer() {
    _resendCooldown = _cooldownSeconds;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _resendCooldown--;
        if (_resendCooldown <= 0) timer.cancel();
      });
    });
  }

  Future<void> _resendOtp() async {
    if (_resendCooldown > 0 || _resendCount >= _maxResends) return;
    _resendCount++;
    _verifyAttempts = 0;
    _otpController.clear();
    await _sendOtp();
  }

  void _goBackToPhone() {
    setState(() {
      _showOtpStep = false;
      _verificationId = null;
      _error = null;
      _verifyAttempts = 0;
      _otpController.clear();
    });
    _resendTimer?.cancel();
    _phoneFocus.requestFocus();
  }

  void _onHeaderBack() {
    if (_showOtpStep) {
      _goBackToPhone();
    } else {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/welcome');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppHeader(
              showBack: true,
              onBack: _onHeaderBack,
              title: _showOtpStep ? 'Verify' : 'Sign in',
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: _showOtpStep ? _OtpStep(parent: this) : _PhoneStep(parent: this),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Phone step ───────────────────────────────────────────────────────

class _PhoneStep extends StatelessWidget {
  final _PhoneOtpScreenState parent;
  const _PhoneStep({required this.parent});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "What's your number?",
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w500,
            height: 1.05,
            letterSpacing: -0.018 * 28,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "We'll text you a 6-digit code. No passwords, ever.",
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w400,
            height: 1.5,
            color: AppColors.inkMuted,
          ),
        ),
        const SizedBox(height: 22),
        _fieldLabel('Mobile number', required: true),
        const SizedBox(height: 6),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _CountryChip(),
            const SizedBox(width: 8),
            Expanded(child: _phoneInput()),
          ],
        ),
        if (parent._error != null && parent._error!.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            parent._error!,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.danger,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        const SizedBox(height: 20),
        AppButton(
          label: 'Send code',
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
          fullWidth: true,
          isLoading: parent._isLoading,
          onPressed: parent._isLoading ? null : parent._sendOtp,
          trailingIcon: Icons.arrow_forward_rounded,
        ),
        const SizedBox(height: 24),
        const _OrDivider(),
        const SizedBox(height: 18),
        _oauthRow(context),
      ],
    );
  }

  Widget _phoneInput() {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairlineStrong),
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: TextField(
        controller: parent._phoneController,
        focusNode: parent._phoneFocus,
        keyboardType: TextInputType.phone,
        maxLength: 10,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.ink,
        ),
        decoration: InputDecoration(
          hintText: '98765 43210',
          hintStyle: GoogleFonts.inter(
            fontSize: 14,
            color: AppColors.inkMuted,
            fontWeight: FontWeight.w500,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          isDense: true,
          counterText: '',
          contentPadding: const EdgeInsets.symmetric(horizontal: 14),
        ),
        onSubmitted: (_) => parent._sendOtp(),
      ),
    );
  }

  Widget _oauthRow(BuildContext context) {
    return Column(
      children: [
        _oauthBtn(
          context,
          icon: Icons.g_mobiledata_rounded,
          label: 'Continue with Google',
          onTap: () async {
            await HapticFeedback.lightImpact();
            final notifier = parent.ref.read(authProvider.notifier);
            try {
              await notifier.signInWithGoogle();
            } catch (_) {}
          },
        ),
        const SizedBox(height: 8),
        _oauthBtn(
          context,
          icon: Icons.apple,
          label: 'Continue with Apple',
          onTap: () async {
            await HapticFeedback.lightImpact();
            final notifier = parent.ref.read(authProvider.notifier);
            try {
              await notifier.signInWithApple();
            } catch (_) {}
          },
        ),
      ],
    );
  }

  Widget _oauthBtn(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton.icon(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Layout.buttonRadius),
          ),
          side: const BorderSide(color: AppColors.hairlineStrong),
          backgroundColor: AppColors.surface,
        ),
        icon: Icon(icon, size: 22, color: AppColors.ink),
        label: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: AppColors.ink,
          ),
        ),
      ),
    );
  }
}

Widget _fieldLabel(String label, {bool required = false}) {
  return Row(
    children: [
      Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.inkSoft,
          letterSpacing: 0.005,
        ),
      ),
      if (required) ...[
        const SizedBox(width: 4),
        Text(
          '*',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.coral,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    ],
  );
}

class _CountryChip extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairlineStrong),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🇮🇳', style: TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Text(
            '+91',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            PhosphorIcons.caretDown(),
            size: 14,
            color: AppColors.inkMuted,
          ),
        ],
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.hairline, height: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(
            'OR',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.inkMuted,
              letterSpacing: 0.05 * 11,
            ),
          ),
        ),
        const Expanded(child: Divider(color: AppColors.hairline, height: 1)),
      ],
    );
  }
}

// ── OTP step ─────────────────────────────────────────────────────────

class _OtpStep extends StatelessWidget {
  final _PhoneOtpScreenState parent;
  const _OtpStep({required this.parent});

  @override
  Widget build(BuildContext context) {
    final phone = parent._phoneController.text.trim();
    final display = phone.isEmpty
        ? '+91'
        : '+91 ${phone.substring(0, phone.length >= 5 ? 5 : phone.length)}'
            '${phone.length > 5 ? ' ${phone.substring(5)}' : ''}';

    final defaultPinTheme = PinTheme(
      width: 48,
      height: 56,
      textStyle: GoogleFonts.jetBrainsMono(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: AppColors.ink,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairlineStrong, width: 1.5),
        borderRadius: BorderRadius.circular(10),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enter the code',
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w500,
            height: 1.05,
            letterSpacing: -0.018 * 28,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Flexible(
              child: Text(
                'Sent to $display · ',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.inkMuted,
                  height: 1.5,
                ),
              ),
            ),
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                parent._goBackToPhone();
              },
              child: Text(
                'Change',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.coral,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        Pinput(
          controller: parent._otpController,
          focusNode: parent._otpFocus,
          length: 6,
          defaultPinTheme: defaultPinTheme,
          focusedPinTheme: defaultPinTheme.copyWith(
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.ink, width: 2),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          submittedPinTheme: defaultPinTheme.copyWith(
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.ink, width: 1.5),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          separatorBuilder: (_) => const SizedBox(width: 8),
          enabled: !parent._isLoading,
          onCompleted: parent._verifyOtp,
          hapticFeedbackType: HapticFeedbackType.lightImpact,
        ),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _resendText(),
            const AppButton(
              label: 'Get code via WhatsApp',
              variant: AppButtonVariant.text,
              size: AppButtonSize.small,
              onPressed: null,
            ),
          ],
        ),
        if (parent._error != null && parent._error!.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            parent._error!,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.danger,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        const SizedBox(height: 24),
        AppButton(
          label: 'Verify',
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
          fullWidth: true,
          isLoading: parent._isLoading,
          onPressed: parent._isLoading
              ? null
              : () => parent._verifyOtp(parent._otpController.text),
        ),
        const SizedBox(height: 18),
        _infoBlock(),
      ],
    );
  }

  Widget _resendText() {
    if (parent._resendCooldown > 0) {
      final mm = (parent._resendCooldown ~/ 60).toString();
      final ss = (parent._resendCooldown % 60).toString().padLeft(2, '0');
      return Text(
        'Resend in $mm:$ss',
        style: GoogleFonts.inter(
          fontSize: 12,
          color: AppColors.inkMuted,
          fontWeight: FontWeight.w500,
        ),
      );
    }
    if (parent._resendCount >= _PhoneOtpScreenState._maxResends) {
      return Text(
        'Max resends reached',
        style: GoogleFonts.inter(
          fontSize: 12,
          color: AppColors.danger,
          fontWeight: FontWeight.w500,
        ),
      );
    }
    return GestureDetector(
      onTap: parent._resendOtp,
      child: Text(
        'Resend code',
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.coral,
        ),
      ),
    );
  }

  Widget _infoBlock() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            PhosphorIcons.info(),
            size: 16,
            color: AppColors.inkMuted,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppColors.inkSoft,
                  height: 1.5,
                ),
                children: [
                  const TextSpan(
                    text: '3 failed attempts locks this number for 15 min. ',
                  ),
                  TextSpan(
                    text: 'Need help?',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.coral,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
