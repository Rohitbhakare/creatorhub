@social
Feature: Social Interactions
  As an authenticated user
  I want to interact with content and creators
  So that I can engage with the community

  Background:
    Given the app is launched
    And I am logged in as traveler
    And I am on the post detail screen for the seed post

  @smoke @critical
  Scenario: Authenticated user likes a post and like count increases
    Given the post is not liked
    And the like count is recorded
    When I tap the like button
    Then the like button should appear active
    And the like count should be 1 more than before

  @like @toggle
  Scenario: User can unlike a post by tapping like again
    Given the post is liked
    When I tap the like button
    Then the like button should appear inactive

  @save @critical
  Scenario: User saves content to an existing list
    When I tap the save button
    Then I should see the "Save to list" bottom sheet
    And I should see at least one list option
    When I tap the first list option
    And I tap "Done"
    Then the save button should appear active

  @save @newlist
  Scenario: User saves content to a new list
    When I tap the save button
    Then I should see the "Save to list" bottom sheet
    When I tap "New list"
    And I enter list name "Bucket List"
    And I tap "Create"
    Then I should see "Bucket List" in the list options
    When I tap "Done"
    Then the save button should appear active

  @follow @critical
  Scenario: User follows a creator from their post detail
    Given I am not following the post creator
    When I tap the "Follow" button in the creator header
    Then the button should show "Following"
    And the follow count on the creator profile should increase

  @share
  Scenario: User taps share and sees platform share options
    When I tap the share button
    Then I should see the share bottom sheet
    And I should see "WhatsApp" as the first share option
    And I should see "Copy link" option
