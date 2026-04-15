import 'package:flutter_gherkin/flutter_gherkin.dart';
import 'package:patrol/patrol.dart';

/// Shared test context threaded through every step in a scenario.
///
/// [AppWorld] holds the [PatrolIntegrationTester] (Patrol's enhanced
/// WidgetTester), the active test persona, and any per-scenario state
/// (e.g. the like count captured before a tap).
///
/// Step definitions access it by casting the gherkin World:
///   final world = context.world as AppWorld;
///   await world.$.tap(find.text('Follow'));
class AppWorld extends World {
  /// Set by [GlobalHooks.onBeforeScenario] — gives every step access to
  /// Patrol's native automation alongside flutter_gherkin's WidgetTester.
  late PatrolIntegrationTester $;

  /// Which test persona is currently logged in.
  TestPersona? currentUser;

  /// Arbitrary per-scenario state bag for steps that need to capture
  /// a value in one step and assert it in another (e.g. like count).
  final Map<String, dynamic> scenarioState = {};
}

/// Identifies which pre-seeded test user to log in as.
enum TestPersona {
  traveler,
  creator,
  unKycCreator,
  booker,
  newUser,
}
