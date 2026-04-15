// Integration test entry point — run with:
//
//   patrol test --target integration_test/integration_test_runner.dart
//
// Pass env vars:
//   --dart-define STAGING_API_URL=https://api-staging.creatorhub.in
//   --dart-define TEST_TRAVELER_PHONE=+919000001001
//   --dart-define SUPABASE_SERVICE_ROLE_KEY=<secret>
//
// Tag-based filtering:
//   patrol test ... -- --tags @smoke        (run only smoke scenarios)
//   patrol test ... -- --tags @auth         (run only auth scenarios)
//   patrol test ... -- --tags ~@slow        (exclude slow scenarios)

import 'package:flutter_gherkin/flutter_gherkin.dart';

import 'hooks/global_hooks.dart';
import 'steps/steps_registry.dart';
import 'support/app_world.dart';

Future<void> main() async {
  final config = FlutterTestConfiguration.DEFAULT(allSteps)
    ..features = [RegExp(r'features/.*\.feature$')]
    ..reporters = [
      StdoutReporter(MessageLevel.verbose),
      // JsonReporter(path: 'test_results/'),   // uncomment for CI artifact
    ]
    ..hooks = [GlobalHooks()]
    ..createWorld = (_) => Future.value(AppWorld())
    ..defaultTimeout = const Duration(seconds: 90)
    ..stopAfterTestFailed = false;   // run all scenarios even if one fails

  await GherkinFlutterTestRunner().execute(config);
}
