/// Stable test credentials and seed content IDs for the staging environment.
///
/// Phone 9090909090 is registered in Firebase Auth as a test phone number
/// (Firebase Console → Authentication → Sign-in method → Phone → Test phone numbers)
/// so it bypasses real SMS and always accepts OTP [testOtp].
abstract final class TestData {
  // ── Test OTP (fixed for all test phone numbers in staging) ──────
  static const testOtp = '123456';

  // ── Primary test phone number ───────────────────────────────────
  // 10-digit Indian mobile number (no country code prefix).
  // The PhoneOtpScreen accepts 10-digit input and prepends +91 internally.
  static const testPhone = '9090909090';

  // ── Persona-specific overrideable phone numbers ─────────────────
  // Defaults to testPhone; CI can override via --dart-define.
  static String get travelerPhone =>
      const String.fromEnvironment('TEST_TRAVELER_PHONE',
          defaultValue: testPhone);

  static String get creatorPhone =>
      const String.fromEnvironment('TEST_CREATOR_PHONE',
          defaultValue: testPhone);

  static String get unKycPhone =>
      const String.fromEnvironment('TEST_UNKYC_PHONE',
          defaultValue: testPhone);

  static String get bookerPhone =>
      const String.fromEnvironment('TEST_BOOKER_PHONE',
          defaultValue: testPhone);

  // ── Pre-seeded staging content IDs ────────────────────────────
  // Replace these with real UUIDs after running seed migration 009.
  static const seedPostId = 'REPLACE_WITH_STAGING_UUID';
  static const seedItineraryId = 'REPLACE_WITH_STAGING_UUID';
  static const seedEventId = 'REPLACE_WITH_STAGING_UUID';
  static const seedExperienceId = 'REPLACE_WITH_STAGING_UUID';
  static const seedCreatorId = 'REPLACE_WITH_STAGING_UUID';
  static const seedCreatorUsername = 'e2e_creator';

  // Seed experience must have capacity=2 for the "Sold Out" scenario.
  static const seedExperienceCapacity = 2;

  // ── Pre-seeded booking IDs ─────────────────────────────────────
  // seedBookingId        — a confirmed booking in the future (cancellable)
  // seedCompletedBookingId — a booking for an experience that has passed
  static const seedBookingId = 'REPLACE_WITH_STAGING_UUID';
  static const seedCompletedBookingId = 'REPLACE_WITH_STAGING_UUID';

  // ── Razorpay test UPI ─────────────────────────────────────────
  static const razorpaySuccessUpi = 'success@razorpay';
}
