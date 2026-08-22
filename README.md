# Quizzy Placement Pro

**Quizzy Placement Pro** is a comprehensive, industry-grade assessment and placement preparation platform designed for colleges and recruitment drives. It combines advanced AI proctoring, multi-language coding challenges, and deep performance analytics into a single, high-performance ecosystem.

## Documentation (Start Here)

| Document | Purpose |
|---|---|
| [Project Charter](docs/charter/CHARTER.md) | Vision, problem statement, scope, personas, principles, approval history |
| [Roadmap](docs/charter/ROADMAP.md) | Phase 0–8 plan with entry/exit criteria and milestone tags |
| [Architecture Overview](docs/architecture/ARCHITECTURE.md) | High-level system design and module map |
| [Requirements Overview](docs/requirements/REQUIREMENTS_OVERVIEW.md) | FR/NFR categories and initial targets |
| [Development Workflow & Definition of Done](docs/workflows/DEVELOPMENT_WORKFLOW.md) | How we work: lifecycle, GitHub rules, DoD |
| [Security Foundations](docs/security/SECURITY_FOUNDATIONS.md) | Security baseline every phase must meet |
| [Testing Strategy](docs/testing/TESTING_STRATEGY.md) | Test levels, tools, and per-phase plans |
| [Architecture Decision Records](docs/architecture/adr/) | ADR-000 (docs & process), ADR-001 (tech stack), ADR-002 (MVP scope), ADR-003 (code execution), ADR-004 (repo & workflow) |
| [Progress Tracking](docs/progress/progress.md) | Phase statuses, decision log, known limitations |

**Proposals under review** live in [`docs/proposals/`](docs/proposals/) and are never treated as approved until moved into the canonical documents.

## Repository Layout

| Path | Content |
|---|---|
| `docs/` | All project documentation (see above) |
| `legacy/` | Archived previous-generation codebase (React + Node + MongoDB), preserved for reference |
| `backend/` | *(Phase 1)* New backend application (Node.js/Express, TypeScript) |
| `frontend/` | *(Phase 1)* New frontend application (React 18 + Vite + Tailwind) |

## Tech Stack (ADR-001)

Frontend: **React 18 + Vite + Tailwind CSS**. Backend: **Node.js + Express (TypeScript for new code)**. Database: **MongoDB + Mongoose**. Judge (Phase 4): separate isolated component per [ADR-003](docs/architecture/adr/ADR-003-code-execution-architecture.md).

## Working Rules (Summary)

1. No implementation without explicit product-owner approval.
2. Work part by part; every phase ends with a review checkpoint and sign-off.
3. Main branch only; commits reference issues.
4. Document everything; label every proposal DECIDED / PROPOSED / OPEN QUESTION.
5. Security first; testing required; keep the owner informed.

Full rules and the Definition of Done are in [Development Workflow](docs/workflows/DEVELOPMENT_WORKFLOW.md).

## Status

**Phase 0 — Project Foundation: COMPLETE** (2026-08-16). Next: Phase 1 — System Foundation (pending product-owner kickoff).
