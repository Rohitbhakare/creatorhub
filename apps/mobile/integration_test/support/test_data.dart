/// Stable test credentials and seed content IDs for the staging environment.
///
/// All test phone numbers are registered in Firebase Auth as test phone numbers
/// (Settings → Phone → Test phone numbers) so they bypass SMS and always
/// accept OTP [testOtp].
///
/// All seed content IDs must be pre-inserted via migration
/// 009_e2e_test_seed.sql before running the suite.
///
/// SECURITY: In CI, [travelerPhone] et al are overridden by env vars
/// (TEST_TRAVELER_PHONE, TEST_CREATOR_PHONE, ...) so credentials are
/// not hardcoded in production builds.
abstract final class TestData {
  // ── Test OTP (works for all test phone numbers in staging) ──────
  static const testOtp = '123456';

  // ── Test user phone numbers ────────────────────────────────────
  static String get travelerPhone =>
      const String.fromEnvironment('TEST_TRAVELER_PHONE',
          defaultValue: '+919000001001');

  static String get creatorPhone =>
      const String.fromEnvironment('TEST_CREATOR_PHONE',
          defaultValue: '+919000001002');

  static String get unKycPhone =>
      const String.fromEnvironment('TEST_UNKYC_PHONE',
          defaultValue: '+919000001003');

  static String get bookerPhone =>
      const String.fromEnvironment('TEST_BOOKER_PHONE',
          defaultValue: '+919000001004');

  // ── Pre-seeded staging content IDs ────────────────────────────
  // Replace these UUIDs with the actual values after running seed migration.
  static const seedPostId = 'REPLACE_WITH_STAGING_UUID';
  static const seedItineraryId = 'REPLACE_WITH_STAGING_UUID';
  static const seedEventId = 'REPLACE_WITH_STAGING_UUID';
  static const seedExperienceId = 'REPLACE_WITH_STAGING_UUID';
  static const seedCreatorId = 'REPLACE_WITH_STAGING_UUID';
  static const seedCreatorUsername = 'e2e_creator';

  // Seed experience must have capacity=2 so the "Sold Out" test can
  // fill it by creating 2 bookings in beforeScenario.
  static const seedExperienceCapacity = 2;

  // ── Razorpay test UPI ─────────────────────────────────────────
  static const razorpaySuccessUpi = 'success@razorpay';
}
