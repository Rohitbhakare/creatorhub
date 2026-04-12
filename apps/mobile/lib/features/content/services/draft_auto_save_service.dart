import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/wizard_provider.dart';

/// Service that auto-saves content drafts to the API every 30 seconds.
///
/// Usage:
/// ```dart
/// final autoSave = DraftAutoSaveService(ref: ref, dio: dio);
/// autoSave.start();
/// // ... on dispose:
/// autoSave.dispose();
/// ```
class DraftAutoSaveService {
  final WidgetRef _ref;
  final Dio _dio;
  Timer? _timer;
  bool _disposed = false;

  static const _saveInterval = Duration(seconds: 30);

  DraftAutoSaveService({
    required WidgetRef ref,
    required Dio dio,
  })  : _ref = ref,
        _dio = dio;

  /// Start the auto-save timer.
  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(_saveInterval, (_) => _tick());
  }

  /// Reset the timer (call on user input to restart the 30s countdown).
  void reset() {
    if (_disposed) return;
    _timer?.cancel();
    _timer = Timer.periodic(_saveInterval, (_) => _tick());
  }

  /// Cancel the timer and prevent further saves.
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    _timer = null;
  }

  /// Perform a single save tick.
  Future<void> _tick() async {
    if (_disposed) return;

    final wizard = _ref.read(wizardProvider);

    // Skip if not dirty or already saving
    if (!wizard.isDirty || wizard.isSaving) return;

    // Skip if no content ID yet (draft not yet created via API)
    final contentId = wizard.contentId;
    if (contentId == null) return;

    _ref.read(wizardProvider.notifier).markSaving();

    try {
      await _dio.put(
        '/api/v1/content/$contentId',
        data: _buildPayload(wizard),
      );

      if (!_disposed) {
        _ref.read(wizardProvider.notifier).markSaved();
      }
    } on DioException catch (e) {
      if (!_disposed) {
        _ref.read(wizardProvider.notifier).markSaveError(
              e.response?.statusMessage ?? 'Failed to save draft',
            );
      }
    } catch (e) {
      if (!_disposed) {
        _ref
            .read(wizardProvider.notifier)
            .markSaveError('Auto-save failed. Changes will retry.');
      }
    }
  }

  /// Force a save now (e.g., before navigating away).
  Future<void> saveNow() async {
    await _tick();
  }

  Map<String, dynamic> _buildPayload(WizardState wizard) {
    return {
      'title': wizard.title,
      'description': wizard.description,
      if (wizard.contentType == ContentType.post) 'body': wizard.body,
      'vertical': wizard.vertical,
      if (wizard.subCategoryId != null) 'sub_category_id': wizard.subCategoryId,
      'tags': wizard.tags,
      if (wizard.startingCityId != null)
        'starting_city_id': wizard.startingCityId,
      'destination_city_ids': wizard.destinationCityIds,
      'pricing_model': wizard.pricingModel,
      'price_paisa': wizard.pricePaisa,
      if (wizard.contentType == ContentType.selfPacedItinerary)
        'day_count': wizard.dayCount,
    };
  }
}
