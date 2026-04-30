@header @web
Feature: Header chrome
  The guest header should signal "creator platform" without overwhelming
  the visitor — one of every action and no redundancy.

  Background:
    Given I am browsing as a guest
    And I am on the home page

  @smoke @critical
  Scenario: Guest header has exactly one of each CTA
    Then the header should have a search icon linking to "/discover"
    And the header should have exactly 1 "Publish" button
    And the header should have exactly 1 "Sign in" button
    And the header should have exactly 1 "Join" button
    And the header should not contain a wide search-pill text "Search creators, places, trips"
    And the header should not contain a "Browse" text link
    And the header should not contain a "For creators" text link

  @smoke
  Scenario: Publish button routes guests through signup
    When I click the "Publish" button in the header
    Then the URL should be "/signup?next=/publish"

  @smoke
  Scenario: Search icon goes to /discover
    When I click the search icon in the header
    Then the URL should be "/discover"
