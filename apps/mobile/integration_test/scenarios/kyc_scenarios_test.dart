// @kyc — F11: KYC Verification Flow
//
// Run with: patrol test --target integration_test/scenarios/kyc_scenarios.dart

import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/kyc_steps.dart';
import '../steps/navigation_steps.dart';

void kycScenarios() {
  // ── F11-S01: Creator sees KYC status and starts wizard ───────────────────
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
      await whenITap($, 'Start Verification');
      await thenIShouldBeOnKycWizard($);
      await thenIShouldBeOnKycStep($, 1, 'PAN Details');
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
      await thenIShouldSee($, 'Invalid PAN format. Expected: AAAAA9999A');

      // Correct format — should proceed
      await whenIClearPanField($);
      await whenIEnterPan($, 'ABCDE1234F');
      await whenITap($, 'Next');
      await thenIShouldNotSeePanFormatError($);
    },
  );

  // ── F11-S03: Full KYC flow — all 5 steps ─────────────────────────────────
  //
  // Tagged @slow — takes 30-60 seconds end-to-end.
  patrolTest(
    'F11-S03: Creator completes all 5 KYC steps and reaches pending review',
    tags: ['kyc', 'full_flow', 'slow'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsUnkycCreator($);
      await givenIAmOnKycWizardStep1($);

      // Step 1: PAN
      await whenIEnterPan($, 'ABCDE1234F');
      await whenITap($, 'Next');
      await thenIShouldBeOnKycStep($, 2, 'Aadhaar Details');

      // Step 2: Aadhaar
      await whenIEnterAadhaarNumber($, '1234 5678 9012');
      await whenITapSendAadhaarOtp($);
      await whenIEnterAadhaarOtp($, '123456');
      await whenITap($, 'Next');
      await thenIShouldBeOnKycStep($, 3, 'Bank Account');

      // Step 3: Bank
      await whenIEnterAccountNumber($, '1234567890');
      await whenIEnterIfscCode($, 'HDFC0001234');
      await whenITapVerifyBank($);
      await whenITap($, 'Next');
      await thenIShouldBeOnKycStep($, 4, 'Selfie Verification');

      // Step 4: Selfie
      await whenIGrantCameraPermission($);
      await whenITap($, 'Take Selfie');
      await whenSelfieCapture($);
      await whenITap($, 'Next');
      await thenIShouldBeOnKycStep($, 5, 'Review & Submit');

      // Step 5: Submit
      await thenIShouldSeeAllSubmittedDetails($);
      await whenITap($, 'Submit for Review');

      await thenIShouldBeOnKycStatusScreen($);
      await thenIShouldSeeKycStatusUnderReview($);
      await thenIShouldSee($, 'We\'ll notify you within 2 business days');
    },
  );

  // ── F11-S04: Non-KYC creator cannot publish paid experience ──────────────
  patrolTest(
    'F11-S04: Non-KYC creator cannot publish a paid experience',
    tags: ['kyc', 'blocked', 'paid_content'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsUnkycCreator($);

      // Try to publish a paid experience — should hit KYC gate
      await whenITap($, 'Create');
      await whenITap($, 'Experience');
      // Fill in some details...
      await whenITap($, 'Publish');

      await thenIShouldSeeKycGateModal($);
      await thenIShouldSee($, 'Paid experiences require identity verification');
      await whenITap($, 'Complete KYC');
      await thenIShouldBeOnKycStatusScreen($);
    },
  );
}

void main() => kycScenarios();
