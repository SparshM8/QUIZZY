# ADR-001 — Technology Stack for Quizzy

**Status:** ACCEPTED (2026-08-16)
**Deciders:** SparshM8 (approval), Manus AI (recommendation)
**Supersedes:** —

## Context

The legacy codebase in `SparshM8/QUIZZY` is built on React 18, Node.js/Express, and MongoDB with Mongoose, plus Tailwind CSS on the frontend and Docker Compose tooling. The platform rebuild must choose a stack that (a) minimizes wasted learning and migration effort for a solo-sized team, (b) supports the long-term module roadmap (coding judge, multi-tenancy, analytics), (c) is deployable on free/low-cost hosting, and (d) has a large hiring/ecosystem surface.

## Alternatives Considered

| Option | Frontend | Backend | Database | Notes |
|---|---|---|---|---|
| A. Retain MERN (recommended) | React 18 + Vite + Tailwind | Node.js + Express | MongoDB + Mongoose | Continuity with legacy; huge ecosystem; document model fits heterogeneous question/attempt data |
| B. Move to TypeScript-first | React 18 + TS + Tailwind | Node + Fastify or NestJS (TS) | MongoDB | Stronger type safety and maintainability; migration cost for the whole backend |
| C. PostgreSQL + Prisma | React | Node + Express | PostgreSQL | Better for complex relational analytics/tenancy later; loses document flexibility for questions/answers |
| D. Python backend (Django/FastAPI) | React | Django or FastAPI | PostgreSQL/Mongo | Excellent for judge/analytics services; full backend rewrite cost; context-switching overhead |

## Decision

**Adopt Option A with a TypeScript adoption rule (Option B flavor):** the platform keeps React 18, Node.js/Express, MongoDB, and Mongoose. Additionally, **all new backend code is written in TypeScript** (compiled to JS at runtime, same Node/Express foundations), with a `tsconfig` strict-ish preset. Existing JavaScript is acceptable in early phases but new modules are TypeScript-only. PostgreSQL is *not* adopted now; it is listed as an explicitly reviewable option at Phase 7 (analytics/tenancy) via an ADR if query complexity justifies it.

Judging and code execution (Phase 4) will be a **separate polyglot worker component** — this is exempt from the MERN stack because it has orthogonal requirements (isolation, languages, resource limits). Its stack decision belongs to ADR-003.

## Consequences

- Positive: near-zero migration cost; legacy code serves as a reference implementation for question/exam/certificate flows; one language across the stack; fast iteration for a small team.
- Positive: TypeScript on new code reduces runtime-class bugs in the test engine, where correctness is critical.
- Trade-off: MongoDB schema flexibility means discipline is required (Zod/Joi validation + Mongoose schemas + tests) to keep the question/attempt data model sane.
- Risk: relational reporting (cross-module analytics) may be awkward in Mongo; acceptable until Phase 7, where an ADR can introduce read-model materialization (aggregation pipeline or a sidecar PostgreSQL) if needed.
- Migration difficulty later: low for frontend; moderate for backend (TS now eases a future Fastify/Nest move); high for a database swap (deferring that decision is itself the rationale).
