@feed
Feature: Home Feed
  As an authenticated user
  I want to see relevant content on my home feed
  So that I can discover experiences and stories

  Background:
    Given the app is launched
    And I am logged in as traveler
    And I am on the home feed

  @smoke @critical
  Scenario: Home feed shows all main content sections
    Then I should see the "Near You" section
    And I should see the "Travel" section
    And I should see the "Stories" section
    And I should see the "Discover Creators" section

  @filter
  Scenario: Filtering by Travel vertical shows only travel content
    When I tap the "Travel" filter chip
    Then I should not see the "Stories" section
    And all visible content cards should be tagged "Travel"

  @filter
  Scenario: Filtering by Stories vertical shows only stories content
    When I tap the "Stories" filter chip
    Then I should not see the "Travel" section
    And all visible content cards should be tagged "Stories"

  @filter
  Scenario: Selecting All filter shows all sections again
    When I tap the "Travel" filter chip
    And I tap the "All" filter chip
    Then I should see the "Near You" section
    And I should see the "Travel" section
    And I should see the "Stories" section

  @nearyou
  Scenario: Near You section shows location-based content
    When I allow location permission
    And I pull down to refresh the feed
    Then the "Near You" section should contain at least 1 card
    And each Near You card should show a distance label

  @scroll
  Scenario: User can scroll through the full feed without crash
    When I scroll down to the end of the feed
    Then I should see the "honesty footer" note
    And the app should not have crashed
