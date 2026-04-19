import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/app_header.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/steps.dart';
import '../../../shared/theme/colors.dart';
import '../providers/onboarding_provider.dart';

/// A2c — Profile bootstrap (new per E0.4c Q1 + founder expansion).
///
/// First onboarding step. Collects the identity essentials after phone signup:
/// username (unique), first name, and optional email (with verify code).
///
/// OAuth signups (Google/Apple) pre-fill firstName + email via
/// `OnboardingNotifier.prefillFromOAuth`. If email arrives from a provider, it
/// is treated as verified (provider-asserted) and the verify row is hidden.
class ProfileBootstrapScreen extends ConsumerStatefulWidget {
  const ProfileBootstrapScreen({super.key});

  @override
  ConsumerState<ProfileBootstrapScreen> createState() =>
      _ProfileBootstrapScreenState();
}

class _ProfileBootstrapScreenState
    extends ConsumerState<ProfileBootstrapScreen> {
  final _usernameCtrl = TextEditingController();
  final _firstNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();

  Timer? _usernameDebounce;
  bool _usernameChecking = false;
  String? _usernameError;
  bool? _usernameAvailable;

  String? _firstNameError;
  String? _emailError;

  static final _usernameRe = RegExp(r'^[a-z0-9_]{3,20}$');
  static final _emailRe = RegExp(r'^[\w.+-]+@[\w-]+\.[\w.-]+$');

  @override
  void initState() {
    super.initState();
    // Hydrate from provider (e.g., OAuth prefill).
    final s = ref.read(onboardingProvider);
    if (s.firstName != null) _firstNameCtrl.text = s.firstName!;
    if (s.email != null) _emailCtrl.text = s.email!;
    if (s.username != null) _usernameCtrl.text = s.username!;
  }

  @override
  void dispose() {
    _usernameDebounce?.cancel();
    _usernameCtrl.dispose();
    _firstNameCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  void _onUsernameChanged(String raw) {
    final v = raw.toLowerCase().trim();
    setState(() {
      _usernameAvailable = null;
      _usernameError = null;
      _usernameChecking = false;
    });

    if (v.isEmpty) return;
    if (!_usernameRe.hasMatch(v)) {
      setState(() {
        _usernameError =
            '3–20 chars, lowercase letters, numbers, underscore only';
      });
      ref.read(onboardingProvider.notifier).setUsername(v, available: false);
      return;
    }

    _usernameDebounce?.cancel();
    setState(() => _usernameChecking = true);
    _usernameDebounce = Timer(const Duration(milliseconds: 300), () async {
      // TODO(e0.4c-followup): wire GET /api/v1/users/check-username?value=v.
      // For now, client-side only: assume available if charset+length pass.
      await Future<void>.delayed(const Duration(milliseconds: 100));
      if (!mounted) return;
      setState(() {
        _usernameChecking = false;
        _usernameAvailable = true;
      });
      ref.read(onboardingProvider.notifier).setUsername(v, available: true);
    });
  }

  void _onFirstNameChanged(String value) {
    final v = value.trim();
    setState(() {
      _firstNameError =
          v.isEmpty ? 'First name is required' : (v.length > 40 ? 'Too long' : null);
    });
    ref.read(onboardingProvider.notifier).setFirstName(v);
  }

  void _onEmailChanged(String value) {
    final v = value.trim();
    if (v.isEmpty) {
      setState(() => _emailError = null);
      ref.read(onboardingProvider.notifier).setEmail(null);
      return;
    }
    final ok = _emailRe.hasMatch(v);
    setState(() => _emailError = ok ? null : 'Enter a valid email');
    ref.read(onboardingProvider.notifier).setEmail(ok ? v : null);
  }

  Future<void> _openEmailVerifySheet() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || _emailError != null) return;

    await HapticFeedback.lightImpact();
    if (!mounted) return;
    final verified = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _EmailVerifySheet(email: email),
    );

    if (verified == true && mounted) {
      ref.read(onboardingProvider.notifier).markEmailVerified();
    }
  }

  void _onContinue() {
    // Force validation
    _onUsernameChanged(_usernameCtrl.text);
    _onFirstNameChanged(_firstNameCtrl.text);
    _onEmailChanged(_emailCtrl.text);

    final s = ref.read(onboardingProvider);
    if (!s.canAdvance) return;
    // Email is optional: if provided, require verified.
    if (_emailCtrl.text.trim().isNotEmpty && !s.emailVerified) return;

    HapticFeedback.lightImpact();
    ref.read(onboardingProvider.notifier).advanceStep();
    context.go('/onboarding/location');
  }

  bool get _canContinue {
    final s = ref.watch(onboardingProvider);
    final emailTouched = _emailCtrl.text.trim().isNotEmpty;
    final emailOk = !emailTouched || (_emailError == null && s.emailVerified);
    return s.canAdvance && emailOk && !_usernameChecking;
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(onboardingProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Column(
          children: [
            const AppHeader(showBack: false, title: ''),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: StepsBar(current: 1, total: 5),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _stepEyebrow('Step 1 of 5'),
                    const SizedBox(height: 8),
                    Text(
                      'Tell us about you',
                      style: GoogleFonts.fraunces(
                        fontSize: 30,
                        fontWeight: FontWeight.w500,
                        height: 1.0,
                        letterSpacing: -0.018 * 30,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Pick a handle, a name your friends would use, and '
                      'an email for receipts (optional).',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.inkMuted,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 22),
                    _usernameField(),
                    const SizedBox(height: 18),
                    _textField(
                      label: 'First name',
                      required: true,
                      controller: _firstNameCtrl,
                      hint: 'Aarav',
                      error: _firstNameError,
                      onChanged: _onFirstNameChanged,
                    ),
                    const SizedBox(height: 18),
                    _emailFieldWithVerify(s),
                    const SizedBox(height: 28),
                  ],
                ),
              ),
            ),
            _footerBar(),
          ],
        ),
      ),
    );
  }

  Widget _footerBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.hairline)),
      ),
      child: AppButton(
        label: 'Continue',
        variant: AppButtonVariant.primary,
        size: AppButtonSize.large,
        fullWidth: true,
        trailingIcon: Icons.arrow_forward_rounded,
        onPressed: _canContinue ? _onContinue : null,
      ),
    );
  }

  Widget _stepEyebrow(String text) {
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.jetBrainsMono(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: AppColors.inkMuted,
        letterSpacing: 0.12 * 10,
      ),
    );
  }

  Widget _usernameField() {
    final suffix = _usernameChecking
        ? const _Spinner()
        : (_usernameAvailable == true
            ? Icon(PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
                size: 18, color: AppColors.success)
            : null);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel('Username', required: true),
        const SizedBox(height: 6),
        _input(
          controller: _usernameCtrl,
          hint: 'aarav_k',
          prefix: '@',
          suffix: suffix,
          onChanged: _onUsernameChanged,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9_]')),
            LengthLimitingTextInputFormatter(20),
          ],
          keyboardType: TextInputType.text,
          hasError: _usernameError != null,
        ),
        if (_usernameError != null) ...[
          const SizedBox(height: 6),
          Text(
            _usernameError!,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.danger,
              fontWeight: FontWeight.w500,
            ),
          ),
        ] else if (_usernameAvailable == true) ...[
          const SizedBox(height: 6),
          Text(
            '@${_usernameCtrl.text} is available',
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.success,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }

  Widget _textField({
    required String label,
    required bool required,
    required TextEditingController controller,
    required String hint,
    required ValueChanged<String> onChanged,
    String? error,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label, required: required),
        const SizedBox(height: 6),
        _input(
          controller: controller,
          hint: hint,
          onChanged: onChanged,
          hasError: error != null,
        ),
        if (error != null) ...[
          const SizedBox(height: 6),
          Text(
            error,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.danger,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }

  Widget _emailFieldWithVerify(OnboardingState s) {
    final verified = s.emailVerified;
    final hasEmail = _emailCtrl.text.trim().isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel('Email', required: false, suffix: '(optional)'),
        const SizedBox(height: 6),
        _input(
          controller: _emailCtrl,
          hint: 'you@domain.com',
          onChanged: _onEmailChanged,
          hasError: _emailError != null,
          keyboardType: TextInputType.emailAddress,
          suffix: verified && hasEmail
              ? Icon(
                  PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
                  size: 18,
                  color: AppColors.success,
                )
              : null,
        ),
        if (_emailError != null) ...[
          const SizedBox(height: 6),
          Text(
            _emailError!,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.danger,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        if (hasEmail && _emailError == null && !verified) ...[
          const SizedBox(height: 8),
          AppButton(
            label: 'Send verification code',
            variant: AppButtonVariant.outline,
            size: AppButtonSize.medium,
            onPressed: _openEmailVerifySheet,
          ),
        ],
        if (hasEmail && verified) ...[
          const SizedBox(height: 6),
          Text(
            'Email verified',
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.success,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }

  Widget _input({
    required TextEditingController controller,
    required String hint,
    required ValueChanged<String> onChanged,
    bool hasError = false,
    String? prefix,
    Widget? suffix,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(
          color: hasError ? AppColors.danger : AppColors.hairlineStrong,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          if (prefix != null) ...[
            const SizedBox(width: 14),
            Text(
              prefix,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.inkMuted,
              ),
            ),
          ],
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              keyboardType: keyboardType,
              inputFormatters: inputFormatters,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.ink,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.inkMuted,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isDense: true,
                counterText: '',
                contentPadding:
                    EdgeInsets.symmetric(horizontal: prefix == null ? 14 : 6),
              ),
            ),
          ),
          if (suffix != null) Padding(
            padding: const EdgeInsets.only(right: 12),
            child: suffix,
          ),
        ],
      ),
    );
  }

  Widget _fieldLabel(String label, {required bool required, String? suffix}) {
    return Row(
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.inkSoft,
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
        if (suffix != null) ...[
          const SizedBox(width: 6),
          Text(
            suffix,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w400,
              color: AppColors.inkMuted,
            ),
          ),
        ],
      ],
    );
  }
}

class _Spinner extends StatelessWidget {
  const _Spinner();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 16,
      height: 16,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: AppColors.inkMuted,
      ),
    );
  }
}

// ── Email verify sheet ───────────────────────────────────────────────

class _EmailVerifySheet extends StatefulWidget {
  final String email;
  const _EmailVerifySheet({required this.email});

  @override
  State<_EmailVerifySheet> createState() => _EmailVerifySheetState();
}

class _EmailVerifySheetState extends State<_EmailVerifySheet> {
  final _codeCtrl = TextEditingController();
  String? _error;
  bool _submitting = false;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final code = _codeCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Enter the 6-digit code');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    // TODO(e0.4c-followup): wire POST /api/v1/users/email/send-code +
    // POST /api/v1/users/email/verify-code. For now, client-side mock:
    // treat any 6-digit code as valid to unblock the UI flow.
    await Future<void>.delayed(const Duration(milliseconds: 250));
    if (!mounted) return;
    setState(() => _submitting = false);
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.hairlineStrong,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Verify your email',
              style: GoogleFonts.fraunces(
                fontSize: 22,
                fontWeight: FontWeight.w500,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'We sent a 6-digit code to ${widget.email}.',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.inkMuted,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 18),
            Container(
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.hairlineStrong),
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              child: TextField(
                controller: _codeCtrl,
                keyboardType: TextInputType.number,
                maxLength: 6,
                autofocus: true,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                  letterSpacing: 6,
                ),
                decoration: const InputDecoration(
                  hintText: '••••••',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  counterText: '',
                  isDense: true,
                ),
                onSubmitted: (_) => _verify(),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _error!,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppColors.danger,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
            const SizedBox(height: 16),
            AppButton(
              label: 'Verify',
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              fullWidth: true,
              isLoading: _submitting,
              onPressed: _submitting ? null : _verify,
            ),
            const SizedBox(height: 8),
            Center(
              child: AppButton(
                label: 'Cancel',
                variant: AppButtonVariant.text,
                size: AppButtonSize.medium,
                onPressed: () => Navigator.of(context).pop(false),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
