# docs/ — CreatorHub Documentation

This folder contains all product, engineering, and project management documentation for CreatorHub.

## Folder Structure

```
docs/
├── 00_SRS/                    # Product requirements (source of truth)
│   └── v1.2/
│       └── srs-v1.2.md        # SRS v1.2.1 — all functional requirements, design decisions, DDL
│
├── 01_wireframes/             # Visual specifications
│   ├── README.md              # Index — v2 active, archive/v1 historical
│   ├── v2/                    # CANONICAL design (Pure White + Coral, April 2026)
│   │   ├── README.md          #   Handoff readme — read first
│   │   ├── chats/             #   Design chat transcript
│   │   └── project/           #   CreatorHub Redesign.html + 9 pack JSX files
│   └── archive/v1/            # Historical HTML prototypes (do not implement against)
│
├── engineering/               # Technical design documents
│   ├── HLD.md                 # High-Level Design — architecture, data flows, deployment, ADRs
│   └── openapi.yaml           # OpenAPI 3.1 spec — all API endpoint contracts
│
└── epics/                     # Project management & tracking
    ├── TRACKING.md            # Master progress dashboard (all 25 epics)
    ├── _TEMPLATE.md           # Template for creating new epic folders
    ├── E0.1-repo-infra/       # Each epic has its own folder:
    │   ├── plan.md            #   - Overview, SRS refs, dependencies, deliverables
    │   ├── tasks.md           #   - Detailed tasks with acceptance criteria & edge cases
    │   └── tracking.md        #   - Per-task status, review gate, changelog
    ├── E0.2-database-schema/
    ├── E0.3-authentication/
    ├── E0.4-design-system/
    └── E0.5-onboarding/
```

## How to Use These Docs

### Building a feature?

1. **Start with the SRS** — `00_SRS/v1.2/srs-v1.2.md` has every requirement with IDs (e.g., `IAM-FR-001`). Search by feature area.
2. **Check the wireframes** — start at `01_wireframes/v2/README.md`, then open the specific `v2/project/pack-*.jsx` for your screen. `archive/v1/` is historical only.
3. **Read the HLD** — `engineering/HLD.md` covers system architecture, data flows, and architecture decisions (ADRs).
4. **Check the API contract** — `engineering/openapi.yaml` defines exact request/response shapes. Code against this spec.
5. **Find your epic** — `epics/E*.*/tasks.md` has per-task acceptance criteria and edge cases.

### Tracking progress?

- **Master view:** `epics/TRACKING.md` — all 25 epics, milestone gates, pre-coding deliverables
- **Per-epic:** `epics/<epic-id>/tracking.md` — task-level status, review gate results, changelog

### Adding a new epic?

1. Copy the structure from `epics/_TEMPLATE.md`
2. Create folder `epics/<epic-id>/` with `plan.md`, `tasks.md`, `tracking.md`
3. Add a row to `epics/TRACKING.md`

## Document Hierarchy

```
SRS (what to build)
 └── HLD (how it fits together)
      └── OpenAPI Spec (API contracts)
           └── Epic Tasks (how to build each piece)
```

The SRS is the single source of truth. If the HLD or OpenAPI spec conflicts with the SRS, the SRS wins.

## Key Reference IDs

| Prefix | Domain | Example |
|--------|--------|---------|
| IAM-FR | Auth & identity | IAM-FR-001 (phone OTP) |
| ONB-FR | Onboarding | ONB-FR-002 (location capture) |
| CRT-FR | Content creation | CRT-FR-001 (post creation) |
| DISC-FR | Discovery & feed | DISC-FR-001 (home feed) |
| PROF-FR | Profiles | PROF-FR-006 (edit profile) |
| SOC-FR | Social features | SOC-FR-001 (follow) |
| BOOK-FR | Bookings | BOOK-FR-001 (booking flow) |
| STUD-FR | Studio/dashboard | STUD-FR-001 (creator studio) |
| NOT-FR | Notifications | NOT-FR-001 (push prefs) |
| KYC-FR | KYC verification | KYC-FR-001 (PAN step) |
| TAX-FR | Tax compliance | TAX-FR-001 (GST) |
| WEB-FR | Web pages | WEB-FR-001 (mini-site) |
| DD | Design decisions | DD-013 (coral contexts) |
| ADR | Architecture decisions | ADR-001 (no ORM) |
| NFR | Non-functional reqs | NFR-PERF (performance) |
