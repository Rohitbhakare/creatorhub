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

      // 10 chars but wrong format (digits where letters expected) — invalid.
      // 9-char inputs trigger "PAN must be 10 characters" instead.
      await whenIEnterPan($, '1234567890');
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
  // SKIPPED: API submitKyc service writes flat columns (user_id, pan_number,
  // aadhaar_last4, bank_account, pan_doc_url) but the deployed kyc_submissions
  // schema requires hashed/encrypted shapes (creator_id, pan_number_hash,
  // aadhaar_number_hash, bank_account_number_encrypted, pan_photo_url) plus
  // additional NOT NULL columns the service never sets (aadhaar_name,
  // aadhaar_front_url, aadhaar_back_url, bank_account_holder, etc.).
  // Re-enable once the KYC service is rewritten against the real schema.
  patrolTest(
    'F11-S03: Creator completes all 5 KYC steps and reaches pending review',
    tags: ['kyc', 'full_flow', 'slow'],
    ($) async {
      markTestSkipped(
        'Deferred: API kyc.service writes legacy flat columns but the '
        'kyc_submissions table requires hashed/encrypted columns plus '
        'aadhaar_name, aadhaar_front_url, aadhaar_back_url, bank_account_holder. '
        'Submit will 500 until the service is rewritten against the real schema.',
      );
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
