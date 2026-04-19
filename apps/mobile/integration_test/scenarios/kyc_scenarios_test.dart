// @kyc — F11: KYC Verification Flow
//
// Run with: patrol test --target integration_test/scenarios/kyc_scenarios_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/kyc_steps.dart';
import '../steps/navigation_steps.dart';

void kycScenarios() {
  // ── F11-S01: Creator sees KYC status and starts wizard ───────────────────
  //
  // UI anchors:
  //   Studio → 'Complete KYC' alert → KycStatusScreen with 'Start KYC' CTA
  //   → KycWizardScreen shows 'PAN Card Details' heading on step 1.
  patrolTest(
    'F11-S01: Creator sees KYC status screen and starts the verification wizard',
    tags: ['kyc', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsUnkycCreator($);

      await whenITapTheTab($, 'Studio');
      await whenITap($, 'Complete KYC');
      await thenIShouldBeOnKycStatusScreen($);
      await thenIShouldSeeKycStatusNotStarted($);
      await thenIShouldSee5StepProgressIndicator($);
      await whenITap($, 'Start KYC');
      await thenIShouldBeOnKycWizard($);
      await thenIShouldBeOnKycStep($, 1, 'PAN Card Details');
    },
  );

  // ── F11-S02: PAN validation rejects invalid formats ──────────────────────
  patrolTest(
    'F11-S02: PAN validation rejects invalid formats',
    tags: ['kyc', 'validation', 'pan'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsUnkycCreator($);
      await givenIAmOnKycWizardStep1($);

      // Too short — invalid
      await whenIEnterPan($, 'ABCDE1234');
      await whenITap($, 'Next');
      await thenIShouldSee($, 'Invalid PAN format (e.g. ABCDE1234F)');

      // Correct format — should proceed
      await whenIClearPanField($);
      await whenIEnterPan($, 'ABCDE1234F');
      await whenITap($, 'Next');
      await thenIShouldNotSeePanFormatError($);
    },
  );

  // ── F11-S03: Full KYC flow — all 5 steps ─────────────────────────────────
  //
  // Requires launching the Patrol binary with
  //   --dart-define=CH_E2E_STUB_UPLOADS=true
  // which short-circuits the three native pickers (PAN doc, Aadhaar doc,
  // selfie camera) to stub Firebase Storage URLs. Without this flag,
  // tapping the upload/capture buttons opens the OS picker and blocks.
  patrolTest(
    'F11-S03: Creator completes all 5 KYC steps and reaches pending review',
    tags: ['kyc', 'full_flow', 'slow'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsUnkycCreator($);
      await givenIAmOnKycWizardStep1($);

      // Step 1 — PAN
      await whenIEnterPan($, 'ABCDE1234F');
      await whenIEnterPanName($, 'Test Creator');
      await whenITapUploadPanDocument($);
      await whenITap($, 'Next');

      // Step 2 — Aadhaar (last 4 digits only)
      await whenIEnterAadhaarLast4($, '1234');
      await whenITap($, 'Next');

      // Step 3 — Bank
      await whenIEnterAccountNumber($, '1234567890');
      await whenIEnterIfscCode($, 'SBIN0001234');
      await whenIEnterBankName($, 'State Bank of India');
      await whenITap($, 'Next');

      // Step 4 — Selfie (camera capture stubbed)
      await whenITapCaptureSelfie($);
      await whenITap($, 'Save & Continue');

      // Step 5 — Review & Submit
      await whenITap($, 'Submit for Review');
      await thenIShouldSee($, 'Documents Submitted!');
    },
  );

  // ── F11-S04: Non-KYC creator cannot publish paid experience ──────────────
  //
  // SKIPPED: Experience wizard has placeholder Details/Media steps (see
  // wizard_shell_screen._buildExperienceStep), so the publish path cannot be
  // exercised end-to-end. Will re-enable once the experience wizard ships.
  patrolTest(
    'F11-S04: Non-KYC creator cannot publish a paid experience',
    tags: ['kyc', 'blocked', 'paid_content'],
    ($) async {
      markTestSkipped(
        'Deferred: experience wizard has placeholder Details/Media steps; '
        'paid-publish KYC gate cannot be exercised until wizard is complete.',
      );
    },
  );
}

void main() => kycScenarios();
