import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/app/app.dart'; // CreatorHubApp
import 'package:creatorhub/features/auth/providers/auth_provider.dart';

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

/// Delete all persisted auth tokens so the next step starts unauthenticated.
///
/// After calling this, pump once so GoRouter re-evaluates the auth guard and
/// redirects to the welcome/auth screen.
Future<void> clearAuthState(PatrolIntegrationTester $) async {
  const storage = FlutterSecureStorage();
  await storage.deleteAll();
  await $.tester.pump();

  // Sign out through the Riverpod notifier so in-memory state is also cleared.
  // The notifier's signOut() wipes both secure storage and the auth state atom.
  final element = $.tester.element(find.byType(ProviderScope));
  final container = ProviderScope.containerOf(element);
  try {
    await container.read(authProvider.notifier).signOut();
  } catch (_) {
    // Ignore if no session to sign out.
  }
  await $.tester.pumpAndSettle();
}
