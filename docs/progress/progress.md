# Progress Tracking

**Status:** IN DEVELOPMENT (Phase 6 recruitment slice)
**Last updated:** 2026-08-11

## Phase Status

| Phase | Name | Status | Notes |
|---|---|---|---|
| 0 | Project Foundation | **COMPLETE** | Charter, ADRs 000–004, architecture overview, requirements overview, security foundations, testing strategy, workflows; legacy code archived to `legacy/` |
| 1 | System Foundation | **COMPLETE** | Backend/frontend skeleton, database, auth, RBAC |
| 2 | Question Engine | **COMPLETE** | Question bank, types, tagging, moderation |
| 3 | Quiz / Test Engine | **COMPLETE** | Test creation, delivery, results, notifications |
| 4 | Coding Platform | **COMPLETE** | Judge queue, local worker scaffold, coding submissions |
| 5 | Assignments & Projects | **COMPLETE** | Submissions, rubrics, grading, uploads |
| 6 | Recruitment Platform | **IN PROGRESS** | Organizations, campaigns, invitations, candidate applications, ranking and shortlisting |
| 7 | Analytics & Advanced Features | NOT STARTED | Leaderboards, proctoring, certificates, email |
| 8 | Scale & Production Hardening | NOT STARTED | Performance, CI/CD, deployment, DR |

## Decision Log (DECIDED items, Part 0)

| Date | Decision | Reference |
|---|---|---|
| 2026-08-16 | Continue in `SparshM8/QUIZZY`; archive legacy code to `legacy/` | ADR-004 |
| 2026-08-16 | Tech stack: React 18 + Vite, Node/Express (TS for new code), MongoDB/Mongoose, Tailwind | ADR-001 |
| 2026-08-16 | MVP = Assessment Core (in/out scope per table) | ADR-002 |
| 2026-08-16 | Code execution: isolated judge component, queue-first submission API (design direction) | ADR-003 |
| 2026-08-16 | Docs tree, approval-first process, main-branch-only GitHub workflow | ADR-000 |
| 2026-08-16 | Email notifications deferred to Phase 7; in-app only in MVP | Charter §1.6 |
| 2026-08-16 | Platform name remains **Quizzy** | Charter §1.9 |

## Known Limitations (carried forward)

- No CI configured yet (Phase 1).
- No deployed URL yet (Phase 1+).
- MongoDB Atlas credentials from legacy `.env` were archived; a fresh local/cloud DB will be provisioned in Phase 1 (legacy credentials considered rotated).

## Next Step

Complete assessment-linked recruitment campaigns, recruiter analytics, and production email delivery in Phase 7.
