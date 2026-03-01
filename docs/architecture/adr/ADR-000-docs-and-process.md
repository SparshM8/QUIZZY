# ADR-000 — Documentation Tree & Approval-First Process

**Status:** ACCEPTED (2026-08-16)
**Deciders:** SparshM8 (approval), Manus AI (recommendation)

## Context

The platform is built under a strict approval-first, phase-gated workflow with a product owner of one. Documentation must therefore serve as the project's source of truth, decision log, and onboarding material for any future engineer.

## Decision

1. **Documentation tree** (all under `docs/`):

```
docs/
├── charter/CHARTER.md        # Project charter (source of truth for vision, scope, rules)
├── requirements/             # FR/NFR documents per category (prefixes FR-IA, FR-QM, FR-AD, FR-EV, FR-SJ, FR-AR, FR-NE; NFR-*)
├── architecture/
│   ├── ARCHITECTURE.md       # System architecture overview
│   └── adr/                  # Architecture Decision Records (ADR-NNN-<slug>.md)
├── database/                 # ERD and schema evolution documents
├── api/                      # API documentation (OpenAPI once code exists)
├── modules/                  # Per-module documentation
├── workflows/                # Development workflow, GitHub workflow, Definition of Done
├── security/                 # Security decisions and threat model
├── testing/                  # Testing strategy
├── deployment/               # Deployment documentation
├── progress/                 # Phase completion logs
└── proposals/                # Draft proposals awaiting approval (living area)
```

2. **Process rules:**
   - Documents precede code where feasible; ADRs are written at decision time.
   - Every proposal lives in `docs/proposals/` with status header (PROPOSED / DECIDED / REJECTED) until approved.
   - Approved proposals are moved/merged into the canonical docs and referenced from the charter's approval history.
   - `docs/progress/progress.md` is updated at every phase completion.
   - The repository README is the entry point, linking to the docs tree.

3. **GitHub workflow:** one issue per phase on `main`; direct commits to `main` (no feature branches per Rule 6); every commit message references the issue (`#NNN`); optional Git tags (`v0.1.0` MVP) mark phase completions; all contributions under the product owner's identity.

## Consequences

- Documentation overhead is predictable and bounded (per-phase docs, not free-form).
- Approval history in the charter provides an audit trail of what is DECIDED.
- `docs/proposals/` prevents approved-vs-draft confusion.
