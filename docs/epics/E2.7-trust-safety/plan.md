# E2.7 — Trust & Safety (Report + Moderation)

> **SRS refs:** TS-FR-001–009
> **Depends on:** E0.3 (auth), E1.7 (social — comment moderation)

---

## Market Research — Content Moderation UX

### Instagram / YouTube
- **Report flow:** 3-tap — tap "..." → "Report" → category selection → done. Minimal friction.
- **Categories:** Standard set (spam, nudity, hate speech, violence, scam, copyright).
- **Feedback:** "Thanks for reporting. We'll review within 24h."
- **Moderation:** AI first pass (Perspective API / Vision API), human review for edge cases.

### CreatorHub Approach
- **Report:** Tap "..." on content/user/comment → "Report" → category picker → optional description → submit. Confirmation toast.
- **Moderation pipeline:**
  1. **Text:** Google Perspective API on comments + content descriptions. High-confidence matches auto-held.
  2. **Images:** Google Cloud Vision SafeSearch on uploaded images. Explicit auto-rejected. Borderline queued.
  3. **Human review:** Retool moderation queue (E2.8). SLA: 36h for P1, 72h others. IT Act: 24h for grossly offensive.
- **Creator suspension:** Hides all content. In-flight bookings get refund option.
- **Grievance Officer:** Name + contact in every page footer (IT Act 2021 compliance).

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Report service (create report, list reports for admin, update status) | API | ~10 |
| T2 | Report handlers + routes (POST /reports, content/:id/report, users/:id/report) | API | ~8 |
| T3 | Text moderation service (Perspective API integration) | API | ~6 |
| T4 | Image moderation service (Cloud Vision SafeSearch) | API | ~6 |
| T5 | Content moderation middleware (auto-check on publish) | API | ~5 |
| T6 | Creator suspension service (hide content, notify, refund option) | API | ~5 |
| T7 | Report UI (bottom sheet with category picker + description) | Mobile | — |
| T8 | Report confirmation + "Thanks" feedback | Mobile | — |
| T9 | Grievance Officer info in app settings | Mobile | — |
| T10 | Adventure safety checklist (required fields for adventure categories) | API + Mobile | ~4 |
| T11 | API tests | API | ~44 total |

**Estimated total: ~44 API tests**

## Definition of Done

- [ ] Report flow (content, user, comment) with categories
- [ ] Perspective API text moderation on publish
- [ ] Cloud Vision SafeSearch on image upload
- [ ] Creator suspension mechanics
- [ ] Grievance Officer contact visible
- [ ] ~44 API tests passing
