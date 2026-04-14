import 'package:dio/dio.dart';

/// Extracts a human-readable error message from a Dio API error response.
///
/// Tries (in order):
///   1. `error.errors[0].message` — RFC 9457 field error list
///   2. `error.detail` — RFC 9457 top-level detail
///   3. Returns null if the response body doesn't match either shape.
String? extractDioErrorMessage(DioException e) {
  try {
    final body = e.response?.data as Map<String, dynamic>?;
    final errorMap = body?['error'] as Map<String, dynamic>?;
    final errors = errorMap?['errors'] as List<dynamic>?;
    if (errors != null && errors.isNotEmpty) {
      final first = errors.first as Map<String, dynamic>;
      return first['message'] as String?;
    }
    return errorMap?['detail'] as String?;
  } catch (_) {
    return null;
  }
}
