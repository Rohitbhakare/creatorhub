import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/app/app.dart';

/// Bootstrap the app under test inside a [PatrolIntegrationTester].
///
/// Reads [STAGING_API_URL] from the environment (passed via
/// `patrol test --dart-define`) so the app talks to staging instead of
/// the hardcoded production URL.
Future<void> bootstrapApp(PatrolIntegrationTester $) async {
  final stagingUrl = const String.fromEnvironment(
    'STAGING_API_URL',
    defaultValue: 'http://localhost:3001',
  );

  await $.pumpWidgetAndSettle(
    ProviderScope(
      overrides: [
        // Override the API base URL provider with the staging URL.
        // Assumes an `apiBaseUrlProvider` exists in providers.dart.
        // apiBaseUrlProvider.overrideWithValue(stagingUrl),
      ],
      child: const App(),
    ),
  );
}
