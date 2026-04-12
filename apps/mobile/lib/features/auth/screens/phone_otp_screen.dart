import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pinput/pinput.dart';
import '../providers/auth_provider.dart';

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
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),

              // Back button (OTP step only)
              if (_showOtpInput)
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _goBackToPhone();
                  },
                  child: const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: Icon(Icons.arrow_back, size: 24),
                  ),
                ),

              // Title
              Text(
                _showOtpInput ? 'Verify your number' : 'Welcome to CreatorHub',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),

              // Subtitle
              Text(
                _showOtpInput
                    ? 'Enter the 6-digit code sent to +91 ${_phoneController.text}'
                    : 'Enter your phone number to get started',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 32),

              // Phone input OR OTP input
              if (!_showOtpInput) _buildPhoneInput(theme),
              if (_showOtpInput) _buildOtpInput(theme),

              // Error message
              if (_error != null && _error!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    _error!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.error,
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
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneInput(ThemeData theme) {
    return Column(
      children: [
        // Phone input with +91 prefix
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: theme.colorScheme.outline.withValues(alpha: 0.3),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              // Country code
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                decoration: BoxDecoration(
                  border: Border(
                    right: BorderSide(
                      color: theme.colorScheme.outline.withValues(alpha: 0.3),
                    ),
                  ),
                ),
                child: Text(
                  '+91',
                  style: theme.textTheme.bodyLarge?.copyWith(
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
                  style: theme.textTheme.bodyLarge,
                  decoration: const InputDecoration(
                    hintText: 'Phone number',
                    border: InputBorder.none,
                    counterText: '',
                    contentPadding: EdgeInsets.symmetric(horizontal: 16),
                  ),
                  onSubmitted: (_) => _sendOtp(),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Continue button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: _isLoading ? null : _sendOtp,
            style: FilledButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              disabledBackgroundColor:
                  theme.colorScheme.primary.withValues(alpha: 0.4),
            ),
            child: _isLoading
                ? SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: theme.colorScheme.onPrimary,
                    ),
                  )
                : const Text('Continue'),
          ),
        ),
      ],
    );
  }

  Widget _buildOtpInput(ThemeData theme) {
    final defaultPinTheme = PinTheme(
      width: 48,
      height: 56,
      textStyle: theme.textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w600,
      ),
      decoration: BoxDecoration(
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.3),
        ),
        borderRadius: BorderRadius.circular(12),
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
              border: Border.all(color: theme.colorScheme.primary, width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          submittedPinTheme: defaultPinTheme.copyWith(
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.05),
              border: Border.all(color: theme.colorScheme.primary),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          enabled: !_isLoading,
          onCompleted: _verifyOtp,
          hapticFeedbackType: HapticFeedbackType.lightImpact,
        ),
        const SizedBox(height: 24),

        // Resend OTP
        if (_resendCooldown > 0)
          Text(
            'Resend OTP in ${_resendCooldown}s',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          )
        else if (_resendCount < _maxResends)
          TextButton(
            onPressed: _resendOtp,
            child: const Text('Resend OTP'),
          )
        else
          Text(
            'Maximum resend attempts reached',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.error,
            ),
          ),

        // Loading indicator during verification
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.only(top: 16),
            child: SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
      ],
    );
  }
}
