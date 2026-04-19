// GENERATED CODE - DO NOT MODIFY BY HAND AND DO NOT COMMIT TO VERSION CONTROL
// ignore_for_file: type=lint, invalid_use_of_internal_member

import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';
import 'package:patrol/src/native/contracts/contracts.dart';
import 'package:test_api/src/backend/invoker.dart';

// START: GENERATED TEST IMPORTS
import 'scenarios/auth_scenarios_test.dart' as scenarios__auth_scenarios_test;
import 'scenarios/booking_scenarios_test.dart' as scenarios__booking_scenarios_test;
import 'scenarios/creation_scenarios_test.dart' as scenarios__creation_scenarios_test;
import 'scenarios/feed_scenarios_test.dart' as scenarios__feed_scenarios_test;
import 'scenarios/kyc_scenarios_test.dart' as scenarios__kyc_scenarios_test;
import 'scenarios/navigation_scenarios_test.dart' as scenarios__navigation_scenarios_test;
import 'scenarios/onboarding_scenarios_test.dart' as scenarios__onboarding_scenarios_test;
import 'scenarios/profile_scenarios_test.dart' as scenarios__profile_scenarios_test;
import 'scenarios/screenshots_test.dart' as scenarios__screenshots_test;
import 'scenarios/social_scenarios_test.dart' as scenarios__social_scenarios_test;
// END: GENERATED TEST IMPORTS

Future<void> main() async {
  // This is the entrypoint of the bundled Dart test.
  //
  // Its responsibilies are:
  //  * Running a special Dart test that runs before all the other tests and
  //    explores the hierarchy of groups and tests.
  //  * Hosting a PatrolAppService, which the native side of Patrol uses to get
  //    the Dart tests, and to request execution of a specific Dart test.
  //
  // When running on Android, the Android Test Orchestrator, before running the
  // tests, makes an initial run to gather the tests that it will later run. The
  // native side of Patrol (specifically: PatrolJUnitRunner class) is hooked
  // into the Android Test Orchestrator lifecycle and knows when that initial
  // run happens. When it does, PatrolJUnitRunner makes an RPC call to
  // PatrolAppService and asks it for Dart tests.
  //
  // When running on iOS, the native side of Patrol (specifically: the
  // PATROL_INTEGRATION_TEST_IOS_RUNNER macro) makes an initial run to gather
  // the tests that it will later run (same as the Android). During that initial
  // run, it makes an RPC call to PatrolAppService and asks it for Dart tests.
  //
  // Once the native runner has the list of Dart tests, it dynamically creates
  // native test cases from them. On Android, this is done using the
  // Parametrized JUnit runner. On iOS, new test case methods are swizzled into
  // the RunnerUITests class, taking advantage of the very dynamic nature of
  // Objective-C runtime.
  //
  // Execution of these dynamically created native test cases is then fully
  // managed by the underlying native test framework (JUnit on Android, XCTest
  // on iOS). The native test cases do only one thing - request execution of the
  // Dart test (out of which they had been created) and wait for it to complete.
  // The result of running the Dart test is the result of the native test case.

  final nativeAutomator = NativeAutomator(config: NativeAutomatorConfig());
  await nativeAutomator.initialize();
  final binding = PatrolBinding.ensureInitialized(NativeAutomatorConfig());
  final testExplorationCompleter = Completer<DartGroupEntry>();

  // A special test to explore the hierarchy of groups and tests. This is a hack
  // around https://github.com/dart-lang/test/issues/1998.
  //
  // This test must be the first to run. If not, the native side likely won't
  // receive any tests, and everything will fall apart.
  test('patrol_test_explorer', () {
    // Maybe somewhat counterintuitively, this callback runs *after* the calls
    // to group() below.
    final topLevelGroup = Invoker.current!.liveTest.groups.first;
    final dartTestGroup = createDartTestGroup(topLevelGroup,
      tags: null,
      excludeTags: null,
    );
    testExplorationCompleter.complete(dartTestGroup);
    print('patrol_test_explorer: obtained Dart-side test hierarchy:');
    reportGroupStructure(dartTestGroup);
  });

  // START: GENERATED TEST GROUPS
  group('scenarios.auth_scenarios_test', scenarios__auth_scenarios_test.main);
  group('scenarios.booking_scenarios_test', scenarios__booking_scenarios_test.main);
  group('scenarios.creation_scenarios_test', scenarios__creation_scenarios_test.main);
  group('scenarios.feed_scenarios_test', scenarios__feed_scenarios_test.main);
  group('scenarios.kyc_scenarios_test', scenarios__kyc_scenarios_test.main);
  group('scenarios.navigation_scenarios_test', scenarios__navigation_scenarios_test.main);
  group('scenarios.onboarding_scenarios_test', scenarios__onboarding_scenarios_test.main);
  group('scenarios.profile_scenarios_test', scenarios__profile_scenarios_test.main);
  group('scenarios.screenshots_test', scenarios__screenshots_test.main);
  group('scenarios.social_scenarios_test', scenarios__social_scenarios_test.main);
  // END: GENERATED TEST GROUPS

  final dartTestGroup = await testExplorationCompleter.future;
  final appService = PatrolAppService(topLevelDartTestGroup: dartTestGroup);
  binding.patrolAppService = appService;
  await runAppService(appService);

  // Until now, the native test runner was waiting for us, the Dart side, to
  // come alive. Now that we did, let's tell it that we're ready to be asked
  // about Dart tests.
  await nativeAutomator.markPatrolAppServiceReady();

  await appService.testExecutionCompleted;
}
