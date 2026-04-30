@guest @web
Feature: Guest browsing
  As a logged-out visitor
  I want to read everything that's public
  So I can decide whether to sign up

  Background:
    Given I am browsing as a guest

  @smoke @critical
  Scenario: Home loads with editorial intro and feed
    When I visit the home page
    Then the page should respond with status 200
    And I should see the brand "creatorhub"
    And the hero should not contain travel-only language
    And I should see the creator-acquisition band

  @smoke @critical
  Scenario: Discover page is reachable + searchable
    When I visit the discover page
    Then the page should respond with status 200
    And I should see the heading "Find your next"

  @smoke
  Scenario: Content detail page renders for a guest
    When I visit the content detail page for "content-001"
    Then the page should respond with status 200
    And I should see the comments header
    And I should see the "Sign in to comment" stub

  @smoke
  Scenario: Creator mini-site shows trust strip + 6-newest gate
    When I visit the creator profile "testcreator"
    Then the page should respond with status 200
    And I should see "KYC verified"
    And I should see "Refund guaranteed"

  @seo
  Scenario: Robots and sitemap are reachable
    When I fetch "/sitemap.xml"
    Then the response status should be 200
    And the response body should contain "<urlset"
    When I fetch "/robots.txt"
    Then the response status should be 200
    And the response body should contain "Sitemap:"
