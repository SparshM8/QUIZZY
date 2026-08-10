# ADR-005: Assessment-Driven Recruitment Workflow

**Status:** Accepted
**Date:** 2026-08-09

## Context

Quizzy already supports questions, timed tests, coding submissions, and assignments. Recruiters need a controlled workflow that reuses those assessment primitives instead of creating a separate candidate identity or scoring system.

## Decision

Introduce a recruitment bounded context with organizations, campaigns, expiring invitations, candidate applications, ranking, and shortlisting. Campaigns reference existing tests by identifier, applications reference existing users, and recruiter authorization is represented by the platform `recruiter` role with admin override.

The first implementation uses in-app notifications and token-based invitation acceptance. Email delivery remains a Phase 7 integration so the core workflow is testable without an external provider.

## Consequences

The platform can support hiring cohorts without duplicating authentication or assessment data. Ranking can evolve from a stored score to a composite assessment score, percentile, and rubric signal. Token storage, rate limiting, and email delivery require additional production hardening before public launch.
