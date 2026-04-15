// ── Step Definition Registry ──────────────────────────────────────────────────
// Import all step definition lists here. The runner imports only this file.

import 'package:flutter_gherkin/flutter_gherkin.dart';

export 'auth_steps.dart';
export 'navigation_steps.dart';
export 'content_steps.dart';
export 'social_steps.dart';
export 'creation_steps.dart';
export 'profile_steps.dart';
export 'booking_steps.dart';
export 'kyc_steps.dart';

// TODO(T5–T8): uncomment each import as the step file is implemented.
// import 'auth_steps.dart';
// import 'navigation_steps.dart';
// import 'content_steps.dart';
// import 'social_steps.dart';
// import 'creation_steps.dart';
// import 'profile_steps.dart';
// import 'booking_steps.dart';
// import 'kyc_steps.dart';

/// All registered step definitions. Passed to [FlutterTestConfiguration].
List<StepDefinitionGeneric<dynamic>> get allSteps => [
  // TODO(T5): ...authSteps,
  // TODO(T5): ...navigationSteps,
  // TODO(T6): ...contentSteps,
  // TODO(T6): ...socialSteps,
  // TODO(T7): ...creationSteps,
  // TODO(T7): ...profileSteps,
  // TODO(T8): ...bookingSteps,
  // TODO(T8): ...kycSteps,
];
