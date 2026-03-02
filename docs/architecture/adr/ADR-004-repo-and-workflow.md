# ADR-004 — Repository Strategy & Workflow

**Status:** ACCEPTED (2026-08-16)
**Deciders:** SparshM8 (approval), Manus AI (recommendation)

## Context

The rebuild must decide where it lives and how changes flow into it, under the product owner's rules: main-branch only, single contributor identity, approval-first.

## Decision

1. **Continue in `SparshM8/QUIZZY`.** The legacy codebase is archived to `legacy/` (preserving full Git history via renames). The root now hosts the new platform's documentation-first foundation, with `backend/` and `frontend/` to be created fresh in Phase 1.
2. **Main-branch-only workflow.** No feature/develop/staging branches. Commits go directly to `main`, grouped by small, reviewable units, each referencing an issue (`#NNN`).
3. **Single contributor identity.** All commits are authored under the existing account (`SparshM8`). No additional contributor identities without explicit approval.
4. **Issues per phase.** One GitHub Issue per phase (Part 0, Part 1, ...); sub-tasks as checklists/comments. Issue template: objective → requirements → tasks → plan → definition of done.
5. **Tags for milestones.** Git tags (`v0.1.0` = MVP) mark phase completions. No releases until MVP.

## Consequences

- Review happens on commit batches (via `git log`/diff at review checkpoints), not on pull requests.
- History remains continuous; legacy code is one `git log --follow` away.
- Trade-off: no parallel branch work; acceptable for a solo team and explicitly chosen.
