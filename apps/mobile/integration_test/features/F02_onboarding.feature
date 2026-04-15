@onboarding
Feature: Onboarding Flow
  As a newly registered user
  I want to complete the 5-step onboarding
  So that the app is personalised to my interests

  Background:
    Given the app is launched
    And I am logged in as a new user with phone "+919000001005"

  @smoke @critical
  Scenario: Newly registered user completes full onboarding flow
    Then I should be on the "onboarding location" screen
    When I allow location permission
    And I tap "Continue"
    Then I should be on the "vertical picker" screen
    When I select the "Travel" vertical
    And I select the "Stories" vertical
    And I tap "Continue"
    Then I should be on the "suggested creators" screen
    When I tap "Follow" for the first suggested creator
    And I tap "Continue"
    Then I should be on the "celebration" screen
    And I should see "You're all set"
    When I tap "Explore CreatorHub"
    Then I should see the home feed

  @onboarding @skip_creators
  Scenario: User skips creator suggestions during onboarding
    Then I should be on the "onboarding location" screen
    When I tap "Skip" for location
    Then I should be on the "vertical picker" screen
    When I tap "Continue"
    Then I should be on the "suggested creators" screen
    When I tap "Skip"
    Then I should be on the "celebration" screen
    And I should see "You're all set"

  @onboarding @location
  Scenario: User manually selects a city when GPS is denied
    Then I should be on the "onboarding location" screen
    When I deny location permission
    And I search for city "Mumbai"
    And I tap "Mumbai, Maharashtra"
    And I tap "Continue"
    Then I should be on the "vertical picker" screen
