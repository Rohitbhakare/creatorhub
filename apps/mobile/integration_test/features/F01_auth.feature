@auth
Feature: Authentication
  As a user
  I want to sign in or browse as a guest
  So that I can access CreatorHub content

  Background:
    Given the app is launched
    And I am not logged in

  @smoke @critical
  Scenario: New user registers via phone OTP and reaches onboarding
    When I tap "Get Started"
    And I enter my phone number "+919000001001"
    And I tap "Send OTP"
    And I enter OTP "123456"
    And I tap "Verify"
    Then I should be on the "onboarding location" screen

  @smoke @critical
  Scenario: Returning user logs in and reaches home feed
    Given I have previously completed onboarding
    When I tap "Get Started"
    And I enter my phone number "+919000001001"
    And I tap "Send OTP"
    And I enter OTP "123456"
    And I tap "Verify"
    Then I should see the home feed

  @guest
  Scenario: User continues as guest and sees home feed
    When I tap "Continue as guest"
    Then I should see the home feed
    And the "Studio" tab should be visible

  @guest @softwall
  Scenario: Guest sees soft auth wall when tapping Like
    When I tap "Continue as guest"
    And I tap the first post in the feed
    And I tap the like button
    Then I should see "Sign in to like"
    And I should see "Get Started"
