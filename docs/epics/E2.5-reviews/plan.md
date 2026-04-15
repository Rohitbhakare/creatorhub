# E2.5 — Reviews (Blind Review + 14-Day Reveal)

> **SRS refs:** REV-FR-001–003
> **Depends on:** E2.3 (booking must be completed before review)

---

## Market Research — Review UX

### Airbnb (blind review — same as our model)
- **Blind:** Both guest and host write reviews independently. Neither sees the other's until both submit or 14-day deadline passes.
- **Trust builder:** Prevents retaliatory reviews. Both parties review honestly.
- **Reveal animation:** Both reviews appear simultaneously with a "reveal" moment.

### Google Maps / TripAdvisor
- **Simple:** 1-5 stars + text. No blind mechanism. Prone to retaliation.

### CreatorHub Approach (per SRS)
- **Blind reviews per Airbnb model:** After booking completion, both traveller and creator can review. Neither sees the other's until both submit OR 14 days pass.
- **Rating:** 1-5 stars + text (max 2000 chars).
- **Reveal:** After both submit → reveal immediately. After 14 days → auto-reveal whatever exists.
- **Display:** On profile page + content detail page. Average rating computed.
- **Creator response:** After reveal, creator can respond once (no back-and-forth).

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Review schemas (rating, body, blind state) | Shared | — |
| T2 | Review service (submit, reveal logic, list by content/user, response) | API | ~15 |
| T3 | Review reveal cron (14-day auto-reveal) | API | ~5 |
| T4 | Review handlers + routes | API | ~8 |
| T5 | Review submission screen (star picker, text input, blind notice) | Mobile | — |
| T6 | Review display widget (stars, text, creator response) | Mobile | — |
| T7 | Reviews section on detail pages + profiles | Mobile | — |
| T8 | API tests | API | ~28 total |

**Estimated total: ~28 API tests**

## Definition of Done

- [ ] Blind review submission for both parties
- [ ] 14-day auto-reveal cron
- [ ] Immediate reveal when both submit
- [ ] Creator response (one-time)
- [ ] Review display on content detail + profile
- [ ] ~28 API tests passing
