import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/app_bottom_sheet.dart';
import '../../../shared/components/button.dart';
import '../../../shared/components/input.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/firebase_storage.dart';
import '../providers/kyc_provider.dart';

/// When true, skip native image_picker calls during E2E and stub the
/// uploaded URL. Enable at run-time with
/// `--dart-define=CH_E2E_STUB_UPLOADS=true`. Defaults to false in all
/// non-E2E builds (debug, profile, release).
const _kE2eStubUploads =
    bool.fromEnvironment('CH_E2E_STUB_UPLOADS', defaultValue: false);

const _kStubPanDocUrl =
    'https://e2e.creatorhub.local/kyc/pan/stub.jpg';
const _kStubAadhaarDocUrl =
    'https://e2e.creatorhub.local/kyc/aadhaar/stub.jpg';
const _kStubSelfieUrl =
    'https://e2e.creatorhub.local/kyc/selfies/stub.jpg';

/// 5-step KYC wizard: PAN → Aadhaar → Bank → Selfie → Review & Submit.
/// Accepts optional [resubmit] flag via route extra.
class KycWizardScreen extends ConsumerStatefulWidget {
  final bool resubmit;

  const KycWizardScreen({super.key, this.resubmit = false});

  @override
  ConsumerState<KycWizardScreen> createState() => _KycWizardScreenState();
}

class _KycWizardScreenState extends ConsumerState<KycWizardScreen> {
  @override
  void initState() {
    super.initState();
    // Reset wizard state on entry
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(kycWizardProvider.notifier).reset();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(kycWizardProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            if (state.step > 1) {
              ref.read(kycWizardProvider.notifier).prevStep();
            } else {
              context.pop();
            }
          },
          child: Icon(PhosphorIcons.arrowLeft(PhosphorIconsStyle.fill), color: AppColors.ink),
        ),
        title: Text(
          widget.resubmit ? 'Resubmit Documents' : 'Identity Verification',
          style: typ.AppTypography.h4,
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Step progress indicator
            _StepProgressIndicator(currentStep: state.step, totalSteps: 5),
            const SizedBox(height: Spacing.xl),

            // Error banner
            if (state.submitError != null)
              _ErrorBanner(
                message: state.submitError!,
                onDismiss: () =>
                    ref.read(kycWizardProvider.notifier).clearError(),
              ),

            // Step content
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: _stepContent(state),
              ),
            ),

            // Next / Submit button
            Padding(
              padding: EdgeInsets.fromLTRB(
                Spacing.xl,
                Spacing.md,
                Spacing.xl,
                Spacing.xl + MediaQuery.of(context).padding.bottom,
              ),
              child: _buildNavButton(state),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stepContent(KycWizardState state) {
    return switch (state.step) {
      1 => _Step1Pan(key: const ValueKey(1)),
      2 => _Step2Aadhaar(key: const ValueKey(2)),
      3 => _Step3Bank(key: const ValueKey(3)),
      4 => _Step4Selfie(key: const ValueKey(4)),
      5 => _Step5Review(key: const ValueKey(5)),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildNavButton(KycWizardState state) {
    if (state.step == 5) {
      return AppButton(
        label: widget.resubmit ? 'Resubmit for Review' : 'Submit for Review',
        fullWidth: true,
        size: AppButtonSize.large,
        isLoading: state.isSubmitting,
        onPressed: state.isSubmitting
            ? null
            : () => _onSubmit(resubmit: widget.resubmit),
      );
    }

    return AppButton(
      label: state.step == 4 ? 'Save & Continue' : 'Next',
      fullWidth: true,
      size: AppButtonSize.large,
      onPressed: state.isCurrentStepValid
          ? () {
              HapticFeedback.lightImpact();
              ref.read(kycWizardProvider.notifier).nextStep();
            }
          : null,
    );
  }

  Future<void> _onSubmit({required bool resubmit}) async {
    unawaited(HapticFeedback.mediumImpact());
    final notifier = ref.read(kycWizardProvider.notifier);
    try {
      if (resubmit) {
        await notifier.resubmit();
      } else {
        await notifier.submit();
      }
      if (mounted) {
        await showAppBottomSheet(
          context: context,
          title: 'Submitted!',
          isDismissible: false,
          showCloseButton: false,
          builder: (_) => _SuccessSheet(onDone: () {
            context.pop(); // pop sheet
            context.pop(); // pop wizard
          }),
        );
      }
    } catch (_) {
      // Error is stored in state.submitError — already shown in banner
    }
  }
}

// ── Step Progress Indicator ───────────────────────────────────────

class _StepProgressIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const _StepProgressIndicator({
    required this.currentStep,
    required this.totalSteps,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      child: Row(
        children: List.generate(totalSteps * 2 - 1, (index) {
          if (index.isOdd) {
            // Connector line
            final stepBefore = (index ~/ 2) + 1;
            final isCompleted = currentStep > stepBefore;
            return Expanded(
              child: Container(
                height: 2,
                color: isCompleted ? AppColors.ink : AppColors.hairline,
              ),
            );
          } else {
            // Step circle
            final step = (index ~/ 2) + 1;
            final isCompleted = currentStep > step;
            final isActive = currentStep == step;
            return _StepCircle(
              step: step,
              isCompleted: isCompleted,
              isActive: isActive,
            );
          }
        }),
      ),
    );
  }
}

class _StepCircle extends StatelessWidget {
  final int step;
  final bool isCompleted;
  final bool isActive;

  const _StepCircle({
    required this.step,
    required this.isCompleted,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    final Color bg;
    final Color fg;

    if (isCompleted || isActive) {
      bg = AppColors.ink;
      fg = AppColors.surface;
    } else {
      bg = AppColors.surfaceAlt;
      fg = AppColors.inkMuted;
    }

    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Center(
        child: isCompleted
            ? Icon(PhosphorIcons.check(PhosphorIconsStyle.fill), size: 14, color: fg)
            : Text(
                '$step',
                style: typ.AppTypography.label.copyWith(color: fg),
              ),
      ),
    );
  }
}

// ── Error Banner ──────────────────────────────────────────────────

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onDismiss;

  const _ErrorBanner({required this.message, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(
        Spacing.xl, 0, Spacing.xl, Spacing.md,
      ),
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: AppColors.dangerSurface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(PhosphorIcons.warning(PhosphorIconsStyle.fill), size: 18, color: AppColors.danger),
          const SizedBox(width: Spacing.sm),
          Expanded(
            child: Text(
              message,
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.danger,
              ),
            ),
          ),
          GestureDetector(
            onTap: onDismiss,
            child: Icon(
              PhosphorIcons.x(PhosphorIconsStyle.fill),
              size: 16,
              color: AppColors.danger,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 1: PAN Card ──────────────────────────────────────────────

class _Step1Pan extends ConsumerStatefulWidget {
  const _Step1Pan({super.key});

  @override
  ConsumerState<_Step1Pan> createState() => _Step1PanState();
}

class _Step1PanState extends ConsumerState<_Step1Pan> {
  final _panController = TextEditingController();
  final _nameController = TextEditingController();
  String? _panError;
  bool _uploading = false;

  static final _panRegex = RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$');

  @override
  void initState() {
    super.initState();
    final state = ref.read(kycWizardProvider);
    _panController.text = state.panNumber ?? '';
    _nameController.text = state.panName ?? '';
  }

  @override
  void dispose() {
    _panController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  void _validatePan(String value) {
    final upper = value.toUpperCase();
    setState(() {
      if (upper.isEmpty) {
        _panError = null;
      } else if (upper.length < 10) {
        _panError = 'PAN must be 10 characters';
      } else if (!_panRegex.hasMatch(upper)) {
        _panError = 'Invalid PAN format (e.g. ABCDE1234F)';
      } else {
        _panError = null;
      }
    });
    ref.read(kycWizardProvider.notifier).setPanNumber(upper);
  }

  Future<void> _pickPanDocument() async {
    unawaited(HapticFeedback.lightImpact());
    if (_kE2eStubUploads) {
      ref.read(kycWizardProvider.notifier).setPanDocUrl(_kStubPanDocUrl);
      return;
    }
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked == null) return;

    setState(() => _uploading = true);
    try {
      final file = File(picked.path);
      final path = 'kyc/pan/${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await uploadFile(file, path);
      ref.read(kycWizardProvider.notifier).setPanDocUrl(url);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Upload failed. Please try again.',
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.surface,
              ),
            ),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(kycWizardProvider);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      children: [
        Text('PAN Card Details', style: typ.AppTypography.h2),
        const SizedBox(height: Spacing.sm),
        Text(
          'Enter your PAN card details exactly as they appear on the card.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.xxl),

        // PAN Number
        AppInput(
          controller: _panController,
          label: 'PAN Number',
          hint: 'ABCDE1234F',
          maxLength: 10,
          keyboardType: TextInputType.text,
          textInputAction: TextInputAction.next,
          errorText: _panError,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
          ],
          onChanged: _validatePan,
        ),
        const SizedBox(height: Spacing.lg),

        // Name on PAN
        AppInput(
          controller: _nameController,
          label: 'Name on PAN Card',
          hint: 'Full name as on card',
          textInputAction: TextInputAction.done,
          onChanged: (v) =>
              ref.read(kycWizardProvider.notifier).setPanName(v),
        ),
        const SizedBox(height: Spacing.xxl),

        // Upload PAN Document
        Text(
          'PAN Document',
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.inkSoft,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        if (state.panDocUrl != null)
          _DocumentPreview(
            url: state.panDocUrl!,
            label: 'PAN document uploaded',
            onReplace: _pickPanDocument,
          )
        else
          _UploadButton(
            label: 'Upload PAN Document',
            icon: PhosphorIcons.identificationCard(PhosphorIconsStyle.fill),
            isLoading: _uploading,
            onTap: _pickPanDocument,
          ),
        const SizedBox(height: Spacing.xl),
      ],
    );
  }
}

// ── Step 2: Aadhaar ───────────────────────────────────────────────

class _Step2Aadhaar extends ConsumerStatefulWidget {
  const _Step2Aadhaar({super.key});

  @override
  ConsumerState<_Step2Aadhaar> createState() => _Step2AadhaarState();
}

class _Step2AadhaarState extends ConsumerState<_Step2Aadhaar> {
  final _aadhaarController = TextEditingController();
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    final state = ref.read(kycWizardProvider);
    _aadhaarController.text = state.aadhaarLast4 ?? '';
  }

  @override
  void dispose() {
    _aadhaarController.dispose();
    super.dispose();
  }

  Future<void> _pickAadhaarDocument() async {
    unawaited(HapticFeedback.lightImpact());
    if (_kE2eStubUploads) {
      ref
          .read(kycWizardProvider.notifier)
          .setAadhaarDocUrl(_kStubAadhaarDocUrl);
      return;
    }
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked == null) return;

    setState(() => _uploading = true);
    try {
      final file = File(picked.path);
      final path = 'kyc/aadhaar/${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await uploadFile(file, path);
      ref.read(kycWizardProvider.notifier).setAadhaarDocUrl(url);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Upload failed. Please try again.',
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.surface,
              ),
            ),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(kycWizardProvider);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      children: [
        Text('Aadhaar Details', style: typ.AppTypography.h2),
        const SizedBox(height: Spacing.sm),
        Text(
          'We only store the last 4 digits of your Aadhaar for privacy.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.xxl),

        // Aadhaar last 4
        AppInput(
          controller: _aadhaarController,
          label: 'Last 4 digits of Aadhaar',
          hint: '1234',
          maxLength: 4,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (v) =>
              ref.read(kycWizardProvider.notifier).setAadhaarLast4(v),
        ),
        const SizedBox(height: Spacing.lg),

        // Privacy note
        Container(
          padding: const EdgeInsets.all(Spacing.md),
          decoration: BoxDecoration(
            color: AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(Layout.cardRadius),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                PhosphorIcons.lockSimple(PhosphorIconsStyle.fill),
                size: 16,
                color: AppColors.inkSoft,
              ),
              SizedBox(width: Spacing.sm),
              Expanded(
                child: Text(
                  'We only store the last 4 digits for privacy. Your full Aadhaar number is never stored.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.inkSoft,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.xxl),

        // Upload Aadhaar Document (optional)
        Text(
          'Aadhaar Document (Optional)',
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.inkSoft,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        if (state.aadhaarDocUrl != null)
          _DocumentPreview(
            url: state.aadhaarDocUrl!,
            label: 'Aadhaar document uploaded',
            onReplace: _pickAadhaarDocument,
          )
        else
          _UploadButton(
            label: 'Upload Aadhaar Document',
            icon: PhosphorIcons.identificationBadge(PhosphorIconsStyle.fill),
            isLoading: _uploading,
            onTap: _pickAadhaarDocument,
          ),
        const SizedBox(height: Spacing.xl),
      ],
    );
  }
}

// ── Step 3: Bank Account ──────────────────────────────────────────

class _Step3Bank extends ConsumerStatefulWidget {
  const _Step3Bank({super.key});

  @override
  ConsumerState<_Step3Bank> createState() => _Step3BankState();
}

class _Step3BankState extends ConsumerState<_Step3Bank> {
  final _accountController = TextEditingController();
  final _ifscController = TextEditingController();
  final _bankNameController = TextEditingController();
  String? _ifscError;

  static final _ifscRegex = RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$');

  @override
  void initState() {
    super.initState();
    final state = ref.read(kycWizardProvider);
    _accountController.text = state.bankAccount ?? '';
    _ifscController.text = state.bankIfsc ?? '';
    _bankNameController.text = state.bankName ?? '';
  }

  @override
  void dispose() {
    _accountController.dispose();
    _ifscController.dispose();
    _bankNameController.dispose();
    super.dispose();
  }

  void _validateIfsc(String value) {
    final upper = value.toUpperCase();
    setState(() {
      if (upper.isEmpty) {
        _ifscError = null;
      } else if (upper.length < 11) {
        _ifscError = 'IFSC code must be 11 characters';
      } else if (!_ifscRegex.hasMatch(upper)) {
        _ifscError = 'Invalid IFSC format (e.g. SBIN0001234)';
      } else {
        _ifscError = null;
      }
    });
    ref.read(kycWizardProvider.notifier).setBankIfsc(upper);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      children: [
        Text('Bank Account', style: typ.AppTypography.h2),
        const SizedBox(height: Spacing.sm),
        Text(
          'Add your bank account to receive payouts from CreatorHub.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.xxl),

        // Account Number
        AppInput(
          controller: _accountController,
          label: 'Account Number',
          hint: 'Your bank account number',
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.next,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (v) =>
              ref.read(kycWizardProvider.notifier).setBankAccount(v),
        ),
        const SizedBox(height: Spacing.lg),

        // IFSC Code
        AppInput(
          controller: _ifscController,
          label: 'IFSC Code',
          hint: 'SBIN0001234',
          maxLength: 11,
          keyboardType: TextInputType.text,
          textInputAction: TextInputAction.next,
          errorText: _ifscError,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
          ],
          onChanged: _validateIfsc,
        ),
        const SizedBox(height: Spacing.lg),

        // Bank Name
        AppInput(
          controller: _bankNameController,
          label: 'Bank Name',
          hint: 'e.g. State Bank of India',
          textInputAction: TextInputAction.done,
          onChanged: (v) =>
              ref.read(kycWizardProvider.notifier).setBankName(v),
        ),
        const SizedBox(height: Spacing.xl),
      ],
    );
  }
}

// ── Step 4: Selfie ────────────────────────────────────────────────

class _Step4Selfie extends ConsumerStatefulWidget {
  const _Step4Selfie({super.key});

  @override
  ConsumerState<_Step4Selfie> createState() => _Step4SelfieState();
}

class _Step4SelfieState extends ConsumerState<_Step4Selfie> {
  bool _uploading = false;

  Future<void> _captureSelfie() async {
    unawaited(HapticFeedback.lightImpact());
    if (_kE2eStubUploads) {
      ref.read(kycWizardProvider.notifier).setSelfieUrl(_kStubSelfieUrl);
      return;
    }
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
      preferredCameraDevice: CameraDevice.front,
    );
    if (picked == null) return;

    setState(() => _uploading = true);
    try {
      final file = File(picked.path);
      final path = 'kyc/selfies/${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await uploadFile(file, path);
      ref.read(kycWizardProvider.notifier).setSelfieUrl(url);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Upload failed. Please try again.',
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.surface,
              ),
            ),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(kycWizardProvider);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      children: [
        Text('Take a Selfie', style: typ.AppTypography.h2),
        const SizedBox(height: Spacing.sm),
        Text(
          'Hold your PAN card next to your face and take a clear photo.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.xxl),

        // Selfie preview or capture button
        if (state.selfieUrl != null)
          _SelfiePreview(
            url: state.selfieUrl!,
            onRetake: _captureSelfie,
          )
        else
          _SelfieCaptureButton(
            isLoading: _uploading,
            onTap: _captureSelfie,
          ),

        const SizedBox(height: Spacing.xxl),

        // Tips
        Text(
          'Tips for a good selfie',
          style: typ.AppTypography.h4,
        ),
        const SizedBox(height: Spacing.md),
        _TipRow(
          icon: PhosphorIcons.sun(PhosphorIconsStyle.fill),
          text: 'Ensure good lighting — avoid backlighting',
        ),
        const SizedBox(height: Spacing.sm),
        _TipRow(
          icon: PhosphorIcons.identificationCard(PhosphorIconsStyle.fill),
          text: 'Hold your PAN card clearly visible next to your face',
        ),
        const SizedBox(height: Spacing.sm),
        _TipRow(
          icon: PhosphorIcons.prohibit(PhosphorIconsStyle.fill),
          text: 'Remove sunglasses and face coverings',
        ),

        const SizedBox(height: Spacing.xl),

        // Privacy note
        Container(
          padding: const EdgeInsets.all(Spacing.md),
          decoration: BoxDecoration(
            color: AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(Layout.cardRadius),
          ),
          child: Text(
            'This is a one-time verification requirement. Your selfie is used only for identity verification.',
            style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
          ),
        ),
        const SizedBox(height: Spacing.xl),
      ],
    );
  }
}

// ── Step 5: Review & Submit ───────────────────────────────────────

class _Step5Review extends ConsumerStatefulWidget {
  const _Step5Review({super.key});

  @override
  ConsumerState<_Step5Review> createState() => _Step5ReviewState();
}

class _Step5ReviewState extends ConsumerState<_Step5Review> {
  bool _confirmed = false;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(kycWizardProvider);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      children: [
        Text('Review & Submit', style: typ.AppTypography.h2),
        const SizedBox(height: Spacing.sm),
        Text(
          'Please review your details before submitting.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.xxl),

        // PAN Section
        _ReviewSection(
          title: 'PAN Card',
          items: [
            _ReviewItem(label: 'PAN Number', value: state.panNumber ?? '—'),
            _ReviewItem(label: 'Name', value: state.panName ?? '—'),
            _ReviewItem(
              label: 'Document',
              value: state.panDocUrl != null ? 'Uploaded' : 'Not uploaded',
              valueColor: state.panDocUrl != null
                  ? AppColors.success
                  : AppColors.danger,
            ),
          ],
        ),
        const SizedBox(height: Spacing.lg),

        // Aadhaar Section
        _ReviewSection(
          title: 'Aadhaar',
          items: [
            _ReviewItem(
              label: 'Last 4 digits',
              value: state.aadhaarLast4 != null
                  ? '•••• ${state.aadhaarLast4}'
                  : '—',
            ),
            _ReviewItem(
              label: 'Document',
              value: state.aadhaarDocUrl != null ? 'Uploaded' : 'Not uploaded',
              valueColor: state.aadhaarDocUrl != null
                  ? AppColors.success
                  : AppColors.inkSoft,
            ),
          ],
        ),
        const SizedBox(height: Spacing.lg),

        // Bank Section
        _ReviewSection(
          title: 'Bank Account',
          items: [
            _ReviewItem(
              label: 'Account Number',
              value: state.bankAccount != null
                  ? '•••• ${state.bankAccount!.length > 4 ? state.bankAccount!.substring(state.bankAccount!.length - 4) : state.bankAccount!}'
                  : '—',
            ),
            _ReviewItem(label: 'IFSC Code', value: state.bankIfsc ?? '—'),
            _ReviewItem(label: 'Bank', value: state.bankName ?? '—'),
          ],
        ),
        const SizedBox(height: Spacing.lg),

        // Selfie Section
        _ReviewSection(
          title: 'Selfie',
          items: [
            _ReviewItem(
              label: 'Photo',
              value: state.selfieUrl != null ? 'Captured' : 'Not captured',
              valueColor: state.selfieUrl != null
                  ? AppColors.success
                  : AppColors.danger,
            ),
          ],
        ),
        const SizedBox(height: Spacing.xxl),

        // Confirmation checkbox
        GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() => _confirmed = !_confirmed);
          },
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: Layout.minTapTarget,
                height: Layout.minTapTarget,
                child: Center(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: _confirmed ? AppColors.ink : Colors.transparent,
                      border: Border.all(
                        color: _confirmed ? AppColors.ink : AppColors.hairline,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: _confirmed
                        ? Icon(
                            PhosphorIcons.check(PhosphorIconsStyle.fill),
                            size: 14,
                            color: AppColors.surface,
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: Spacing.sm),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    'By submitting, I confirm all details are accurate and belong to me.',
                    style: typ.AppTypography.bodySmall.copyWith(
                      color: AppColors.inkSoft,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.xl),
      ],
    );
  }
}

// ── Shared sub-widgets ────────────────────────────────────────────

class _UploadButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isLoading;
  final VoidCallback onTap;

  const _UploadButton({
    required this.label,
    required this.icon,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        height: 80,
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: AppColors.hairline,
          ),
        ),
        child: isLoading
            ? const Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.inkSoft,
                  ),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 22, color: AppColors.inkSoft),
                  const SizedBox(width: Spacing.md),
                  Text(
                    label,
                    style: typ.AppTypography.body.copyWith(
                      color: AppColors.inkSoft,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _DocumentPreview extends StatelessWidget {
  final String url;
  final String label;
  final VoidCallback onReplace;

  const _DocumentPreview({
    required this.url,
    required this.label,
    required this.onReplace,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: AppColors.successSurface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(
            PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
            size: 20,
            color: AppColors.success,
          ),
          const SizedBox(width: Spacing.md),
          Expanded(
            child: Text(
              label,
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.success,
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              onReplace();
            },
            child: Text(
              'Replace',
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.inkSoft,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SelfieCaptureButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onTap;

  const _SelfieCaptureButton({required this.isLoading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        height: 200,
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.hairline),
        ),
        child: isLoading
            ? const Center(
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.inkSoft,
                  ),
                ),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: const BoxDecoration(
                      color: AppColors.hairline,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      PhosphorIcons.camera(PhosphorIconsStyle.fill),
                      size: 28,
                      color: AppColors.inkSoft,
                    ),
                  ),
                  const SizedBox(height: Spacing.md),
                  Text(
                    'Tap to open camera',
                    style: typ.AppTypography.body.copyWith(
                      color: AppColors.inkSoft,
                    ),
                  ),
                  const SizedBox(height: Spacing.xs),
                  Text(
                    'Hold PAN card next to your face',
                    style: typ.AppTypography.bodySmall.copyWith(
                      color: AppColors.inkMuted,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _SelfiePreview extends StatelessWidget {
  final String url;
  final VoidCallback onRetake;

  const _SelfiePreview({required this.url, required this.onRetake});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          height: 200,
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(Layout.cardRadius),
            border: Border.all(
              color: AppColors.success.withValues(alpha: 0.3),
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(Layout.cardRadius - 1),
            child: Image.network(
              url,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return const Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.inkSoft,
                  ),
                );
              },
            ),
          ),
        ),
        Positioned(
          bottom: Spacing.md,
          right: Spacing.md,
          child: GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              onRetake();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.md,
                vertical: Spacing.sm,
              ),
              decoration: BoxDecoration(
                color: AppColors.ink,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    PhosphorIcons.camera(PhosphorIconsStyle.fill),
                    size: 14,
                    color: AppColors.surface,
                  ),
                  SizedBox(width: Spacing.xs),
                  Text(
                    'Retake',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.surface,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _TipRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _TipRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.inkSoft),
        const SizedBox(width: Spacing.sm),
        Expanded(
          child: Text(
            text,
            style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
          ),
        ),
      ],
    );
  }
}

class _ReviewSection extends StatelessWidget {
  final String title;
  final List<_ReviewItem> items;

  const _ReviewSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.lg, Spacing.md, Spacing.lg, Spacing.sm,
            ),
            child: Text(
              title,
              style: typ.AppTypography.h4,
            ),
          ),
          const Divider(color: AppColors.hairline, height: 1),
          ...items,
        ],
      ),
    );
  }
}

class _ReviewItem extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _ReviewItem({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.inkSoft,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: valueColor ?? AppColors.ink,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Success Sheet ─────────────────────────────────────────────────

class _SuccessSheet extends StatelessWidget {
  final VoidCallback onDone;

  const _SuccessSheet({required this.onDone});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              color: AppColors.successSurface,
              shape: BoxShape.circle,
            ),
            child: Icon(
              PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
              size: 36,
              color: AppColors.success,
            ),
          ),
          const SizedBox(height: Spacing.xl),
          Text(
            'Documents Submitted!',
            style: typ.AppTypography.h2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.md),
          Text(
            "Your KYC application is under review. We'll notify you once it's verified — usually within 1–2 business days.",
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.xxl),
          AppButton(
            label: 'Got it',
            fullWidth: true,
            size: AppButtonSize.large,
            onPressed: onDone,
          ),
        ],
      ),
    );
  }
}
