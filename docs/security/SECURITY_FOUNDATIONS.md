# Security Foundations

**Status:** APPROVED baseline (Part 0); threat model expanded per phase
**Last updated:** 2026-08-16

This document defines the security baseline every phase must meet, per Rule 10 (Security First). It is the minimum; phases may add further controls, which then become part of the baseline.

## Authentication & Session Security

- Passwords hashed with **bcrypt** (cost ≥ 12).
- **JWT** access tokens with short expiry (≤ 15 min) plus refresh tokens; refresh rotation and revocation capability from Phase 1.
- Server-side RBAC enforcement on every privileged endpoint (never UI-only).
- Rate limiting on auth endpoints and submission hot paths.

## API & Input Security

- All input validated server-side (schema validation on every write endpoint).
- CORS restricted to known origins; security headers via Helmet.
- File uploads (avatars, later submissions) validated by type/size, stored with randomized names, served safely.

## Assessment Integrity

- Question banks and answers never exposed to takers via API responses (only selected, sanitized question views).
- Answer autosave/heartbeat endpoints authenticated and rate-limited to prevent flooding.
- Submission tampering detected by server-side validation of attempts against session state.

## Code Execution (Phase 4+)

- User code **never** executes on the application server.
- Execution only in isolated containers with strict CPU/memory/time limits and no network egress (detailed in ADR-003).
- Judge component holds minimal privileges and cannot reach the primary database directly.

## Audit & Privacy

- Append-only audit log of admin actions, grading actions, and security events.
- Minimal PII collection; no biometric/proctoring data without explicit consent (Phase 7).
- Secrets managed in environment variables; never committed (`.env` gitignored; repo history checked).

## Known Baseline Gaps (to be closed progressively)

| Gap | Target Phase |
|---|---|
| Full threat model document per module | Phase 3 |
| Security-focused test suite (auth bypass, injection, rate-limit tests) | Phase 1–3 incrementally |
| 2FA / SSO | Phase 8 (or earlier if recruiter use demands it) |
| Proctoring controls (tab detection, focus tracking, camera) | Phase 7 |
| Penetration test of MVP before MVP tag | Pre-v0.1.0 |
