@copy @web
Feature: Brand positioning copy
  CreatorHub is a platform for creators of every kind. The product
  surface should not read as a travel-only app. Travel is the launch
  niche, not the whole identity.

  Background:
    Given I am browsing as a guest

  @smoke @critical
  Scenario: Home greeting is content-type agnostic
    When I visit the home page
    Then the visible body should not contain "Travel stories worth saving"
    And the visible body should not contain "Travel plans worth booking"
    And the visible body should contain "Stories, plans, and live moments"

  @smoke
  Scenario: Creator-acquisition band uses broader copy
    When I visit the home page
    Then the visible body should contain "Build your creator business"
    And the visible body should not contain "Earn from your travel stories"

  @smoke @critical
  Scenario: /creators landing is content-type agnostic
    When I visit "/creators"
    Then the page should respond with status 200
    And the visible body should contain "Build your creator business"
    And the visible body should not contain "platform for India's travel creators"
    And the visible body should contain "Who is this for"

  @smoke @critical
  Scenario: Onboarding sub-categories does not read as travel-only
    When I visit "/onboarding/sub-categories"
    Then the visible body should not contain "What kind of travel calls you?"

  @footer
  Scenario: Footer carries the broad tagline
    When I visit the home page
    Then the footer should contain "Where creators build"
    And the footer should not contain "Travel stories worth saving"
    And the footer should contain "Made in Pune"
