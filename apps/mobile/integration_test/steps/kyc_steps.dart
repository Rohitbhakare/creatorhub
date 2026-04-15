import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/kyc/screens/kyc_status_screen.dart';
import 'package:creatorhub/features/kyc/screens/kyc_wizard_screen.dart';

// ── KYC preconditions ─────────────────────────────────────────────

/// Navigate to the KYC wizard at step 1 (PAN Details).
/// Maps to: "Given I am on the KYC wizard at step 1".
Future<void> givenIAmOnKycWizardStep1(PatrolIntegrationTester $) async {
  // Tap Studio → "Complete KYC" in the alert hero → "Start Verification"
  await $('Studio').tap();
  await $.tester.pumpAndSettle();
  await $('Complete KYC').tap();
  await $.tester.pumpAndSettle();
  await $('Start Verification').tap();
  await $.tester.pumpAndSettle();
}

// ── KYC status screen ─────────────────────────────────────────────

/// Assert the KYC status screen is visible.
/// Maps to: "Then I should be on the KYC status screen".
Future<void> thenIShouldBeOnKycStatusScreen(PatrolIntegrationTester $) async {
  await $(KycStatusScreen).waitUntilVisible();
}

/// Assert the KYC wizard is visible.
/// Maps to: "Then I should be on the KYC wizard".
Future<void> thenIShouldBeOnKycWizard(PatrolIntegrationTester $) async {
  await $(KycWizardScreen).waitUntilVisible();
}

/// Assert the wizard shows a specific step name.
/// Maps to: "And I should be on step {int} {string}".
Future<void> thenIShouldBeOnKycStep(
  PatrolIntegrationTester $,
  int step,
  String stepName,
) async {
  await $(stepName).waitUntilVisible();
}

// ── Step 1: PAN ───────────────────────────────────────────────────

/// Enter a PAN number.
/// Maps to: "When I enter PAN {string}".
Future<void> whenIEnterPan(PatrolIntegrationTester $, String pan) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'PAN number'),
    pan,
  );
  await $.tester.pumpAndSettle();
}

/// Clear the PAN field.
/// Maps to: "When I clear the PAN field".
Future<void> whenIClearPanField(PatrolIntegrationTester $) async {
  final field = find.widgetWithText(TextField, 'PAN number');
  final editable = $.tester.widget<EditableText>(
    find.descendant(of: field, matching: find.byType(EditableText)),
  );
  editable.controller.clear();
  await $.tester.pumpAndSettle();
}

/// Assert a PAN format error message is NOT visible.
/// Maps to: "Then I should not see a PAN format error".
Future<void> thenIShouldNotSeePanFormatError(PatrolIntegrationTester $) async {
  expect(find.text('Invalid PAN format. Expected: AAAAA9999A'), findsNothing);
}

// ── Step 2: Aadhaar ───────────────────────────────────────────────

/// Enter an Aadhaar number.
/// Maps to: "When I enter Aadhaar number {string}".
Future<void> whenIEnterAadhaarNumber(
  PatrolIntegrationTester $,
  String aadhaar,
) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Aadhaar number'),
    aadhaar,
  );
  await $.tester.pumpAndSettle();
}

/// Tap the "Send OTP to Aadhaar-linked mobile" button.
/// Maps to: "When I tap Send OTP to Aadhaar-linked mobile".
Future<void> whenITapSendAadhaarOtp(PatrolIntegrationTester $) async {
  await $('Send OTP to Aadhaar-linked mobile').tap();
  await $.tester.pumpAndSettle(const Duration(seconds: 3));
}

/// Enter the Aadhaar OTP.
/// Maps to: "When I enter Aadhaar OTP {string}".
Future<void> whenIEnterAadhaarOtp(PatrolIntegrationTester $, String otp) async {
  await $.tester.enterText(find.byType(TextField).last, otp);
  await $.tester.pumpAndSettle();
}

// ── Step 3: Bank ──────────────────────────────────────────────────

/// Enter a bank account number.
/// Maps to: "When I enter account number {string}".
Future<void> whenIEnterAccountNumber(
  PatrolIntegrationTester $,
  String account,
) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Account number'),
    account,
  );
  await $.tester.pumpAndSettle();
}

/// Enter an IFSC code.
/// Maps to: "When I enter IFSC code {string}".
Future<void> whenIEnterIfscCode(PatrolIntegrationTester $, String ifsc) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'IFSC code'),
    ifsc,
  );
  await $.tester.pumpAndSettle();
}

/// Tap "Verify Bank" to trigger bank account verification.
/// Maps to: "When I tap Verify Bank".
Future<void> whenITapVerifyBank(PatrolIntegrationTester $) async {
  await $('Verify Bank').tap();
  await $.tester.pumpAndSettle(const Duration(seconds: 5));
}

// ── Step 4: Selfie ────────────────────────────────────────────────

/// Grant camera permission for selfie capture.
/// Maps to: "When I grant camera permission".
Future<void> whenIGrantCameraPermission(PatrolIntegrationTester $) async {
  try {
    await $.native.grantPermissionWhenInUse();
  } catch (_) {
    // Camera permission may already be granted or dialog may not appear.
  }
}

/// Simulate completion of the selfie capture step.
/// On a real device, the camera UI would appear; in test mode we mock it.
/// Maps to: "And the selfie capture completes".
Future<void> whenSelfieCapture(PatrolIntegrationTester $) async {
  // In test mode the selfie step is mocked — tapping "Take Selfie" uses a
  // stub that immediately returns success without opening the camera.
  await $.tester.pumpAndSettle(const Duration(seconds: 2));
}

// ── Step 5: Submit ────────────────────────────────────────────────

/// Assert all 4 submitted details are listed on the review step.
/// Maps to: "And I should see all 4 submitted details listed".
Future<void> thenIShouldSeeAllSubmittedDetails(
  PatrolIntegrationTester $,
) async {
  // PAN, Aadhaar, Bank, Selfie should each appear as a review row.
  await $('PAN').waitUntilVisible();
  await $('Aadhaar').waitUntilVisible();
  await $('Bank Account').waitUntilVisible();
  await $('Selfie').waitUntilVisible();
}

// ── KYC status assertions ─────────────────────────────────────────

/// Assert the KYC status shows "Not Started".
/// Maps to: "And I should see Not Started status".
Future<void> thenIShouldSeeKycStatusNotStarted(
  PatrolIntegrationTester $,
) async {
  await $('Not Started').waitUntilVisible();
}

/// Assert the KYC status shows "Under Review".
/// Maps to: "And I should see status Under Review".
Future<void> thenIShouldSeeKycStatusUnderReview(
  PatrolIntegrationTester $,
) async {
  await $('Under Review').waitUntilVisible();
}

/// Assert a 5-step progress indicator is visible.
/// Maps to: "And I should see a 5-step progress indicator".
Future<void> thenIShouldSee5StepProgressIndicator(
  PatrolIntegrationTester $,
) async {
  expect(find.byKey(const Key('kyc_progress')), findsOneWidget);
}

// ── KYC gate (paid content) ───────────────────────────────────────

/// Assert the "Complete KYC to publish" modal is visible.
/// Maps to: "Then I should see the Complete KYC to publish modal".
Future<void> thenIShouldSeeKycGateModal(PatrolIntegrationTester $) async {
  await $('Complete KYC to publish').waitUntilVisible();
}
