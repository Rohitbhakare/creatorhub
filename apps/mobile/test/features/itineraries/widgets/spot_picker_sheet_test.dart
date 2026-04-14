import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/auth/services/auth_service.dart';
import 'package:creatorhub/features/itineraries/widgets/spot_picker_sheet.dart';

// ── Fake HTTP adapter ──────────────────────────────────────────────────────────

/// Controls what the Places autocomplete endpoint returns.
///
/// Uses `implements` (not `extends`) because HttpClientAdapter's factory
/// constructor prevents extension in Dart.
class _FakePlacesAdapter implements HttpClientAdapter {
  final List<Map<String, dynamic>> predictions;

  _FakePlacesAdapter({this.predictions = const []});

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final body = jsonEncode({
      'success': true,
      'data': predictions,
    });

    return ResponseBody.fromString(
      body,
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

// ── Helper: build an AuthService with a given adapter ─────────────────────────

AuthService _fakeAuthService(_FakePlacesAdapter adapter) {
  final service = AuthService(baseUrl: 'http://localhost:3001');
  // Clear the auth interceptor: it calls flutter_secure_storage (platform
  // channel) which never resolves in widget tests without channel mocking.
  // The SkeletonLoader's shimmer animation then loops forever and
  // pumpAndSettle times out. Clearing interceptors lets requests go straight
  // to the fake adapter.
  service.dio.interceptors.clear();
  service.dio.httpClientAdapter = adapter;
  return service;
}

// ── Widget wrapper ─────────────────────────────────────────────────────────────

Widget _wrap(Widget child, {AuthService? authService}) {
  return ProviderScope(
    overrides: [
      if (authService != null)
        authServiceProvider.overrideWithValue(authService),
    ],
    child: MaterialApp(
      home: Scaffold(
        // SpotPickerSheet is designed for bottom sheet use — it uses
        // Flexible + mainAxisSize.min which gives ListView zero height
        // when rendered in an unconstrained Scaffold body. A fixed height
        // gives the ListView a real viewport so items are actually built.
        body: SizedBox(height: 700, child: child),
      ),
    ),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

void main() {
  group('SpotPickerSheet', () {
    testWidgets('shows "Add a spot" title', (tester) async {
      await tester.pumpWidget(_wrap(
        const SpotPickerSheet(),
        authService: _fakeAuthService(_FakePlacesAdapter()),
      ));
      await tester.pump();

      expect(find.text('Add a spot'), findsOneWidget);
    });

    testWidgets('shows search field with placeholder', (tester) async {
      await tester.pumpWidget(_wrap(
        const SpotPickerSheet(),
        authService: _fakeAuthService(_FakePlacesAdapter()),
      ));
      await tester.pump();

      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('Search places...'), findsOneWidget);
    });

    testWidgets('shows empty prompt text initially', (tester) async {
      await tester.pumpWidget(_wrap(
        const SpotPickerSheet(),
        authService: _fakeAuthService(_FakePlacesAdapter()),
      ));
      await tester.pump();

      expect(
        find.text('Search for a place to add as a spot'),
        findsOneWidget,
      );
    });

    testWidgets('shows "Powered by Google" attribution', (tester) async {
      await tester.pumpWidget(_wrap(
        const SpotPickerSheet(),
        authService: _fakeAuthService(_FakePlacesAdapter()),
      ));
      await tester.pump();

      expect(find.text('Powered by Google'), findsOneWidget);
    });

    testWidgets('keeps empty prompt for queries shorter than 2 chars',
        (tester) async {
      await tester.pumpWidget(_wrap(
        const SpotPickerSheet(),
        authService: _fakeAuthService(_FakePlacesAdapter()),
      ));
      await tester.pump();

      await tester.enterText(find.byType(TextField), 'M');
      await tester.pump();

      // Still shows the empty prompt — no search triggered for < 2 chars
      expect(
        find.text('Search for a place to add as a spot'),
        findsOneWidget,
      );
    });

    testWidgets('shows no-results state when API returns empty list',
        (tester) async {
      await tester.pumpWidget(_wrap(
        const SpotPickerSheet(),
        authService: _fakeAuthService(_FakePlacesAdapter(predictions: [])),
      ));
      await tester.pump();

      await tester.enterText(find.byType(TextField), 'Manali');
      await tester.pump(); // debounce timer registered

      // Advance past the 300ms debounce → _searchPlaces is called
      await tester.pump(const Duration(milliseconds: 400));
      // Drain the async dio.get() microtasks and resulting setState rebuild
      await tester.pump();
      await tester.pump();

      expect(find.text('No places found'), findsOneWidget);
      expect(find.text('Try a different search term'), findsOneWidget);
    });

    testWidgets('shows result rows when API returns predictions',
        (tester) async {
      final adapter = _FakePlacesAdapter(predictions: [
        {
          'place_id': 'ChIJ-0',
          'main_text': 'Manali',
          'secondary_text': 'Himachal Pradesh, India',
          'lat': 32.2396,
          'lng': 77.1887,
          'photo_url': null,
        },
        {
          'place_id': 'ChIJ-1',
          'main_text': 'Manali Bus Stand',
          'secondary_text': 'Manali, India',
          'lat': 32.2432,
          'lng': 77.1888,
          'photo_url': null,
        },
      ]);

      await tester.pumpWidget(_wrap(
        const SpotPickerSheet(),
        authService: _fakeAuthService(adapter),
      ));
      await tester.pump();

      await tester.enterText(find.byType(TextField), 'Manali');
      await tester.pump(); // register debounce timer

      // Advance past the 300ms debounce; timer fires and kicks off _searchPlaces.
      // After this pump, no more timers are pending — only microtasks.
      await tester.pump(const Duration(milliseconds: 400));

      // Drain the Dio async chain (interceptor → adapter → setState → rebuild).
      await tester.pumpAndSettle();

      // 'Manali' appears in both the search field (EditableText) and the
      // first result row, so we expect at least 2.
      expect(find.text('Manali'), findsAtLeast(2));
      // Secondary texts are unique to the result rows.
      expect(find.text('Himachal Pradesh, India'), findsOneWidget);
      expect(find.text('Manali Bus Stand'), findsOneWidget);
    });

    testWidgets('pops with PlaceResult when a result is tapped',
        (tester) async {
      final adapter = _FakePlacesAdapter(predictions: [
        {
          'place_id': 'ChIJ-tap',
          'main_text': 'Spiti Valley',
          'secondary_text': 'Himachal Pradesh, India',
          'lat': 32.2,
          'lng': 78.1,
          'photo_url': null,
        },
      ]);

      PlaceResult? returned;

      await tester.pumpWidget(ProviderScope(
        overrides: [
          authServiceProvider.overrideWithValue(_fakeAuthService(adapter)),
        ],
        child: MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: ElevatedButton(
                onPressed: () async {
                  final result = await showModalBottomSheet<PlaceResult>(
                    context: context,
                    builder: (_) => const SpotPickerSheet(),
                  );
                  returned = result;
                },
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      ));

      // Open the bottom sheet
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();

      // Type query and wait for results
      await tester.enterText(find.byType(TextField), 'Spiti');
      await tester.pump(); // register debounce timer
      await tester.pump(const Duration(milliseconds: 400)); // fire debounce
      await tester.pumpAndSettle(); // drain async chain

      // Tap on the result
      await tester.tap(find.text('Spiti Valley'));
      await tester.pumpAndSettle();

      expect(returned, isNotNull);
      expect(returned!.placeId, equals('ChIJ-tap'));
      expect(returned!.name, equals('Spiti Valley'));
    });
  });
}
