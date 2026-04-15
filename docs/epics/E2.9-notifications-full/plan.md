# E2.9 — Notifications (Full: WhatsApp Business + Email)

> **SRS refs:** NTF-FR-002, NTF-FR-004, BK-FR-008
> **Depends on:** E1.9 (push notifications + preferences), E2.3 (booking events trigger notifications)
> **External dependency:** WhatsApp Business API approval (apply early!)

---

## Market Research — Transactional Notifications (India)

### WhatsApp Business API
- **Template-based:** All outbound messages must use pre-approved templates. Apply via Meta Business Manager.
- **Key templates needed:** booking_confirmation, payment_receipt, refund_notification, kyc_status_update, trip_reminder_24h.
- **Delivery:** Near-instant. 98%+ open rate in India (vs 20% email). First-class channel.

### SendGrid (Email)
- **Transactional:** Booking confirmation, payment receipt, refund, KYC status, account deletion.
- **Template engine:** Dynamic templates with Handlebars.

### CreatorHub Approach
- **WhatsApp:** Primary transactional channel for bookings. Pre-approved templates. Fallback to email + push.
- **Email:** Backup transactional + legal notifications (DPDPA consent changes, T&C updates).
- **Preference integration:** Respect user preferences from E1.9. WhatsApp × bookings is locked ON.

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | WhatsApp Business API integration service | API | ~8 |
| T2 | WhatsApp message templates (booking_confirmation, payment_receipt, etc.) | API | ~5 |
| T3 | SendGrid email integration service | API | ~6 |
| T4 | Email templates (booking confirmation, receipt, refund, KYC status) | API | ~4 |
| T5 | Notification dispatcher (route to correct channel based on preferences) | API | ~8 |
| T6 | Wire booking events → WhatsApp + email notifications | API | ~5 |
| T7 | Wire KYC events → notifications | API | ~3 |
| T8 | API tests | API | ~39 total |

**Estimated total: ~39 API tests**

## Definition of Done

- [ ] WhatsApp Business API sending booking confirmations
- [ ] SendGrid sending transactional emails
- [ ] Notification dispatcher respects preferences + DND
- [ ] All booking lifecycle events trigger appropriate notifications
- [ ] Fallback chain: WhatsApp → email → push
- [ ] ~39 API tests passing
