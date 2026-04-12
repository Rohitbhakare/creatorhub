# Claude Code Prompt · Add KYC Mobile Flow to SRS v1.2

**Task:** Add the Phase B KYC mobile flow requirements (DD-049 through DD-056) to the existing SRS v1.2.

**Target file:** `srs-v1.2.md` (in-place edit, do NOT create a new file)

**Backup first:** Before any edits, copy the current file to `archive/srs-v1.2-pre-kyc.md` so we have a rollback point.

---

## Context

The SRS v1.2 currently includes the admin KYC infrastructure spec (Phase A) which covers the backend state machine, RBAC matrix, schema DDL, and audit catalog for KYC. What it does NOT yet cover is the **mobile-side creator-facing UX** for the KYC flow itself — the screens the creator actually walks through, the entry trigger mechanics, the data inputs, and the status states.

This prompt adds those requirements.

---

## Input files

1. **`srs-v1.2.md`** — the current SRS, includes Phase A admin/KYC backend infrastructure
2. **`wireframes/phase-b-kyc-flow.html`** — the visual reference for all 11 KYC mobile screens
3. **`wireframes/prototype.jsx`** — the working clickable prototype with KYC flow integrated
4. **This prompt file** — the instructions you're reading

---

## New design decisions to add

Add these to the design decisions section of the SRS (after DD-048):

### DD-049 · KYC trigger mechanism · Option A inline interrupt

KYC verification is triggered when a creator toggles "Paid" in Step 4 (Pricing) of the publishing wizard, **only** if their KYC status is not currently `verified` or `approved`. Free content (Posts, free Events, free Itineraries) never triggers KYC.

When the trigger fires, an inline modal sheet slides up from the bottom of the wizard with:
- Warning badge ("⚠ VERIFICATION REQUIRED")
- Explainer headline and subtext
- 4-item checklist (time estimate, documents required, review SLA, draft preservation guarantee)
- Two CTAs: "Start verification" (coral primary) and "Save as draft and finish later" (text secondary)
- **No "skip" option** — KYC is non-negotiable for paid content

When the creator chooses "Save as draft and finish later", the wizard state is preserved exactly as it was at Step 4 with Paid still selected. After verification (whenever they return), they can resume the wizard at the same step.

**Rationale:** This is Option A from the design discussion — chosen over Option B (pre-flight gate at "+ New") because it lets free content creators publish without ever seeing KYC, and only surfaces verification at the exact moment it becomes legally necessary.

### DD-050 · Mobile-first KYC with 5 linear steps

The KYC flow consists of 5 linear steps inside a wizard, plus an intro screen and a submitted/status state:

1. **Intro screen** — sets expectations, shows time estimate, document list, review SLA, privacy reassurance
2. **Step 1 · PAN** — number input (regex-validated `[A-Z]{5}[0-9]{4}[A-Z]{1}`), name as on PAN, photo upload
3. **Step 2 · Aadhaar** — manual upload (MVP) or Digilocker (V1, shown as "soon" in MVP), masked Aadhaar number, name, front + back photos
4. **Step 3 · Bank account** — account holder name (must match PAN), account number entered twice (anti-typo), IFSC code with auto-fill of bank name + branch + city, account type (savings/current)
5. **Step 4 · Selfie** — live camera capture with oval guide overlay, real-time positioning feedback, retry option
6. **Step 5 · Review &amp; submit** — summary of all 4 entered items with inline edit links per row, declaration checkbox (pre-checked), submit CTA

After submission, the creator sees a **Submitted** state with "What happens next" 3-step explainer, followed by status states (Pending, Approved, or Needs more info).

Each step is independently saveable as a draft, so the creator can do PAN now and finish later.

### DD-051 · Selfie verification included for MVP

Selfie capture is a required step in MVP (not deferred to V1). The implementation uses:
- Native camera access via Flutter `camera` package
- Oval face guide overlay with 4 positioning states: too far, too close, off-center, centered
- Real-time status pill at the bottom of the oval ("Move closer", "Move back", "Center your face", "Hold still", "Captured!")
- Plain-language coaching below the camera ("Good lighting helps. No hats or sunglasses.")
- Retry/retake option from the Review step
- For MVP, manual reviewers compare the selfie to the PAN photo by eye. V1 will add automated face matching via the third-party KYC API.

**Rationale:** Selfie + face matching is standard for Indian fintech KYC even with manual review, and skipping it would create a gap that V1 would have to retroactively add. Better to design for it now.

### DD-052 · "Why we ask" expandable explainer pattern on every input

Every sensitive input (PAN number, Aadhaar number, bank account holder name) has a small "ⓘ Why we ask" link in the top-right of the field label. Tapping it expands an inline explainer (not a modal) that stays open until tapped again.

The explainer contains exactly three statements:
1. **What it's for** — e.g., "RBI mandates PAN verification for any creator receiving payouts above ₹2.5 lakh per year."
2. **What we never do** — e.g., "Travellers never see your PAN number. We never sell or share it."
3. **How we store it** — e.g., "Stored encrypted, only viewable by our reviewers during verification."

The explainer uses a coral left border and warm sunken background to tie it to the trust accent color.

**Rationale:** KYC drops off badly when users feel interrogated. Giving creators control over their own understanding (instead of forcing it on them with a modal) measurably improves completion rates and builds trust.

### DD-053 · Validation states and error handling per field

Each input has 4 visual states:
- **Empty** — placeholder text in soft-ink color, default border
- **Valid** — green border, green checkmark icon on the right
- **Invalid** — red border, error message below in red 11px text
- **Loading** (for IFSC autofill) — neutral border, subtle spinner

Validation is real-time where possible (regex for PAN, IFSC format, Aadhaar length, account number re-entry match). The Continue CTA stays disabled until all fields on the current step are valid. The Aadhaar number input is **masked in the UI** (only last 4 digits visible) for shoulder-surfing protection even from the creator's own screen.

### DD-054 · IFSC autofill is the magic moment

When the creator types a valid IFSC code in Step 3, the bank name + branch + city auto-populates in a green confirmation row immediately below the field. This uses the public RBI IFSC lookup API (free, no rate limits in production at expected scale).

Account holder name has an explicit "must match the name on your PAN card" hint to prevent the most common reason for KYC rejection in India: bank account in initials, PAN in full name.

### DD-055 · Submission states and review SLA

After submitting, the creator enters one of four states tracked on the `kyc_submissions` table:

**Submitted (immediately after submit)** — Confirmation screen with dark filled checkmark, "Submitted for review", explicit 24-48 hour SLA, "What happens next" 3-step card explaining: (1) reviewers verify against names, (2) WhatsApp + push notification on completion, (3) once approved, unlimited paid trips with no need to verify again.

**Pending (when returning to Studio mid-review)** — Amber status card in Studio (different from the coral attention card so it doesn't get confused with new bookings) showing "Verification in progress", submission timestamp, relative time ("4 hours ago"). Their draft is preserved with "DRAFT · KYC PENDING" amber badge and amber progress bar.

**Approved** — Success state with dark/green filled checkmark, "You're verified", per-vertical accent color confetti dots (Travel amber, Stories coral, Food olive, Fitness violet, Photography blue), green "KYC verified" status card. **Crucially, the draft they were working on is surfaced immediately** with a coral border and "Resume publishing" CTA — this closes the loop on the inline interrupt.

**Needs more info (rejected with fix path)** — Empathetic state with the headline "We need a couple of fixes" (NOT "Rejected"). Reassurance: "most issues take less than 2 minutes to fix. You don't need to redo the whole flow." Each issue has: specific field name, plain-language reason, individual "Fix →" link that jumps to that exact step with data preserved. 12-hour re-review SLA (faster than original 24-48 hours, rewarding the creator for fixing quickly). "Get help via WhatsApp" escalation link at the bottom.

For MVP, all reviews are manual with a 24-48 hour SLA. V1 introduces a third-party KYC API to drop most reviews to instant.

### DD-056 · Single KYC unlocks unlimited paid publishing

KYC is a one-time process per creator. Once approved, the creator can publish unlimited paid content of any type (Scheduled experience, paid Self-paced itinerary, paid Event) with no need to re-verify. The verified status is permanent unless:
- The creator's account is suspended for policy violation (re-verification required after suspension lift)
- A government compliance change requires re-verification (rare, would be communicated via in-app notice + 30-day grace period)

This is a deliberate UX commitment to make the friction worth it for creators. The reciprocity statement "you do this once, you unlock everything forever" is repeated in the intro screen, the submitted screen, the approved screen, and the KYC verified row in the You tab.

---

## New functional requirements to add

Add these to the SRS under a new section §X.Y "KYC Module" (place after the publishing wizard section):

### Entry & trigger

- **KYC-FR-001** — The system shall track each creator's KYC status as one of: `unverified`, `pending`, `approved`, `rejected`, `expired`.
- **KYC-FR-002** — When a creator with status `unverified` or `rejected` toggles "Paid" in Step 4 of the publishing wizard, the system shall display a modal sheet interrupt prompting them to start verification or save as draft.
- **KYC-FR-003** — The interrupt sheet shall NOT include a "skip" option. KYC is mandatory for all paid content publishing.
- **KYC-FR-004** — When the creator chooses "Save as draft and finish later", the wizard state shall be persisted exactly as-is, including the Paid toggle being on, so the creator can resume at the same step after verification.

### Intro screen

- **KYC-FR-005** — The intro screen shall display: estimated time ("≈ 8 minutes"), review SLA ("Reviewed in 24-48 hrs"), 3-item document list with sub-time estimates, and a privacy reassurance card.

### Step 1 · PAN

- **KYC-FR-006** — The PAN number input shall validate against the regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` in real time and show a green checkmark when valid.
- **KYC-FR-007** — The PAN photo upload shall accept JPG and PNG files up to 5 MB, from camera or gallery.
- **KYC-FR-008** — The "Why we ask" expandable explainer for PAN shall display three statements: legal requirement (RBI ₹2.5L threshold), non-sharing guarantee, encryption-at-rest disclosure.

### Step 2 · Aadhaar

- **KYC-FR-009** — The Aadhaar input shall offer two methods: "Upload manually" (default for MVP) and "Use Digilocker" (visible but marked "V1 · soon" in MVP).
- **KYC-FR-010** — The Aadhaar number input shall be masked in the UI to show only the last 4 digits (`XXXX XXXX 1234`).
- **KYC-FR-011** — The system shall require both front and back Aadhaar photos as separate uploads.

### Step 3 · Bank account

- **KYC-FR-012** — The system shall require the account holder name to be entered manually with a UI hint "Must match the name on your PAN card."
- **KYC-FR-013** — The system shall require the account number to be entered twice (entry + confirmation) and shall validate that both entries match before enabling Continue.
- **KYC-FR-014** — When a valid IFSC code is entered, the system shall auto-fetch and display the bank name, branch, and city via the RBI public IFSC API. This auto-fetched data shall be displayed in a green confirmation row below the field.
- **KYC-FR-015** — The system shall offer two account type options: Savings (default) and Current.

### Step 4 · Selfie

- **KYC-FR-016** — The system shall use the device's front-facing camera with an oval face guide overlay.
- **KYC-FR-017** — The oval shall display real-time positioning feedback in 4 states: too far, too close, off-center, centered.
- **KYC-FR-018** — The system shall provide retry/retake from both the camera screen and the Review step.
- **KYC-FR-019** — In MVP, the captured selfie shall be stored for manual reviewer comparison against the PAN photo. V1 shall integrate automated face matching via third-party API.

### Step 5 · Review & submit

- **KYC-FR-020** — The Review screen shall display a summary card with one row per verified item (PAN, Aadhaar, Bank, Selfie), each with a green checkmark, label, masked value, and an inline Edit link.
- **KYC-FR-021** — Tapping Edit shall jump the creator back to that specific step with all data preserved, allowing fix-and-return without losing progress on other steps.
- **KYC-FR-022** — The declaration checkbox shall be pre-checked by default and shall include the text: "I confirm all details are accurate and the documents belong to me. I understand that providing false information may result in account suspension and is punishable under Indian law."
- **KYC-FR-023** — The Submit CTA shall be disabled until the declaration checkbox is checked.

### Submission & status states

- **KYC-FR-024** — Upon submission, the system shall create a record in the `kyc_submissions` table with status `pending` and timestamp `submitted_at`.
- **KYC-FR-025** — The system shall send a WhatsApp confirmation message to the creator's registered phone number upon submission.
- **KYC-FR-026** — When a creator with `pending` KYC returns to Studio, the system shall display an amber status card showing "Verification in progress", submission timestamp, and relative time.
- **KYC-FR-027** — Upon manual reviewer approval, the system shall: (a) update the creator's KYC status to `approved`, (b) send a WhatsApp + push notification to the creator, (c) display the Approved success screen on next app open, (d) surface the creator's draft trip with a "Resume publishing" CTA.
- **KYC-FR-028** — Upon manual reviewer rejection with fix requirements, the system shall: (a) update status to `rejected`, (b) send a WhatsApp + push notification with fix instructions, (c) display the "We need a couple of fixes" screen on next app open, (d) list each issue with specific field, plain-language reason, and inline Fix link.
- **KYC-FR-029** — Re-submission after fixes shall trigger a 12-hour re-review SLA (faster than the original 24-48 hours).
- **KYC-FR-030** — Once approved, KYC status shall be permanent. The creator shall be able to publish unlimited paid content with no need to re-verify.

### Privacy & security

- **KYC-FR-031** — All KYC documents shall be encrypted at rest using AES-256.
- **KYC-FR-032** — KYC documents shall only be viewable by users with the `kyc_reviewer` role in the admin panel, and only during active review of a specific submission.
- **KYC-FR-033** — KYC documents shall NEVER be displayed to other creators, travellers, or any external party.
- **KYC-FR-034** — All KYC document access shall be logged in the `audit_log` table with user ID, timestamp, and document ID.

---

## Schema additions

Add the following table to the data model section (likely §5 or §6) if not already present from Phase A. If the table exists from Phase A, verify the columns match this spec and note any deltas:

```sql
CREATE TABLE kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  pan_number_hash VARCHAR(64) NOT NULL,  -- hashed for lookup, not plaintext
  pan_name VARCHAR(255) NOT NULL,
  pan_photo_url TEXT NOT NULL,            -- encrypted S3 URL
  aadhaar_number_hash VARCHAR(64) NOT NULL,
  aadhaar_name VARCHAR(255) NOT NULL,
  aadhaar_front_url TEXT NOT NULL,
  aadhaar_back_url TEXT NOT NULL,
  aadhaar_method VARCHAR(20) DEFAULT 'manual' CHECK (aadhaar_method IN ('manual', 'digilocker')),
  bank_account_holder VARCHAR(255) NOT NULL,
  bank_account_number_encrypted TEXT NOT NULL,
  bank_account_number_last4 VARCHAR(4) NOT NULL,
  bank_ifsc VARCHAR(11) NOT NULL,
  bank_name VARCHAR(255),               -- auto-filled from IFSC API
  bank_branch VARCHAR(255),
  bank_city VARCHAR(100),
  bank_account_type VARCHAR(20) CHECK (bank_account_type IN ('savings', 'current')),
  selfie_url TEXT NOT NULL,
  declaration_accepted BOOLEAN NOT NULL DEFAULT false,
  declaration_accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reasons JSONB,              -- array of {field, reason} objects
  resubmission_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_submissions_creator ON kyc_submissions(creator_id);
CREATE INDEX idx_kyc_submissions_status ON kyc_submissions(status);
CREATE INDEX idx_kyc_submissions_submitted_at ON kyc_submissions(submitted_at DESC);
```

Also add a `kyc_status` column to the `users` table if not already present:

```sql
ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'unverified'
  CHECK (kyc_status IN ('unverified', 'pending', 'approved', 'rejected', 'expired'));
ALTER TABLE users ADD COLUMN kyc_approved_at TIMESTAMPTZ;
```

---

## Update existing sections

1. **Publishing wizard section** — Add a paragraph explaining that the Pricing step (Step 4) checks `users.kyc_status` when the creator toggles Paid, and triggers the KYC interrupt modal if status is not `approved`. Reference KYC-FR-002.

2. **Studio section** — Add a description of the pending KYC state (amber status card) that appears when an unverified creator with a pending submission returns to Studio. Reference KYC-FR-026.

3. **You tab section** — Add a row for "KYC verified" in the PREFERENCES & ACCOUNT section, visible only to creators (not pure followers), with green checkmark + "PAN · Aadhaar · bank verified" subtitle when status is `approved`.

4. **Notification preferences section** — Verify that the "Bookings & trips" category (which includes KYC status notifications) supports WhatsApp + push channels. KYC notifications are routed through this category.

5. **Revision history (§0.1)** — Add a new row:
   ```
   v1.2.1 | 2026-04-12 | KYC mobile flow added (Phase B). DD-049 through DD-056 locked. KYC-FR-001 through KYC-FR-034 added. kyc_submissions table added. Wizard, Studio, You tab updated to integrate KYC status. Source: Phase B wireframes + clickable prototype Turn 4.
   ```

---

## Verification checklist

Before finalizing, verify:

1. The backup file `archive/srs-v1.2-pre-kyc.md` exists
2. All 8 new design decisions (DD-049 through DD-056) are present and numbered correctly
3. All 34 new functional requirements (KYC-FR-001 through KYC-FR-034) are present
4. The `kyc_submissions` table DDL is present in the data model section
5. The `users` table has `kyc_status` and `kyc_approved_at` columns added (or noted as already present from Phase A)
6. The publishing wizard, Studio, and You tab sections reference the new KYC requirements
7. The revision history has the v1.2.1 entry
8. No existing content from v1.2 has been deleted or rewritten — this is purely additive
9. Run `grep -c "KYC-FR-" srs-v1.2.md` and verify the count is 34
10. Run `grep -c "DD-04[9]\|DD-05[0-6]" srs-v1.2.md` and verify the count is at least 8

---

## Output expectations

The result should be the existing `srs-v1.2.md` with all KYC mobile flow requirements integrated additively. Total line count should grow by approximately 250-350 lines. No existing content should be lost or rewritten.

After completing the edits, print a summary including:
- Total lines added
- New section locations (line numbers)
- Any conflicts found with existing content (e.g., if Phase A already created a different `kyc_submissions` schema)
- Confirmation that the backup file was created

Begin by reading `srs-v1.2.md` and the wireframe HTML reference. Then make the backup. Then proceed with the additive edits.
