import 'package:flutter_gherkin/flutter_gherkin.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../support/api_helper.dart';

/// Runs before and after every scenario to isolate test state.
class GlobalHooks extends Hook {
  @override
  Future<void> onBeforeScenario(
    TestConfiguration config,
    Map<String, dynamic> tags,
  ) async {
    // Clear secure storage so each scenario starts with no session.
    // The Background step "Given I am not logged in" relies on this.
    const storage = FlutterSecureStorage();
    await storage.deleteAll();
  }

  @override
  Future<void> onAfterScenario(
    TestConfiguration config,
    Map<String, dynamic> tags,
    String scenario, {
    bool? passed,
  }) async {
    // Delete any content tagged with this scenario's testRunId.
    final runId = tags['testRunId'] as String?;
    await ApiHelper.cleanupScenario(runId);
  }
}
