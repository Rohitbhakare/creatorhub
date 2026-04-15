# E3.1 — Task Breakdown

> All tasks are assigned to the **Mobile agent** (no API changes needed).
> Tasks T1–T3 are planning-phase deliverables (DONE before build starts).
> Tasks T4–T12 are the build phase.

---

## T1: Feature Files (BDD Test Cases) — PLANNING PHASE
**Status:** DONE (written as part of epic plan)
**Files:**
- `apps/mobile/integration_test/features/F01_auth.feature`
- `apps/mobile/integration_test/features/F02_onboarding.feature`
- `apps/mobile/integration_test/features/F03_home_feed.feature`
- `apps/mobile/integration_test/features/F04_content_discovery.feature`
- `apps/mobile/integration_test/features/F05_social.feature`
- `apps/mobile/integration_test/features/F06_content_creation.feature`
- `apps/mobile/integration_test/features/F07_profile.feature`
- `apps/mobile/integration_test/features/F08_saved_lists.feature`
- `apps/mobile/integration_test/features/F09_studio.feature`
- `apps/mobile/integration_test/features/F10_booking.feature`
- `apps/mobile/integration_test/features/F11_kyc.feature`

**Acceptance:** 11 `.feature` files exist with complete Gherkin (Feature, Background, Scenario, Given/When/Then). All 38 scenarios cover every M0+M1+M2 user journey.

---

## T2: pubspec.yaml — Add Dependencies
**Agent:** Mobile
**Files:**
- `apps/mobile/pubspec.yaml`
- `apps/mobile/patrol.yaml` (new)

**Changes:**
```yaml
# pubspec.yaml dev_dependencies
dev_dependencies:
  patrol: ^3.4.0
  flutter_gherkin: ^4.0.0
  integration_test:
    sdk: flutter

# patrol.yaml
app_name: CreatorHub
app_id: in.creatorhub.app
android:
  app_id: in.creatorhub.app
ios:
  app_id: in.creatorhub.app
timeout: 120
```

**Acceptance:** `flutter pub get` succeeds with no version conflicts; `patrol --version` prints correctly.

---

## T3: Support Infrastructure
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/support/app_world.dart`
- `apps/mobile/integration_test/support/app_driver.dart`
- `apps/mobile/integration_test/support/test_data.dart`
- `apps/mobile/integration_test/support/api_helper.dart`

**Acceptance criteria:**

`app_world.dart` — `AppWorld extends World`:
- Holds `late PatrolIntegrationTester $` field set by test runner
- Holds `String? currentUser` (which test persona is active)
- Has `setUser(TestPersona)` helper that stores the persona

`app_driver.dart` — `bootstrapApp(PatrolIntegrationTester $)`:
- Pumps `ProviderScope(child: App())` via `$.pumpWidgetAndSettle`
- Reads `STAGING_API_URL` env var to override API base URL for staging

`test_data.dart` — `TestData` class (all `static const`):
```dart
// Test user personas
static const travelerPhone = '+919000001001';
static const creatorPhone  = '+919000001002';
static const unKycPhone    = '+919000001003';
static const bookerPhone   = '+919000001004';
static const testOtp       = '123456';

// Pre-seeded staging content IDs
static const seedPostId       = 'xxxxxxxx-...';  // replace with real staging UUID
static const seedItineraryId  = 'xxxxxxxx-...';
static const seedEventId      = 'xxxxxxxx-...';
static const seedExperienceId = 'xxxxxxxx-...';
static const seedCreatorId    = 'xxxxxxxx-...';  // @e2e_creator user ID
```

`api_helper.dart` — `ApiHelper`:
- `Future<void> deleteContentByTag(String tag)` — calls staging DELETE with service-role key
- `Future<void> cancelBooking(String bookingId)` — cleanup hook
- Reads `SUPABASE_SERVICE_ROLE_KEY` from env

---

## T4: Hooks
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/hooks/global_hooks.dart`

**Acceptance:**
```dart
class GlobalHooks extends Hook {
  @override
  Future<void> onAfterScenario(TestConfiguration config,
      Map<String, dynamic> tags, String scenario) async {
    // Delete any content created during this scenario
    // identified by tag 'testRunId:{uuid}'
    await ApiHelper.cleanupScenario(tags['testRunId']);
  }
}
```

---

## T5: Step Definitions — Auth + Navigation
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/steps/auth_steps.dart`
- `apps/mobile/integration_test/steps/navigation_steps.dart`

**Step signatures to implement:**

`auth_steps.dart`:
- `Given the app is launched` — calls `bootstrapApp($)`
- `Given I am not logged in` — clears secure storage (tokens)
- `Given I am logged in as traveler` — performs full OTP login with travelerPhone
- `Given I am logged in as creator` — performs full OTP login with creatorPhone
- `When I tap {string}` — `$(find.text(text)).tap()`
- `When I enter my phone number {string}` — finds phone field, enters number
- `When I enter OTP {string}` — enters 6-digit OTP into OTP boxes
- `Then I should see {string}` — `expect(find.text(text), findsOneWidget)`
- `Then I should be on the {string} screen` — asserts route / key widget present
- `Then I should see the home feed` — finds `HomeFeedScreen` key

`navigation_steps.dart`:
- `When I tap the {string} tab` — taps bottom nav tab by label text
- `When I navigate back` — `$.native.pressBack()` or `Navigator.pop`
- `Then the {string} tab should be active` — checks active tab styling

---

## T6: Step Definitions — Content + Social
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/steps/content_steps.dart`
- `apps/mobile/integration_test/steps/social_steps.dart`

**Step signatures:**

`content_steps.dart`:
- `When I tap the first post in the feed` — finds `PostFeedCard`, taps index 0
- `When I tap the first itinerary in the feed` — finds `ItineraryFeedCard`, taps index 0
- `When I tap the first event in the feed` — finds `EventFeedCard`, taps index 0
- `Then I should see the post detail screen` — asserts `PostDetailScreen` key
- `Then I should see the creator name {string}` — finds text in detail screen
- `Then I should see the POST badge` — finds text('POST')

`social_steps.dart`:
- `When I tap the like button` — finds PhosphorIcon.heart, taps
- `Then the like count should increase` — asserts count +1 vs before state
- `When I tap the save button` — finds PhosphorIcon.bookmarkSimple, taps
- `Then I should see the save to list sheet` — asserts bottom sheet visible
- `When I tap Follow` — finds AppButton with label 'Follow'
- `Then the button should show Following` — asserts label changed
- `When I tap the share button` — finds share icon, taps
- `Then I should see the share sheet` — asserts `$.native` share sheet visible or bottom sheet

---

## T7: Step Definitions — Creation + Profile
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/steps/creation_steps.dart`
- `apps/mobile/integration_test/steps/profile_steps.dart`

**Step signatures:**

`creation_steps.dart`:
- `When I tap the Create+ tab` — taps center raised circle (index 2)
- `Then I should see the content type picker` — asserts `ContentTypePickerScreen` key
- `When I select Post as content type` — taps 'Post' card
- `When I enter title {string}` — finds title field by key, enters text
- `When I enter body text {string}` — finds body field, enters text
- `When I tap Publish` — finds AppButton labeled 'Publish'
- `Then my post should appear in the studio` — navigates to /studio, asserts post title visible

`profile_steps.dart`:
- `When I tap the You tab` — taps 'You' bottom nav
- `Then I should see my profile screen` — asserts `YouTabScreen` key
- `When I tap Edit Profile` — finds edit button
- `When I change my display name to {string}` — clears field, enters new name
- `When I tap Save` — taps save button
- `Then my display name should show {string}` — asserts updated name

---

## T8: Step Definitions — Booking + KYC
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/steps/booking_steps.dart`
- `apps/mobile/integration_test/steps/kyc_steps.dart`

**Step signatures:**

`booking_steps.dart`:
- `Given a published experience exists with id {string}` — navigates directly to `/experiences/{id}`
- `When I tap Book Now` — finds AppButton('Book Now')
- `When I complete Razorpay payment with test UPI` — uses `$.native.tap(Selector(text: 'Pay'))` in WebView; enters test UPI `success@razorpay`
- `Then I should see the booking confirmation screen` — asserts `BookingConfirmationScreen` key
- `When I navigate to My Bookings` — navigates to `/bookings`
- `Then I should see my booking` — asserts booking card visible

`kyc_steps.dart`:
- `When I tap Start KYC` — finds button on KYC status screen
- `Then I should see the PAN entry step` — asserts step 1 visible
- `When I enter PAN {string}` — enters text in PAN field
- `When I tap Next` — taps next/continue button
- `Then I should see PAN validation error {string}` — asserts error text

---

## T9: Step Definitions Registry
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/steps/steps_registry.dart`

**Purpose:** Single file that imports and exports all step definition lists so `integration_test_runner.dart` has one import.

```dart
// steps_registry.dart
import 'auth_steps.dart';
import 'navigation_steps.dart';
import 'content_steps.dart';
import 'social_steps.dart';
import 'creation_steps.dart';
import 'profile_steps.dart';
import 'booking_steps.dart';
import 'kyc_steps.dart';

List<StepDefinitionGeneric> get allSteps => [
  ...authSteps,
  ...navigationSteps,
  ...contentSteps,
  ...socialSteps,
  ...creationSteps,
  ...profileSteps,
  ...bookingSteps,
  ...kycSteps,
];
```

---

## T10: Test Runner
**Agent:** Mobile
**Files:**
- `apps/mobile/integration_test/integration_test_runner.dart`

**Acceptance:**
```dart
Future<void> main() async {
  final config = FlutterTestConfiguration.DEFAULT(allSteps)
    ..features = [RegExp(r'features/.*\.feature$')]
    ..reporters = [StdoutReporter(), JsonReporter(path: 'test_results/')]
    ..hooks = [GlobalHooks()]
    ..createWorld = (config) => Future.value(AppWorld())
    ..defaultTimeout = const Duration(seconds: 90);

  await GherkinFlutterTestRunner().execute(config);
}
```

Running locally:
```bash
# Android emulator
patrol test --target integration_test/integration_test_runner.dart

# Specific feature only
patrol test --target integration_test/integration_test_runner.dart \
            -- --tags @auth
```

---

## T11: Semantic Keys on Production Widgets
**Agent:** Mobile
**Files:** Various production widget files (add `Key` annotations)

**Why:** Patrol / flutter_gherkin step definitions need stable widget keys or semantic labels to find widgets reliably, especially for widgets that don't have unique text (e.g., like buttons, tab icons).

**Keys to add:**

| Widget | Key |
|--------|-----|
| `MainShell` bottom nav tabs | `Key('tab_home')`, `Key('tab_search')`, `Key('tab_create')`, `Key('tab_studio')`, `Key('tab_you')` |
| `EngagementBar` like button | `Key('btn_like')` |
| `EngagementBar` save button | `Key('btn_save')` |
| `EngagementBar` share button | `Key('btn_share')` |
| `HomeFeedScreen` root | `Key('screen_home_feed')` |
| `PostDetailScreen` root | `Key('screen_post_detail')` |
| `ItineraryDetailScreen` root | `Key('screen_itinerary_detail')` |
| `EventDetailScreen` root | `Key('screen_event_detail')` |
| `ExperienceDetailScreen` root | `Key('screen_experience_detail')` |
| `ContentTypePickerScreen` root | `Key('screen_content_picker')` |
| `BookingConfirmationScreen` root | `Key('screen_booking_confirmed')` |
| `KycStatusScreen` root | `Key('screen_kyc_status')` |

**Acceptance:** `flutter analyze` still passes; no visual regression — keys are invisible to users.

---

## T12: CI/CD Pipeline
**Agent:** Mobile
**Files:**
- `.github/workflows/e2e.yml` (new)

**Acceptance:**
- Workflow triggers on `push` to `dev` and `main`, and nightly at 02:00 IST
- Uses Android emulator (API 34) on `ubuntu-latest`
- Secrets: `STAGING_API_URL`, `TEST_USER_PHONE`, `SUPABASE_SERVICE_ROLE_KEY`
- Uploads `test_results/*.json` as artifact on failure
- Job fails if any scenario fails (non-zero exit)

---

## T13: Staging Seed Data
**Agent:** API (manual step — database task)
**Files:**
- `apps/api/src/db/migrations/009_e2e_test_seed.sql` (new)

**Purpose:** Insert the stable test users and content that E2E tests rely on. Must be run once against staging DB.

**Acceptance:**
- 4 test users exist with phone numbers `+9190000010{01–04}`
- Firebase Auth test phone numbers registered (`+91 9000001001` → OTP `123456`)
- 1 published post, 1 itinerary, 1 event, 1 experience exist with known UUIDs matching `test_data.dart`
- 1 paid experience with capacity=2 exists for booking flow test

---

## Dependency Order

```
T2 (pubspec) → T3 (support infra) → T4 (hooks) → T5–T8 (steps) → T9 (registry) → T10 (runner)
T11 (widget keys) can run in parallel with T5–T8
T12 (CI) requires T10 to exist
T13 (seed data) is independent — can be done anytime before T10
T1 (feature files) — DONE (planning phase)
```
