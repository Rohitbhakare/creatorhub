import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Model ──────────────────────────────────────────────────────────

enum LinkedAccountStatus {
  created,
  activated,
  suspended,
  needsClarification,
  rejected,
  underReview,
  deactivated,
}

LinkedAccountStatus? _statusFrom(String? raw) {
  if (raw == null) return null;
  switch (raw) {
    case 'created':
      return LinkedAccountStatus.created;
    case 'activated':
      return LinkedAccountStatus.activated;
    case 'suspended':
      return LinkedAccountStatus.suspended;
    case 'needs_clarification':
      return LinkedAccountStatus.needsClarification;
    case 'rejected':
      return LinkedAccountStatus.rejected;
    case 'under_review':
      return LinkedAccountStatus.underReview;
    case 'deactivated':
      return LinkedAccountStatus.deactivated;
    default:
      return null;
  }
}

class LinkedAccount {
  final LinkedAccountStatus? status;
  final DateTime? activatedAt;
  final String? holderName;
  final String? bankAccountMasked;
  final String? bankIfsc;

  const LinkedAccount({
    this.status,
    this.activatedAt,
    this.holderName,
    this.bankAccountMasked,
    this.bankIfsc,
  });

  bool get isActivated => status == LinkedAccountStatus.activated;
  bool get needsAction =>
      status == LinkedAccountStatus.needsClarification ||
      status == LinkedAccountStatus.rejected ||
      status == LinkedAccountStatus.suspended;
  bool get isPending =>
      status == LinkedAccountStatus.created ||
      status == LinkedAccountStatus.underReview;
  bool get isMissing => status == null;

  factory LinkedAccount.fromJson(Map<String, dynamic> json) => LinkedAccount(
        status: _statusFrom(json['status'] as String?),
        activatedAt: json['activatedAt'] != null
            ? DateTime.tryParse(json['activatedAt'] as String)
            : null,
        holderName: json['holderName'] as String?,
        bankAccountMasked: json['bankAccountMasked'] as String?,
        bankIfsc: json['bankIfsc'] as String?,
      );
}

class LinkedAccountState {
  final LinkedAccount? account;
  final bool isLoading;
  final String? error;

  const LinkedAccountState({
    this.account,
    this.isLoading = true,
    this.error,
  });

  LinkedAccountState copyWith({
    LinkedAccount? account,
    bool? isLoading,
    Object? error = _sentinel,
  }) =>
      LinkedAccountState(
        account: account ?? this.account,
        isLoading: isLoading ?? this.isLoading,
        error: error == _sentinel ? this.error : error as String?,
      );
}

const _sentinel = Object();

class LinkedAccountNotifier extends Notifier<LinkedAccountState> {
  @override
  LinkedAccountState build() {
    Future.microtask(_fetch);
    return const LinkedAccountState();
  }

  Future<void> _fetch() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get('/api/v1/creators/me/linked-account');
      final data =
          (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      state = LinkedAccountState(
        account: LinkedAccount.fromJson(data),
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Could not load bank details',
      );
    }
  }

  Future<void> refresh() => _fetch();
}

final linkedAccountProvider =
    NotifierProvider<LinkedAccountNotifier, LinkedAccountState>(
  LinkedAccountNotifier.new,
);
