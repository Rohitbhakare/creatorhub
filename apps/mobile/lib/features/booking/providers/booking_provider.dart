import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────

/// Full booking record returned by GET /api/v1/bookings/:id and
/// embedded in CreateBookingResult.
class BookingDetails {
  final String id;
  final String contentId;
  final String scheduledDateId;
  final String status;
  final int basePricePaisa;
  final int platformFeePaisa;
  final int gstPaisa;
  final int tdsPaisa;
  final int totalPaisa;
  final int creatorPayoutPaisa;
  final String? razorpayOrderId;
  final String createdAt;

  const BookingDetails({
    required this.id,
    required this.contentId,
    required this.scheduledDateId,
    required this.status,
    required this.basePricePaisa,
    required this.platformFeePaisa,
    required this.gstPaisa,
    required this.tdsPaisa,
    required this.totalPaisa,
    required this.creatorPayoutPaisa,
    this.razorpayOrderId,
    required this.createdAt,
  });

  factory BookingDetails.fromJson(Map<String, dynamic> json) {
    return BookingDetails(
      id: json['id'] as String? ?? '',
      contentId: json['content_id'] as String? ?? '',
      scheduledDateId: json['scheduled_date_id'] as String? ?? '',
      status: json['status'] as String? ?? 'pending_payment',
      basePricePaisa: json['base_price_paisa'] as int? ?? 0,
      platformFeePaisa: json['platform_fee_paisa'] as int? ?? 0,
      gstPaisa: json['gst_paisa'] as int? ?? 0,
      tdsPaisa: json['tds_paisa'] as int? ?? 0,
      totalPaisa: json['total_paisa'] as int? ?? 0,
      creatorPayoutPaisa: json['creator_payout_paisa'] as int? ?? 0,
      razorpayOrderId: json['razorpay_order_id'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

/// Result of POST /api/v1/bookings — includes booking + Razorpay order info.
class CreateBookingResult {
  final BookingDetails booking;
  final String razorpayOrderId;
  final String keyId;

  const CreateBookingResult({
    required this.booking,
    required this.razorpayOrderId,
    required this.keyId,
  });

  factory CreateBookingResult.fromJson(Map<String, dynamic> json) {
    final bookingJson =
        json['booking'] as Map<String, dynamic>? ?? {};
    return CreateBookingResult(
      booking: BookingDetails.fromJson(bookingJson),
      razorpayOrderId: json['razorpay_order_id'] as String? ?? '',
      keyId: json['key_id'] as String? ?? '',
    );
  }
}

// ── Read Providers ─────────────────────────────────────────────────

/// Fetches a single booking by ID. Auto-disposed.
final bookingProvider =
    FutureProvider.autoDispose.family<BookingDetails, String>((ref, bookingId) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final response = await dio.get('/api/v1/bookings/$bookingId');
    final data =
        (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return BookingDetails.fromJson(data);
  } on DioException catch (e) {
    throw Exception(e.response?.statusMessage ?? 'Failed to load booking');
  }
});

/// Fetches all bookings for the current user. Auto-disposed.
final userBookingsProvider =
    FutureProvider.autoDispose<List<BookingDetails>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final response = await dio.get('/api/v1/bookings');
    final dataList =
        (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
    return dataList
        .map((d) => BookingDetails.fromJson(d as Map<String, dynamic>))
        .toList();
  } on DioException catch (e) {
    throw Exception(e.response?.statusMessage ?? 'Failed to load bookings');
  }
});

// ── Booking Flow State ─────────────────────────────────────────────

/// Tracks in-progress booking flow state (creating → paying → verifying).
class BookingFlowState {
  final CreateBookingResult? result;
  final bool isCreating;
  final bool isVerifying;
  final String? error;

  const BookingFlowState({
    this.result,
    this.isCreating = false,
    this.isVerifying = false,
    this.error,
  });

  BookingFlowState copyWith({
    CreateBookingResult? result,
    bool? isCreating,
    bool? isVerifying,
    String? error,
  }) {
    return BookingFlowState(
      result: result ?? this.result,
      isCreating: isCreating ?? this.isCreating,
      isVerifying: isVerifying ?? this.isVerifying,
      error: error,
    );
  }

  bool get isLoading => isCreating || isVerifying;
}

// ── Booking Flow Notifier ──────────────────────────────────────────

final bookingFlowProvider =
    AsyncNotifierProvider.autoDispose<BookingFlowNotifier, BookingFlowState>(
  BookingFlowNotifier.new,
);

class BookingFlowNotifier extends AsyncNotifier<BookingFlowState> {
  @override
  Future<BookingFlowState> build() async {
    return const BookingFlowState();
  }

  /// Step 1: POST /api/v1/bookings → create booking + Razorpay order.
  /// Returns [CreateBookingResult] on success; stores it in state.
  Future<CreateBookingResult?> createBooking({
    required String contentId,
    required String scheduledDateId,
  }) async {
    state = const AsyncValue.loading();
    final dio = ref.read(authServiceProvider).dio;

    try {
      final response = await dio.post('/api/v1/bookings', data: {
        'content_id': contentId,
        'scheduled_date_id': scheduledDateId,
      });
      final data =
          (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final result = CreateBookingResult.fromJson(data);
      state = AsyncValue.data(BookingFlowState(result: result));
      return result;
    } on DioException catch (e) {
      final msg = e.response?.statusMessage ?? 'Failed to create booking';
      state = AsyncValue.data(BookingFlowState(error: msg));
      return null;
    } catch (e) {
      state = AsyncValue.data(BookingFlowState(error: e.toString()));
      return null;
    }
  }

  /// Step 2: POST /api/v1/bookings/verify-payment → confirm payment.
  /// Returns verified [BookingDetails] on success.
  Future<BookingDetails?> verifyPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final current = state.value ?? const BookingFlowState();
    state = AsyncValue.data(current.copyWith(isVerifying: true, error: null));

    final dio = ref.read(authServiceProvider).dio;
    try {
      final response = await dio.post('/api/v1/bookings/verify-payment', data: {
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': razorpaySignature,
      });
      final data =
          (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final booking = BookingDetails.fromJson(data);
      state = AsyncValue.data(
        current.copyWith(isVerifying: false, error: null),
      );
      return booking;
    } on DioException catch (e) {
      final msg = e.response?.statusMessage ?? 'Payment verification failed';
      state = AsyncValue.data(
        current.copyWith(isVerifying: false, error: msg),
      );
      return null;
    } catch (e) {
      state = AsyncValue.data(
        current.copyWith(isVerifying: false, error: e.toString()),
      );
      return null;
    }
  }

  /// Reset the flow state (call when sheet is dismissed without completing).
  void reset() {
    state = const AsyncValue.data(BookingFlowState());
  }
}
