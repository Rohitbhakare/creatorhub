@creation
Feature: Content Creation
  As an authenticated creator
  I want to create and publish content
  So that I can share my travel experiences

  Background:
    Given the app is launched

  @smoke @critical
  Scenario: Creator creates and publishes a text post
    Given I am logged in as creator
    And I am on the home feed
    When I tap the "Create+" tab
    Then I should see the content type picker
    When I tap "Post"
    Then I should be on the post creation wizard
    When I enter title "E2E Test Post — Leh Ladakh"
    And I enter body text "The mountains were absolutely breathtaking. A journey worth every rupee."
    And I tap "Next"
    And I tap "Publish"
    Then I should see "Post published!"
    And I should be redirected to my post detail page
    And the post should show title "E2E Test Post — Leh Ladakh"

  @creation @itinerary
  Scenario: Creator creates an itinerary with one spot
    Given I am logged in as creator
    And I am on the home feed
    When I tap the "Create+" tab
    And I tap "Itinerary"
    Then I should be on the itinerary creation wizard
    When I enter title "Golden Triangle — E2E Test"
    And I tap "Add spot"
    And I search for place "Taj Mahal, Agra"
    And I select the first place result
    And I enter spot note "Arrive at sunrise for the best light"
    And I tap "Save spot"
    And I tap "Next"
    And I tap "Publish"
    Then I should see "Itinerary published!"
    And the itinerary should show "1 spot"

  @creation @event
  Scenario: Creator creates a free event
    Given I am logged in as creator
    And I am on the home feed
    When I tap the "Create+" tab
    And I tap "Event"
    Then I should be on the event creation wizard
    When I enter title "Sunset Hike Meetup — E2E"
    And I enter venue name "Sanjay Gandhi National Park, Mumbai"
    And I set event date to tomorrow
    And I set start time to "07:00 AM"
    And I set end time to "09:00 AM"
    And I set capacity to "20"
    And I tap "Publish"
    Then I should see "Event published!"
    And the event should show "0 going / 20 max"

  @creation @guest @redirect
  Scenario: Guest is redirected to auth screen when tapping Create+
    Given I am not logged in
    When I tap "Continue as guest"
    And I am on the home feed
    And I tap the "Create+" tab
    Then I should be on the "auth" screen
    And I should see "Get Started"
