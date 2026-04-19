/// Stable test credentials and seed content IDs for the staging environment.
///
/// Both phones are registered in Firebase Console →
/// Authentication → Sign-in method → Phone → Test phone numbers.
/// OTP is always [testOtp] — no real SMS is sent.
///
/// Persona mapping (single phone can hold different roles depending on DB state):
///   9090909090 → traveler (onboarding done, no content, no kyc)
///   9090909090 → booker   (same account — traveler can book)
///   7588005893 → creator  (is_creator = true, kyc_status = approved)
///   7588005893 → unkyc    (same phone — reset kyc_status in DB for this persona)
///
/// All seed content IDs come from migration 016_e2e_seed.sql which must be
/// applied to staging before running E2E tests.
abstract final class TestData {
  // ── Test OTP (fixed for both test phone numbers) ─────────────────
  static const testOtp = '123456';

  // ── Primary test phone numbers (registered in Firebase) ──────────
  static const testPhone = '9090909090';        // traveler (onboarding done)
  static const creatorTestPhone = '7588005893'; // creator (KYC verified)
  static const newUserTestPhone = '9999999999'; // always reset to new user state

  // ── Persona-specific phone numbers (overrideable via --dart-define) ─
  static String get travelerPhone =>
      const String.fromEnvironment('TEST_TRAVELER_PHONE',
          defaultValue: testPhone);

  static String get creatorPhone =>
      const String.fromEnvironment('TEST_CREATOR_PHONE',
          defaultValue: creatorTestPhone);

  static String get unKycPhone =>
      const String.fromEnvironment('TEST_UNKYC_PHONE',
          defaultValue: creatorTestPhone);

  static String get bookerPhone =>
      const String.fromEnvironment('TEST_BOOKER_PHONE',
          defaultValue: testPhone);

  /// Phone for "new user" scenarios — always deleted before the test so
  /// it registers fresh. Not seeded — has no onboarding_completed_at.
  static String get newUserPhone =>
      const String.fromEnvironment('TEST_NEW_USER_PHONE',
          defaultValue: newUserTestPhone);

  // ── Test user IDs (from migration 016_e2e_seed.sql) ──────────────
  // User for phone 9090909090 (traveler / booker persona)
  static const travelerUserId = 'e2e00000-0000-0000-0000-000000000001';
  // User for phone 7588005893 (creator / unkyc persona)
  static const creatorUserId = 'e2e00000-0000-0000-0000-000000000002';

  // ── Pre-seeded content IDs (from seed_content.sql + 016_e2e_seed.sql) ─
  // These IDs are baked into the SQL — deterministic, no lookup needed.

  // Seed post — "Dawn at Pangong Lake" by E2E Creator (016_e2e_seed.sql)
  // Using the e2e-owned post so it is guaranteed present without seed_content.sql.
  // UUID uses valid hex only: e2e0000a-...
  static const seedPostId = 'e2e0000a-0000-0000-0000-000000000001';

  // Seed itinerary — "Manali to Spiti Valley — 7 Day Road Trip"
  static const seedItineraryId = 'c0000002-0002-0002-0002-000000000001';

  // Seed event — "Heritage Walk: Hidden Temples of Old Delhi"
  static const seedEventId = 'c0000003-0003-0003-0003-000000000001';

  // Seed experience — "Sunrise Photography Walk, Jaipur" (paid, ₹1,500)
  // Created in migration 016_e2e_seed.sql by creator a6666666
  // UUID uses valid hex only: e2e0000b-...
  static const seedExperienceId = 'e2e0000b-0000-0000-0000-000000000001';

  // Seed creator — Vikram Singh (hosts the seed experience)
  static const seedCreatorId = 'a6666666-6666-6666-6666-666666666666';
  static const seedCreatorUsername = 'vikramsingh';

  // Seed experience capacity (2 → "Sold Out" scenario fills it easily)
  static const seedExperienceCapacity = 2;

  // ── Pre-seeded booking IDs (from 016_e2e_seed.sql) ───────────────
  // A confirmed future booking owned by the traveler/booker user
  // UUID uses valid hex only: e2e0000d-...
  static const seedBookingId = 'e2e0000d-0000-0000-0000-000000000001';
  // A completed booking (experience date is in the past)
  static const seedCompletedBookingId = 'e2e0000d-0000-0000-0000-000000000002';

  // ── Razorpay test UPI ─────────────────────────────────────────────
  static const razorpaySuccessUpi = 'success@razorpay';
}
