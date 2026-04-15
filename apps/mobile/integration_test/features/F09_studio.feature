@studio
Feature: Creator Studio
  As a creator
  I want to see my content performance and earnings in the Studio tab
  So that I can manage my creator business

  Background:
    Given the app is launched
    And I am logged in as creator

  @smoke @critical
  Scenario: Creator views the Studio tab with published content
    When I tap the "Studio" tab
    Then I should be on the studio screen
    And I should see the alert hero section
    And I should see the stats strip with views, likes, and followers
    And I should see the content list with at least 1 published item
    And I should see the earnings card

  @studio @content_list
  Scenario: Creator can see all content types in the studio content list
    When I tap the "Studio" tab
    Then I should see at least one "POST" item in the content list
    And each content item should show its title, type badge, and publish date
    When I tap the first content item
    Then I should be on that content's detail screen

  @studio @empty
  Scenario: New creator sees empty state in Studio tab
    Given I am logged in as a new creator with no content
    When I tap the "Studio" tab
    Then I should see the studio empty state
    And I should see "Create your first post" prompt
    And I should see the "Create+" button
