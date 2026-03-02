# Requirements Overview

**Status:** APPROVED skeleton (Part 0); per-category FR/NFR documents to be written progressively per phase
**Last updated:** 2026-08-16

Functional requirements (FR) are organized into seven categories, each with a tracking prefix used in issue and commit references. Non-functional requirements (NFR) are grouped into nine categories with initial targets. Concrete, numbered requirements are authored **per phase** (before implementation of that phase), so that no requirement exists before it is relevant.

## Functional Requirement Categories

| Prefix | Category | Phase Introduced | MVP Content |
|---|---|---|---|
| FR-IA | Identity & Access | Phase 1 | Registration, login, JWT sessions, profiles, RBAC (admin/teacher/student) |
| FR-QM | Question Management | Phase 2 | Question CRUD, 6+ types incl. coding stubs, tags/topics/difficulty, moderation basics |
| FR-AD | Assessment Delivery | Phase 3 | Test creation, scheduling, single section, question selection, delivery session, timer, navigation, autosave, auto-submit |
| FR-EV | Evaluation & Results | Phase 3 | Auto-scoring of objective types, result publication, per-question stats, teacher dashboard |
| FR-SJ | Submissions & Judge | Phase 4 | File/repo submissions (Phase 5), code execution, judging, scoring, hidden test cases |
| FR-AR | Analytics & Reporting | Phase 3 (basic) / Phase 7 (full) | Per-test summaries, question analytics; later leaderboards and cross-format analytics |
| FR-NE | Notification & Engagement | Phase 3 | In-app notifications (results, assignments) |

Category-level skeletons live in `docs/requirements/` (e.g., `FR-IA.md`, `FR-QM.md`, ...). This overview document is the index; per-category documents list numbered requirements once drafted.

## Non-Functional Requirement Categories & Initial Targets

| NFR Prefix | Category | Initial Target |
|---|---|---|
| NFR-SEC | Security | OWASP Top 10 from Phase 1; bcrypt password hashing; JWT short expiry + refresh tokens; server-side RBAC; input validation on every endpoint; audit log from Phase 1 |
| NFR-PERF | Performance | Read APIs < 500 ms p95; test-session state writes < 200 ms p95 |
| NFR-SCL | Scalability | Stateless API horizontally scalable; judge as separate scalable component (Phase 4) |
| NFR-REL | Reliability | Auto-submit lossless under client crash (server-side heartbeat/state sync); graceful degradation of autosave |
| NFR-TEST | Testability | ≥ 80% coverage on core engine (question, session, evaluation, judge); API contract tests |
| NFR-DEP | Deployability | One-command local setup (Docker Compose); environment parity dev/prod |
| NFR-PRIV | Privacy | Minimal PII; explicit consent for any biometric/proctoring data (Phase 7); data retention policy documented |
| NFR-ACC | Accessibility | Keyboard navigability; WCAG 2.1 AA where feasible |
| NFR-OBS | Observability | Structured logging from Phase 1; metrics/error tracking at Phase 8 |

## How Requirements Are Authored

For each phase, before implementation begins, I draft the relevant numbered requirements (e.g., `FR-IA-001: User registration with email uniqueness`), you review them as part of the phase plan, and only approved requirements are implemented. This keeps the process requirement-driven per your Rule 4.
