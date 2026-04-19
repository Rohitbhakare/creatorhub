import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/app/app.dart'; // CreatorHubApp

/// Pump the full CreatorHub app under [ProviderScope] and wait for it to settle.
///
/// Call this as the very first action in every [patrolTest]:
/// ```dart
/// patrolTest('my scenario', ($) async {
///   await bootstrapApp($);
///   ...
/// });
/// ```
Future<void> bootstrapApp(PatrolIntegrationTester $) async {
  await $.pumpWidgetAndSettle(const ProviderScope(child: CreatorHubApp()));
}

/// Ensure the app is in an unauthenticated state.
///
/// Clears persisted tokens. Relies on the auth provider watching storage —
/// it will detect no token and GoRouter will redirect to the welcome screen.
/// Does NOT re-pump the app widget (avoids stacking ProviderScope instances
/// which causes memory pressure and SIGKILL after multiple tests).
Future<void> clearAuthState(PatrolIntegrationTester $) async {
  const storage = FlutterSecureStorage();
  await storage.deleteAll();
  // Let GoRouter react to the storage change.
  await $.tester.pumpAndSettle(const Duration(seconds: 2));
}
