# Testing Strategy

**Status:** APPROVED (Part 0); per-phase test plans appended progressively
**Last updated:** 2026-08-16

## Philosophy

Per Rule 11, code without tests does not exist. Tests are written alongside code, and a phase is not complete until its defined test suites pass and evidence is shared with the product owner.

## Test Levels & Ownership

| Level | What | Tools (proposed) | Target |
|---|---|---|---|
| Unit | Pure logic: scoring, question validation, timer math, role checks | Jest + Supertest (backend), Vitest/Jest (frontend logic) | ≥ 80% coverage on core engine modules |
| Integration | API contracts: auth, CRUD, session, submission flows against a real DB (dockerized test DB) | Jest + Supertest + in-memory/docker Mongo | All public endpoints covered |
| E2E | Critical user journeys: register → create test → take test → auto-submit → results → analytics | Playwright | MVP journey + regression suite |
| Security | Auth bypass attempts, injection, rate limiting, upload abuse | Custom scripts + manual pentest checklist | Pre-MVP pentest pass |
| Performance | Load on delivery/session endpoints (simulated concurrent takers) | k6 | Session writes < 200 ms p95 at target concurrency (Phase 3+) |
| Judge (Phase 4) | Malicious submissions, resource exhaustion, language matrix | Dedicated judge test harness | Zero escapes; all verdicts correct on known suites |

## Rules

1. **Test plan first.** Each phase plan includes its testing strategy; approval covers it.
2. **CI gating.** GitHub Actions runs unit + integration suites on every push to `main` (configured in Phase 1).
3. **Evidence.** Completion summaries include test output; E2E results include screenshots/recordings.
4. **Edge cases mandatory.** Timeouts, concurrent autosaves, network failure during submission, and negative-marking edge cases get explicit tests.

## Phase Test Plans (appended as phases complete)

- Phase 1: unit (bcrypt/JWT/role middleware), integration (auth + user APIs), seed verification.
- Phase 2: unit (question schemas, validation), integration (question CRUD, moderation).
- Phase 3: unit (scoring, timer, autosave), integration (delivery + submission APIs), E2E (full test journey), security pentest of MVP.
- Phase 4+: judge harness, submission queue tests, contest flow tests.
