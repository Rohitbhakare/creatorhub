@saved
Feature: Saved Lists (Wishlists)
  As an authenticated user
  I want to organise saved content into lists
  So that I can revisit curated collections

  Background:
    Given the app is launched
    And I am logged in as traveler

  @smoke @critical
  Scenario: User saves content to a new list and views the list
    Given I am on the post detail screen for the seed post
    When I tap the save button
    And I tap "New list"
    And I enter list name "Trip Ideas — E2E"
    And I tap "Create"
    And I tap "Done"
    Then the save button should appear active
    When I navigate to saved lists from the "You" tab
    Then I should see "Trip Ideas — E2E" in my lists
    When I tap "Trip Ideas — E2E"
    Then I should be on the saved list detail screen
    And I should see the saved post in the list

  @saved @remove
  Scenario: User removes an item from a saved list
    Given I have a saved list "My Places" with the seed post
    When I navigate to saved lists from the "You" tab
    And I tap "My Places"
    Then I should be on the saved list detail screen
    And I should see the seed post
    When I long press the seed post card
    And I tap "Remove from list"
    Then the seed post should no longer appear in the list
    And the list item count should decrease by 1

  @saved @delete_list
  Scenario: User deletes an empty saved list
    Given I have an empty saved list "To Delete — E2E"
    When I navigate to saved lists from the "You" tab
    And I long press "To Delete — E2E"
    And I tap "Delete list"
    And I confirm deletion
    Then "To Delete — E2E" should not appear in my lists
