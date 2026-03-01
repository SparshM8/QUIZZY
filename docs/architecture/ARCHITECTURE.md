# Quizzy — System Architecture Overview

**Status:** APPROVED high-level outline (Part 0); detailed module architecture per phase
**Last updated:** 2026-08-16

## Design Principles

The architecture must serve a small team building a large roadmap incrementally. Four principles govern it: **modularity** (each module is an independently evolvable unit behind a stable contract), **separation of delivery and judging** (nothing untrusted ever runs near the application server), **document-model flexibility with validation discipline** (MongoDB for heterogeneous question/attempt data, with strict schemas and validation), and **stateless API** (every API node is horizontally scalable).

## High-Level Structure (Phase 1–3)

```
                          ┌─────────────────────────────────────┐
                          │            Frontend (React 18)      │
                          │  Vite + Tailwind, role-based views  │
                          └──────────────┬──────────────────────┘
                                         │ HTTPS/REST (JWT)
                          ┌──────────────▼──────────────────────┐
                          │        Backend (Node + Express)     │
                          │  Auth │ Users │ Questions │ Tests   │
                          │  Delivery │ Evaluation │ Analytics  │
                          │  Notifications │ Admin/Audit        │
                          └──────────────┬──────────────────────┘
                                         │ Mongoose
                          ┌──────────────▼──────────────────────┐
                          │       MongoDB (primary store)       │
                          └─────────────────────────────────────┘

Phase 4 adds:
   Submissions API ──► Submission Queue (BullMQ/Redis) ──► Judge Workers (isolated containers)
                                                                    │
                                                           result callback
```

## Module Map

| Module | Responsibility | Boundary Contract |
|---|---|---|
| Identity | Registration, login, JWT issue/refresh, session revocation, profiles | Auth middleware + role checks |
| Questions | CRUD for all question types, tags/topics/difficulty, moderation state | Question documents with type discriminator (`mcq`, `multi_select`, `tf`, `fill`, `numerical`, `subjective`, `coding`) |
| Tests | Assembly (test ← questions), scheduling, instructions, marking scheme | Test documents + enrollment lists |
| Delivery | Exam session, timer, navigation rules, autosave, auto-submit | Session state documents; heartbeat endpoint |
| Evaluation | Objective auto-scoring, subjective grading queue, result publication | Attempt documents + score pipeline |
| Analytics | Aggregations over attempts (per test, per question, per user) | Read-only aggregation views |
| Notifications | In-app notification store + delivery | Event → notification mapping |
| Admin | User management, moderation actions, audit log | Admin-only endpoints; every action audited |
| Judge (Phase 4) | Compile/run user code in isolated containers, apply test cases, report verdicts | Submission/result queue contract (ADR-003) |

## Key Cross-Cutting Concerns

**Security** is enforced at middleware level (auth, RBAC, rate limiting, validation) and at design level (judging isolation, upload sanitization). **Audit logging** is an append-only event stream for admin actions and grading events. **Observability** starts with structured JSON logging.

## Deployment Topology (target)

Local and CI: Docker Compose (API, MongoDB, Redis from Phase 4, frontend served statically). Production target (Phase 8): containerized API behind a reverse proxy with managed MongoDB; judge on separate nodes.

## Open Architectural Decisions (to be resolved in later ADRs)

| ADR | Topic | Phase |
|---|---|---|
| ADR-003 (finalized) | Judge implementation: self-hosted runner vs. Judge0 | Phase 4 |
| TBD | Submission queue technology (BullMQ+Redis vs. alternatives) | Phase 4/5 |
| TBD | Read-model for cross-module analytics (aggregation pipeline vs. sidecar PostgreSQL) | Phase 7 |
| TBD | Multi-tenancy model (shared DB + org_id vs. sharded) | Phase 6/8 |
| TBD | Anti-cheating/proctoring design | Phase 7 |
