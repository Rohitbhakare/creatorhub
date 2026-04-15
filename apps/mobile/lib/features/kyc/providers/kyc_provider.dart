import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Data Classes ──────────────────────────────────────────────────

class KycStatusInfo {
  final String status; // 'none' | 'pending' | 'verified' | 'rejected'
  final String? rejectionReason;
  final DateTime? submittedAt;
  final DateTime? reviewedAt;

  const KycStatusInfo({
    required this.status,
    this.rejectionReason,
    this.submittedAt,
    this.reviewedAt,
  });

  factory KycStatusInfo.fromJson(Map<String, dynamic> json) {
    return KycStatusInfo(
      status: json['status'] as String? ?? 'none',
      rejectionReason: json['rejection_reason'] as String?,
      submittedAt: json['submitted_at'] != null
          ? DateTime.tryParse(json['submitted_at'] as String)
          : null,
      reviewedAt: json['reviewed_at'] != null
          ? DateTime.tryParse(json['reviewed_at'] as String)
          : null,
    );
  }
}

// ── Status Provider ───────────────────────────────────────────────

/// FutureProvider.autoDispose — fetches KYC status from GET /kyc/status
final kycStatusProvider =
    FutureProvider.autoDispose<KycStatusInfo>((ref) async {
  final dio = ref.read(authServiceProvider).dio;

  try {
    final response = await dio.get('/api/v1/kyc/status');
    final data =
        (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return KycStatusInfo.fromJson(data);
  } on DioException catch (e) {
    final responseData = e.response?.data;
    final errorMsg = (responseData is Map)
        ? ((responseData['error'] as Map?)?['message'] as String?)
        : null;
    throw Exception(errorMsg ?? 'Failed to load KYC status');
  }
});

// ── Wizard State ──────────────────────────────────────────────────

class KycWizardState {
  final int step; // 1–5
  final String? panNumber;
  final String? panName;
  final String? aadhaarLast4;
  final String? bankAccount;
  final String? bankIfsc;
  final String? bankName;
  final String? selfieUrl;
  final String? panDocUrl;
  final String? aadhaarDocUrl;
  final bool isSubmitting;
  final String? submitError;

  const KycWizardState({
    this.step = 1,
    this.panNumber,
    this.panName,
    this.aadhaarLast4,
    this.bankAccount,
    this.bankIfsc,
    this.bankName,
    this.selfieUrl,
    this.panDocUrl,
    this.aadhaarDocUrl,
    this.isSubmitting = false,
    this.submitError,
  });

  KycWizardState copyWith({
    int? step,
    String? panNumber,
    String? panName,
    String? aadhaarLast4,
    String? bankAccount,
    String? bankIfsc,
    String? bankName,
    String? selfieUrl,
    String? panDocUrl,
    String? aadhaarDocUrl,
    bool? isSubmitting,
    String? submitError,
  }) {
    return KycWizardState(
      step: step ?? this.step,
      panNumber: panNumber ?? this.panNumber,
      panName: panName ?? this.panName,
      aadhaarLast4: aadhaarLast4 ?? this.aadhaarLast4,
      bankAccount: bankAccount ?? this.bankAccount,
      bankIfsc: bankIfsc ?? this.bankIfsc,
      bankName: bankName ?? this.bankName,
      selfieUrl: selfieUrl ?? this.selfieUrl,
      panDocUrl: panDocUrl ?? this.panDocUrl,
      aadhaarDocUrl: aadhaarDocUrl ?? this.aadhaarDocUrl,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submitError: submitError,
    );
  }

  /// Build the API payload for POST /kyc/submit or /kyc/resubmit
  Map<String, dynamic> toApiPayload() {
    return {
      if (panNumber != null) 'pan_number': panNumber,
      if (panName != null) 'pan_name': panName,
      if (aadhaarLast4 != null) 'aadhaar_last4': aadhaarLast4,
      if (bankAccount != null) 'bank_account': bankAccount,
      if (bankIfsc != null) 'bank_ifsc': bankIfsc,
      if (bankName != null) 'bank_name': bankName,
      if (selfieUrl != null) 'selfie_url': selfieUrl,
      if (panDocUrl != null) 'pan_doc_url': panDocUrl,
      if (aadhaarDocUrl != null) 'aadhaar_doc_url': aadhaarDocUrl,
    };
  }

  /// Whether all required fields for the current step are filled
  bool get isCurrentStepValid {
    switch (step) {
      case 1:
        final pan = panNumber?.trim() ?? '';
        final name = panName?.trim() ?? '';
        final panValid =
            RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$').hasMatch(pan);
        return panValid && name.isNotEmpty && panDocUrl != null;
      case 2:
        final aadhaar = aadhaarLast4?.trim() ?? '';
        return aadhaar.length == 4 && RegExp(r'^\d{4}$').hasMatch(aadhaar);
      case 3:
        final account = bankAccount?.trim() ?? '';
        final ifsc = bankIfsc?.trim() ?? '';
        final bname = bankName?.trim() ?? '';
        final ifscValid =
            RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(ifsc);
        return account.isNotEmpty && ifscValid && bname.isNotEmpty;
      case 4:
        return selfieUrl != null;
      case 5:
        return true;
      default:
        return false;
    }
  }
}

// ── Notifier ──────────────────────────────────────────────────────

class KycWizardNotifier extends Notifier<KycWizardState> {
  @override
  KycWizardState build() => const KycWizardState();

  // ── Step Navigation ───────────────────────────────────────────

  void nextStep() {
    if (state.step < 5) {
      state = state.copyWith(step: state.step + 1);
    }
  }

  void prevStep() {
    if (state.step > 1) {
      state = state.copyWith(step: state.step - 1);
    }
  }

  void goToStep(int step) {
    assert(step >= 1 && step <= 5);
    state = state.copyWith(step: step);
  }

  // ── Field Setters ─────────────────────────────────────────────

  void setPanNumber(String value) =>
      state = state.copyWith(panNumber: value.toUpperCase(), submitError: null);

  void setPanName(String value) =>
      state = state.copyWith(panName: value, submitError: null);

  void setAadhaarLast4(String value) =>
      state = state.copyWith(aadhaarLast4: value, submitError: null);

  void setBankAccount(String value) =>
      state = state.copyWith(bankAccount: value, submitError: null);

  void setBankIfsc(String value) =>
      state = state.copyWith(bankIfsc: value.toUpperCase(), submitError: null);

  void setBankName(String value) =>
      state = state.copyWith(bankName: value, submitError: null);

  void setSelfieUrl(String url) =>
      state = state.copyWith(selfieUrl: url, submitError: null);

  void setPanDocUrl(String url) =>
      state = state.copyWith(panDocUrl: url, submitError: null);

  void setAadhaarDocUrl(String url) =>
      state = state.copyWith(aadhaarDocUrl: url, submitError: null);

  void clearError() => state = state.copyWith(submitError: null);

  // ── Submit / Resubmit ─────────────────────────────────────────

  Future<void> submit() async {
    state = state.copyWith(isSubmitting: true, submitError: null);
    final dio = ref.read(authServiceProvider).dio;

    try {
      await dio.post('/api/v1/kyc/submit', data: state.toApiPayload());
      // Invalidate status so it refreshes
      ref.invalidate(kycStatusProvider);
    } on DioException catch (e) {
      final responseData = e.response?.data;
      final message = (responseData is Map)
          ? ((responseData['error'] as Map?)?['message'] as String?)
          : null;
      state = state.copyWith(
        isSubmitting: false,
        submitError: message ?? 'Submission failed. Please try again.',
      );
      rethrow;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        submitError: 'Submission failed. Please try again.',
      );
      rethrow;
    }
    state = state.copyWith(isSubmitting: false);
  }

  Future<void> resubmit() async {
    state = state.copyWith(isSubmitting: true, submitError: null);
    final dio = ref.read(authServiceProvider).dio;

    try {
      await dio.post('/api/v1/kyc/resubmit', data: state.toApiPayload());
      ref.invalidate(kycStatusProvider);
    } on DioException catch (e) {
      final responseData = e.response?.data;
      final message = (responseData is Map)
          ? ((responseData['error'] as Map?)?['message'] as String?)
          : null;
      state = state.copyWith(
        isSubmitting: false,
        submitError: message ?? 'Resubmission failed. Please try again.',
      );
      rethrow;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        submitError: 'Resubmission failed. Please try again.',
      );
      rethrow;
    }
    state = state.copyWith(isSubmitting: false);
  }

  void reset() => state = const KycWizardState();
}

// ── Provider ──────────────────────────────────────────────────────

final kycWizardProvider =
    NotifierProvider<KycWizardNotifier, KycWizardState>(
  KycWizardNotifier.new,
);
