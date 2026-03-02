# ADR-002 — MVP Scope ("Assessment Core")

**Status:** ACCEPTED (2026-08-16)
**Deciders:** SparshM8 (approval), Manus AI (recommendation)

## Context

The long-term vision spans ten modules (identity, question bank, quiz engine, exam engine, coding platform, assignments, recruitment, analytics, administration, notifications). A solo-sized team cannot deliver all of it at once without quality collapse. The MVP must prove the core assessment loop end-to-end while establishing the architecture all later phases extend.

## Decision

The MVP, named **Assessment Core**, delivers:

| Area | MVP Content | Deferred (and where) |
|---|---|---|
| Identity | Registration, login, JWT sessions, profiles; roles admin/teacher/student | Recruiter/org personas (Phase 6), super-admin (Phase 8) |
| Question bank | MCQ, multiple-select, T/F, fill-in, numerical, subjective, coding-*stubs* (schema-ready, no judge) | Import/export, question versioning, moderation queue (Phase 2+) |
| Quiz/test engine | Create test, pick questions, duration/passing score, sections (single), timer, navigation, answer autosave, auto-submit, evaluation, results | Randomization pools, question pools, resume rules, negative marking variants (Phase 3+) |
| Exam mode | Scheduled test, single section | JEE/NEET multi-subject/multi-section, rankings (Phase 3/4) |
| Analytics | Per-test summaries, per-question success rates, teacher dashboard | Trend analysis, cross-format analytics, leaderboards (Phase 7) |
| Notifications | In-app only | Email, scheduled reminders, invitations (Phase 3+ / 7) |
| Administration | User management, question moderation, basic audit log | Full moderation suite, platform config (Phase 7/8) |

**Exit criteria (Definition of Done for MVP):** a teacher creates a 20-question mixed-format quiz; students take it under a timer with lossless auto-submit (even on client crash); results and basic analytics render; the full flow passes the agreed acceptance test suite on a deployed URL.

## Rationale

The assessment loop (author → deliver → evaluate → analyze) is the dependency spine of every later module: the coding platform extends the question/attempt models; assignments extend submissions; recruitment extends campaigns over the same identity layer. Delivering this loop first validates the data model and architecture with real users while deferring the most capital-intensive features (judge, proctoring, multi-tenancy) until the foundation is proven.

## Consequences

- Every Phase 1–3 decision must keep the extension paths open (e.g., question `type` discriminator must include `coding`).
- Phase 4+ teams get a working platform to build upon, not a sketch.
- Risk: owner may want coding features earlier; mitigated because the coding question type is schema-ready in MVP.
