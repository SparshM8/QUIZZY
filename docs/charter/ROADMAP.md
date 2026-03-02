# Quizzy — Roadmap

**Status:** APPROVED high-level order (Part 0); phase entry criteria refine it progressively
**Last updated:** 2026-08-16

The roadmap is phase-ordered; adjacent phases may partially overlap only where components are isolated (e.g., the judge component in Phase 4 can be designed in parallel with Phase 3's delivery engine, but only after Phase 3's data model is stable).

| Phase | Name | Core Deliverable | Entry Criteria | Exit Criteria |
|---|---|---|---|---|
| 0 | Project Foundation | Charter, ADRs, architecture outline, requirements overview, workflows | — | This document set approved and committed |
| 1 | System Foundation | Repo skeleton (backend/frontend), database, auth, RBAC, audit log, CI | Phase 0 approved | Login/register work; roles enforced; CI green |
| 2 | Question Engine | Question bank: 6+ types incl. coding stubs, tags/topics/difficulty, moderation basics | Phase 1 exit | Teacher can author/manage questions; types validated by tests |
| 3 | Quiz / Test Engine | Test creation → delivery → evaluation → results; timer, autosave, auto-submit; basic analytics; in-app notifications | Phase 2 exit | Full MVP journey passes acceptance tests on a deployed URL |
| 4 | Coding Platform | Coding problems, editor, queue-first submissions, judge, sandboxing, scoring; contests (later in phase) | Phase 3 exit | Judge runs untrusted code safely; verdicts correct on reference suites |
| 5 | Assignments & Projects | Assignments/projects, deadlines, file/repo submissions, rubrics, feedback, grading | Phase 3 exit | Full submission/grading loop works for teachers and students |
| 6 | Recruitment Platform | Organizations, recruiters, campaigns, invitations, candidate tests, ranking, shortlisting | Phases 3–4 | One end-to-end recruitment campaign flow |
| 7 | Analytics & Advanced Features | Leaderboards, certificates, email notifications, anti-cheating, proctoring, cross-module analytics | All above | Trust layer operational; certificate verification works |
| 8 | Scale & Production Hardening | Performance tuning, observability, CI/CD full pipeline, production deployment, DR | All above | Production-ready deployment documented and operated |

## Parallelism Notes

- Phase 3 and Phase 4: judge **design** (ADR-003) is already agreed; judge **implementation** may begin once Phase 3's submission data model is stable.
- Phase 5 depends only on Phase 3's identity + submission primitives; it may start slightly before Phase 4 completes.
- Phases 6–8 are sequential by dependency.

## Milestone Tags (proposed)

| Tag | Meaning |
|---|---|
| `v0.1.0` | MVP complete (end of Phase 3) |
| `v0.2.0` | Coding platform (end of Phase 4) |
| `v0.3.0` | Assignments + recruitment (ends of Phases 5–6) |
| `v1.0.0` | Production-hardened platform (end of Phase 8) |
