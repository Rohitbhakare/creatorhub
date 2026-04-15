@profile
Feature: User Profile
  As an authenticated user
  I want to view and manage my profile
  So that other users can discover and follow me

  Background:
    Given the app is launched
    And I am logged in as traveler

  @smoke @critical
  Scenario: User views their own profile on the You tab
    When I tap the "You" tab
    Then I should be on the profile screen
    And I should see my display name
    And I should see my follower count
    And I should see my following count
    And I should see "Edit Profile" button

  @profile @edit
  Scenario: User updates their display name
    When I tap the "You" tab
    And I tap "Edit Profile"
    Then I should be on the edit profile screen
    When I clear the display name field
    And I enter display name "E2E Updated Name"
    And I tap "Save"
    Then I should be on the profile screen
    And I should see "E2E Updated Name"

  @profile @other_user
  Scenario: User views another creator's public profile
    Given I am on the post detail screen for the seed post
    When I tap the creator name in the header
    Then I should be on a creator profile page
    And I should see the creator's display name
    And I should see their published content list
    And I should see the "Follow" button
    And I should not see "Edit Profile"
