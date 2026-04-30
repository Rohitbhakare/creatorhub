@cta @web
Feature: Join CTA discipline
  Guests should never see more than one or two Join-flavoured CTAs in
  a single viewport — the header carries the primary one, contextual
  nudges live in the right rail / end-of-article and stay quieter.

  Background:
    Given I am browsing as a guest

  @smoke @critical
  Scenario: Home page shows at most 1 visible "Join" button
    When I visit the home page
    Then there should be exactly 1 visible "Join" button
    And there should not be a "Join free" pink button next to the hero greeting

  @smoke
  Scenario: Right rail shows a quiet "Create a free account" link
    When I visit the home page
    Then the right rail should contain "Create a free account"
    And the right rail should not contain a "Join free" primary button paired with a "Sign in" ghost button
