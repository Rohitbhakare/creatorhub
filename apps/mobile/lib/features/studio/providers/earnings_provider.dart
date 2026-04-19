import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────────

enum PayoutStatus { pending, scheduled, processing, completed, failed }

PayoutStatus _payoutStatusFrom(String raw) {
  switch (raw) {
    case 'scheduled':
      return PayoutStatus.scheduled;
    case 'processing':
      return PayoutStatus.processing;
    case 'completed':
      return PayoutStatus.completed;
    case 'failed':
      return PayoutStatus.failed;
    case 'pending':
    default:
      return PayoutStatus.pending;
  }
}

class PayoutSummary {
  final String id;
  final String bookingId;
  final int amountPaisa;
  final int tdsPaisa;
  final PayoutStatus status;
  final DateTime scheduledAt;
  final DateTime? processedAt;
  final String? bookingTitle;
  final String? failureReason;

  const PayoutSummary({
    required this.id,
    required this.bookingId,
    required this.amountPaisa,
    required this.tdsPaisa,
    required this.status,
    required this.scheduledAt,
    this.processedAt,
    this.bookingTitle,
    this.failureReason,
  });

  factory PayoutSummary.fromJson(Map<String, dynamic> json) => PayoutSummary(
        id: json['id'] as String,
        bookingId: json['bookingId'] as String,
        amountPaisa: (json['amountPaisa'] as num?)?.toInt() ?? 0,
        tdsPaisa: (json['tdsPaisa'] as num?)?.toInt() ?? 0,
        status: _payoutStatusFrom(json['status'] as String? ?? 'pending'),
        scheduledAt: DateTime.tryParse(json['scheduledAt'] as String? ?? '') ??
            DateTime.now(),
        processedAt: json['processedAt'] != null
            ? DateTime.tryParse(json['processedAt'] as String)
            : null,
        bookingTitle: json['bookingTitle'] as String?,
        failureReason: json['failureReason'] as String?,
      );
}

class PayoutTotals {
  final int pendingPaisa;
  final int processingPaisa;
  final int paidLast30dPaisa;

  const PayoutTotals({
    required this.pendingPaisa,
    required this.processingPaisa,
    required this.paidLast30dPaisa,
  });

  factory PayoutTotals.fromJson(Map<String, dynamic> json) => PayoutTotals(
        pendingPaisa: (json['pendingPaisa'] as num?)?.toInt() ?? 0,
        processingPaisa: (json['processingPaisa'] as num?)?.toInt() ?? 0,
        paidLast30dPaisa: (json['paidLast30dPaisa'] as num?)?.toInt() ?? 0,
      );
}

class EarningsState {
  final List<PayoutSummary> items;
  final PayoutTotals totals;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? nextCursor;
  final String? error;

  const EarningsState({
    this.items = const [],
    this.totals = const PayoutTotals(
      pendingPaisa: 0,
      processingPaisa: 0,
      paidLast30dPaisa: 0,
    ),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.nextCursor,
    this.error,
  });

  EarningsState copyWith({
    List<PayoutSummary>? items,
    PayoutTotals? totals,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? nextCursor,
    Object? error = _sentinel,
  }) =>
      EarningsState(
        items: items ?? this.items,
        totals: totals ?? this.totals,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
        nextCursor: nextCursor ?? this.nextCursor,
        error: error == _sentinel ? this.error : error as String?,
      );
}

const _sentinel = Object();

class EarningsNotifier extends Notifier<EarningsState> {
  static const int _pageSize = 20;

  @override
  EarningsState build() {
    Future.microtask(_fetch);
    return const EarningsState();
  }

  Future<void> _fetch() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/creators/me/payouts',
        queryParameters: {'limit': _pageSize},
      );
      final data =
          (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      final items = rawItems
          .map((e) => PayoutSummary.fromJson(e as Map<String, dynamic>))
          .toList();
      final totalsJson =
          (data['summary'] as Map<String, dynamic>?) ?? <String, dynamic>{};
      state = EarningsState(
        items: items,
        totals: PayoutTotals.fromJson(totalsJson),
        isLoading: false,
        hasMore: data['next_cursor'] != null,
        nextCursor: data['next_cursor'] as String?,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Could not load your earnings',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) {
      return;
    }
    state = state.copyWith(isLoadingMore: true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/creators/me/payouts',
        queryParameters: {'limit': _pageSize, 'cursor': state.nextCursor},
      );
      final data =
          (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      final more = rawItems
          .map((e) => PayoutSummary.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(
        items: [...state.items, ...more],
        isLoadingMore: false,
        hasMore: data['next_cursor'] != null,
        nextCursor: data['next_cursor'] as String?,
      );
    } on DioException {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  Future<void> refresh() => _fetch();
}

final earningsProvider =
    NotifierProvider<EarningsNotifier, EarningsState>(EarningsNotifier.new);
