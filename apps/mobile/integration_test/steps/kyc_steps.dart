import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/kyc/screens/kyc_status_screen.dart';
import 'package:creatorhub/features/kyc/screens/kyc_wizard_screen.dart';
import '../support/finders.dart';

// ── KYC preconditions ─────────────────────────────────────────────

/// Navigate to the KYC wizard at step 1 (PAN Card Details).
/// Maps to: "Given I am on the KYC wizard at step 1".
///
/// AppButton wraps its label in IgnorePointer, so `$('Start KYC').tap()`
/// fails Patrol's hit-test. Use `tester.tap(find.text(...))` to dispatch
/// the tap to the underlying GestureDetector(opaque).
Future<void> givenIAmOnKycWizardStep1(PatrolIntegrationTester $) async {
  await $('Studio').tap();
  await $.tester.pumpAndSettle();
  await $('Complete KYC').tap();
  await $.tester.pumpAndSettle();
  await $(KycStatusScreen).waitUntilVisible();

  // Poll for the Start KYC label without hit-test (FutureProvider needs to
  // resolve before _NoneView renders).
  for (var i = 0; i < 30; i++) {
    if (find.text('Start KYC').evaluate().isNotEmpty) break;
    await Future.delayed(const Duration(milliseconds: 500));
    await $.tester.pump(const Duration(milliseconds: 200));
  }
  await $.tester.tap(find.text('Start KYC'), warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 500));
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
///
/// UI field: AppInput with label 'PAN Number' and hint 'ABCDE1234F'.
/// AppInput renders the label as a sibling of the TextField, so resolve
/// via the shared [findInputByLabel] helper.
Future<void> whenIEnterPan(PatrolIntegrationTester $, String pan) async {
  await $.tester.enterText(findInputByLabel('PAN Number'), pan);
  await $.tester.pumpAndSettle();
}

/// Clear the PAN field.
/// Maps to: "When I clear the PAN field".
Future<void> whenIClearPanField(PatrolIntegrationTester $) async {
  final field = findInputByLabel('PAN Number');
  final editable = $.tester.widget<EditableText>(
    find.descendant(of: field, matching: find.byType(EditableText)),
  );
  editable.controller.clear();
  await $.tester.pumpAndSettle();
}

/// Assert a PAN format error message is NOT visible.
/// Maps to: "Then I should not see a PAN format error".
///
/// Actual UI error text: 'Invalid PAN format (e.g. ABCDE1234F)'.
Future<void> thenIShouldNotSeePanFormatError(PatrolIntegrationTester $) async {
  expect(find.text('Invalid PAN format (e.g. ABCDE1234F)'), findsNothing);
}

/// Enter the PAN holder's name (step 1 second field).
/// Maps to: "When I enter PAN name {string}".
///
/// UI field: AppInput with label 'Name on PAN Card' and hint 'Full name as on card'.
Future<void> whenIEnterPanName(
  PatrolIntegrationTester $,
  String name,
) async {
  await $.tester.enterText(findInputByLabel('Name on PAN Card'), name);
  await $.tester.pumpAndSettle();
}

/// Tap the "Upload PAN Document" button. With the dart-define
/// `CH_E2E_STUB_UPLOADS=true`, this short-circuits the native gallery
/// picker and sets a stub URL directly on the wizard state.
/// Maps to: "When I tap Upload PAN Document".
Future<void> whenITapUploadPanDocument(PatrolIntegrationTester $) async {
  await $('Upload PAN Document').tap();
  await $.tester.pumpAndSettle();
}

// ── Step 2: Aadhaar ───────────────────────────────────────────────

/// Enter the last 4 digits of Aadhaar (step 2 only field).
/// Maps to: "When I enter Aadhaar last 4 digits {string}".
Future<void> whenIEnterAadhaarLast4(
  PatrolIntegrationTester $,
  String digits,
) async {
  await $.tester.enterText(
    findInputByLabel('Last 4 digits of Aadhaar'),
    digits,
  );
  await $.tester.pumpAndSettle();
}

// ── Step 3: Bank ──────────────────────────────────────────────────

/// Enter a bank account number.
/// Maps to: "When I enter account number {string}".
Future<void> whenIEnterAccountNumber(
  PatrolIntegrationTester $,
  String account,
) async {
  await $.tester.enterText(findInputByLabel('Account Number'), account);
  await $.tester.pumpAndSettle();
}

/// Enter an IFSC code.
/// Maps to: "When I enter IFSC code {string}".
Future<void> whenIEnterIfscCode(PatrolIntegrationTester $, String ifsc) async {
  await $.tester.enterText(findInputByLabel('IFSC Code'), ifsc);
  await $.tester.pumpAndSettle();
}

/// Enter a bank name.
/// Maps to: "When I enter bank name {string}".
Future<void> whenIEnterBankName(
  PatrolIntegrationTester $,
  String bank,
) async {
  await $.tester.enterText(findInputByLabel('Bank Name'), bank);
  await $.tester.pumpAndSettle();
}

// ── Step 4: Selfie ────────────────────────────────────────────────

/// Tap the "Tap to open camera" button for selfie capture. With the
/// dart-define `CH_E2E_STUB_UPLOADS=true`, this short-circuits the
/// native camera and sets a stub selfie URL directly.
/// Maps to: "When I tap capture selfie".
Future<void> whenITapCaptureSelfie(PatrolIntegrationTester $) async {
  await $('Tap to open camera').tap();
  await $.tester.pumpAndSettle();
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
