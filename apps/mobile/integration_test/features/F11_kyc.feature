@kyc
Feature: KYC Verification Flow
  As a creator who wants to publish paid content
  I want to complete KYC verification
  So that I can receive payouts from bookings

  Background:
    Given the app is launched
    And I am logged in as unkyc creator

  @smoke @critical
  Scenario: Creator sees KYC status screen and starts the verification wizard
    When I tap the "Studio" tab
    And I tap "Complete KYC" in the alert hero
    Then I should be on the KYC status screen
    And I should see "Not Started" status
    And I should see a 5-step progress indicator
    When I tap "Start Verification"
    Then I should be on the KYC wizard
    And I should be on step 1 "PAN Details"

  @kyc @validation @pan
  Scenario: PAN validation rejects invalid formats
    Given I am on the KYC wizard at step 1
    When I enter PAN "ABCDE1234"
    And I tap "Next"
    Then I should see the error "Invalid PAN format. Expected: AAAAA9999A"
    When I clear the PAN field
    And I enter PAN "ABCDE1234F"
    And I tap "Next"
    Then I should not see a PAN format error

  @kyc @full_flow @slow
  Scenario: Creator completes all 5 KYC steps and reaches pending review state
    Given I am on the KYC wizard at step 1
    When I enter PAN "ABCDE1234F"
    And I tap "Next"
    Then I should be on step 2 "Aadhaar Details"
    When I enter Aadhaar number "1234 5678 9012"
    And I tap "Send OTP to Aadhaar-linked mobile"
    And I enter Aadhaar OTP "123456"
    And I tap "Next"
    Then I should be on step 3 "Bank Account"
    When I enter account number "1234567890"
    And I enter IFSC code "HDFC0001234"
    And I tap "Verify Bank"
    And I tap "Next"
    Then I should be on step 4 "Selfie Verification"
    When I grant camera permission
    And I tap "Take Selfie"
    And the selfie capture completes
    And I tap "Next"
    Then I should be on step 5 "Review & Submit"
    And I should see all 4 submitted details listed
    When I tap "Submit for Review"
    Then I should be on the KYC status screen
    And I should see status "Under Review"
    And I should see "We'll notify you within 2 business days"

  @kyc @blocked @paid_content
  Scenario: Non-KYC creator cannot publish a paid experience
    Given I am logged in as creator without KYC
    And I am creating a paid experience with price "₹2,500"
    When I tap "Publish"
    Then I should see the "Complete KYC to publish" modal
    And I should see "Paid experiences require identity verification"
    And I should see "Complete KYC" button
    When I tap "Complete KYC"
    Then I should be on the KYC status screen
