import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pinput/pinput.dart';
import '../providers/auth_provider.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';

/// Phone OTP authentication screen.
/// Two-step flow: phone input → OTP verification.
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

  bool _showOtpInput = false;
  bool _isLoading = false;
  String? _verificationId;
  String? _error;

  // Resend timer
  Timer? _resendTimer;
  int _resendCooldown = 0;
  int _resendCount = 0;
  static const _maxResends = 3;
  static const _cooldownSeconds = 30;

  // OTP attempt tracking
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
    final error = _validatePhone(phone);
    if (error != null) {
      setState(() => _error = error);
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifier = ref.read(authProvider.notifier);
      final verificationId = await notifier.sendOtp(phone);

      if (verificationId == 'auto') {
        // Auto-verification completed (Android) — auth state will update
        return;
      }

      setState(() {
        _verificationId = verificationId;
        _showOtpInput = true;
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
        _error =
            'Too many failed attempts. Please request a new OTP.';
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
      // Success — auth state will navigate away
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
        if (_resendCooldown <= 0) {
          timer.cancel();
        }
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
      _showOtpInput = false;
      _verificationId = null;
      _error = null;
      _verifyAttempts = 0;
      _otpController.clear();
    });
    _resendTimer?.cancel();
    _phoneFocus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Layout.screenPaddingH + Spacing.sm,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Spacing.xxxl),

              // Back button (OTP step only)
              if (_showOtpInput)
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _goBackToPhone();
                  },
                  child: const Padding(
                    padding: EdgeInsets.only(bottom: Spacing.lg),
                    child: Icon(
                      Icons.arrow_back,
                      size: 24,
                      color: AppColors.ink,
                    ),
                  ),
                ),

              // Title
              Text(
                _showOtpInput ? 'Verify your number' : 'Welcome to CreatorHub',
                style: typ.AppTypography.h3,
              ),
              const SizedBox(height: Spacing.sm),

              // Subtitle
              Text(
                _showOtpInput
                    ? 'Enter the 6-digit code sent to +91 ${_phoneController.text}'
                    : 'Enter your phone number to get started',
                style: typ.AppTypography.bodyLarge.copyWith(
                  color: AppColors.inkSoft,
                ),
              ),
              const SizedBox(height: Spacing.xxl),

              // Phone input OR OTP input
              if (!_showOtpInput) _buildPhoneInput(),
              if (_showOtpInput) _buildOtpInput(),

              // Error message
              if (_error != null && _error!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.md),
                  child: Text(
                    _error!,
                    style: typ.AppTypography.bodySmall.copyWith(
                      color: AppColors.danger,
                    ),
                  ),
                ),

              const Spacer(),

              // Guest mode
              if (!_showOtpInput)
                Center(
                  child: TextButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      ref.read(authProvider.notifier).enterGuestMode();
                    },
                    child: Text(
                      'Browse as guest',
                      style: typ.AppTypography.body.copyWith(
                        color: AppColors.inkMuted,
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: Spacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneInput() {
    return Column(
      children: [
        // Phone input with +91 prefix
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.hairline),
            borderRadius: BorderRadius.circular(Layout.inputRadius),
          ),
          child: Row(
            children: [
              // Country code
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Spacing.lg,
                  vertical: Spacing.lg,
                ),
                decoration: const BoxDecoration(
                  border: Border(
                    right: BorderSide(color: AppColors.hairline),
                  ),
                ),
                child: Text(
                  '+91',
                  style: typ.AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              // Phone number
              Expanded(
                child: TextField(
                  controller: _phoneController,
                  focusNode: _phoneFocus,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: typ.AppTypography.bodyLarge,
                  decoration: InputDecoration(
                    hintText: 'Phone number',
                    hintStyle: typ.AppTypography.bodyLarge.copyWith(
                      color: AppColors.inkMuted,
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    counterText: '',
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Spacing.lg,
                    ),
                  ),
                  onSubmitted: (_) => _sendOtp(),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.mlg),

        // Continue button
        AppButton(
          label: 'Continue',
          onPressed: _isLoading ? null : _sendOtp,
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
          isLoading: _isLoading,
          fullWidth: true,
        ),
      ],
    );
  }

  Widget _buildOtpInput() {
    final defaultPinTheme = PinTheme(
      width: 48,
      height: 56,
      textStyle: typ.AppTypography.h4.copyWith(
        fontWeight: FontWeight.w600,
      ),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(Layout.inputRadius),
      ),
    );

    return Column(
      children: [
        // 6-digit OTP input
        Pinput(
          controller: _otpController,
          focusNode: _otpFocus,
          length: 6,
          defaultPinTheme: defaultPinTheme,
          focusedPinTheme: defaultPinTheme.copyWith(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.coral, width: 2),
              borderRadius: BorderRadius.circular(Layout.inputRadius),
            ),
          ),
          submittedPinTheme: defaultPinTheme.copyWith(
            decoration: BoxDecoration(
              color: AppColors.coralSurface,
              border: Border.all(color: AppColors.coral),
              borderRadius: BorderRadius.circular(Layout.inputRadius),
            ),
          ),
          enabled: !_isLoading,
          onCompleted: _verifyOtp,
          hapticFeedbackType: HapticFeedbackType.lightImpact,
        ),
        const SizedBox(height: Spacing.xl),

        // Resend OTP
        if (_resendCooldown > 0)
          Text(
            'Resend OTP in ${_resendCooldown}s',
            style: typ.AppTypography.bodySmall.copyWith(
              color: AppColors.inkMuted,
            ),
          )
        else if (_resendCount < _maxResends)
          TextButton(
            onPressed: _resendOtp,
            child: Text(
              'Resend OTP',
              style: typ.AppTypography.body.copyWith(
                color: AppColors.coral,
              ),
            ),
          )
        else
          Text(
            'Maximum resend attempts reached',
            style: typ.AppTypography.bodySmall.copyWith(
              color: AppColors.danger,
            ),
          ),

        // Loading indicator during verification
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.only(top: Spacing.lg),
            child: SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.coral,
              ),
            ),
          ),
      ],
    );
  }
}
