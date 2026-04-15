@discovery
Feature: Content Discovery
  As a user browsing the feed
  I want to open content detail pages
  So that I can read full content and take action

  Background:
    Given the app is launched
    And I am logged in as traveler
    And I am on the home feed

  @smoke @critical
  Scenario: User opens a post detail page from the feed
    When I tap the first post card in the feed
    Then I should be on the post detail screen
    And I should see the "POST" badge
    And I should see the post title
    And I should see the creator name
    And I should see the "Follow" button in the creator header
    And I should see the engagement bar with like, comment, share, save buttons

  @smoke
  Scenario: User opens an itinerary detail page from the feed
    When I tap the first itinerary card in the feed
    Then I should be on the itinerary detail screen
    And I should see the "ITINERARY" badge
    And I should see the day count
    And I should see the spot count
    And I should see the map section

  @smoke
  Scenario: User opens an event detail page from the feed
    When I tap the first event card in the feed
    Then I should be on the event detail screen
    And I should see the event title
    And I should see the event date and time
    And I should see the venue name
    And I should see the "RSVP" button or "Going" count

  @smoke
  Scenario: User opens a paid experience detail page from the feed
    When I tap the first experience card in the feed
    Then I should be on the experience detail screen
    And I should see the price formatted as "₹"
    And I should see the duration
    And I should see the "Book Now" button

  @navigation
  Scenario: Back navigation from detail page returns to feed
    When I tap the first post card in the feed
    Then I should be on the post detail screen
    When I navigate back
    Then I should see the home feed
    And the scroll position should be restored
