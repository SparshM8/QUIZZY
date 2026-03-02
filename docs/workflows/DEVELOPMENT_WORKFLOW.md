# Development Workflow & Definition of Done

**Status:** APPROVED (Part 0)
**Last updated:** 2026-08-16

## Per-Feature Lifecycle

Every piece of work follows the lifecycle mandated by the product owner:

**Requirement → Analysis → Architecture → Issue → Planning → Implementation → Testing → Review → Documentation → Completion**

Concretely, for each phase (Part N):

1. **Plan draft.** Manus AI drafts the phase plan: objective, requirements (numbered FR/NFR references), tasks, risks, and acceptance criteria; delivers it to the product owner.
2. **Approval.** Work begins only after explicit approval. No silent starts (Rule 2).
3. **Issue creation.** A GitHub Issue is created/updated for the phase with the approved plan as its body.
4. **Documentation first.** Architecture/module docs and ADRs (where relevant) are committed before code.
5. **Implementation.** Small, reviewable commits on `main`, each referencing the issue (`#NNN`). No branches (Rule 6).
6. **Testing.** The phase's defined test suite passes; results are reported with evidence (test output, screenshots, URLs).
7. **Review checkpoint.** The product owner reviews; findings are fixed.
8. **Completion summary.** Manus AI reports: done, remaining, decisions made, risks, and what is needed. Product owner sign-off marks the phase complete; `docs/progress/progress.md` and the charter's approval history are updated; an optional Git tag is applied.

## GitHub Workflow

| Aspect | Rule |
|---|---|
| Repository | `SparshM8/QUIZZY` (legacy code archived in `legacy/`) |
| Branch | `main` only; no feature/develop/staging branches |
| Issues | One issue per phase; sub-tasks as checklists |
| Commits | Direct to `main`; small units; message references issue (`#NNN`) |
| Identity | Solely the product owner's account |
| Tags | Milestone tags (e.g., `v0.1.0` = MVP) |
| PRs | Not used (no branches); review happens at completion checkpoints |

## Definition of Done (every phase and every feature)

| # | Criterion |
|---|---|
| 1 | All tasks in the approved plan implemented and committed to `main` |
| 2 | Defined test suites pass (locally and in CI, when configured) |
| 3 | Manual acceptance of the user-visible flow succeeds, with evidence shared |
| 4 | Relevant docs (ADR / module / requirements / progress) updated and committed |
| 5 | No known medium/high-severity bugs; low-severity items listed as known limitations |
| 6 | Product owner has reviewed and approved the completion summary |

A phase is "complete" only when criterion 6 is satisfied.

## Status Labeling Convention

All proposals and decisions carry one of three labels, never omitted:

- **DECIDED** — explicitly approved by the product owner.
- **PROPOSED** — recommended by Manus AI, not yet approved.
- **OPEN QUESTION** — requires a product-owner decision before it can proceed.

## Environment Setup (target, to be finalized in Phase 1)

The target developer experience: `docker compose up -d` brings up MongoDB (+ Redis from Phase 4); `npm run dev` starts the API on :5000 and the frontend on :3000; seeds available via `npm run seed` behind an explicit approval step.
