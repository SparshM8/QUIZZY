# ADR-003 — Code Execution & Judging Architecture (Forward-Looking)

**Status:** PROVISIONAL — design direction agreed; concrete vendor/implementation to be chosen in Phase 4
**Deciders:** SparshM8 (general approval), Manus AI (recommendation)

## Context

The coding platform (Phase 4) must compile and execute untrusted user-submitted code with time/memory limits, hidden test cases, and scoring. Executing such code on the main application server is never acceptable (per Rule 10). The architecture decision must be made now, in outline, because it affects integration points (submission API, result webhooks, test case storage), even though implementation is deferred.

## Principles

1. Code execution runs in an **isolated component** (the "Judge") with no trust relationship to the app server.
2. The Judge is a **separate deployable** with a small, versioned HTTP/gRPC contract.
3. Submissions are **queued** (never executed synchronously in the request path).
4. Sandboxing uses a proven runtime (e.g., containerized execution with resource limits, or a battle-tested judge service), not a homegrown sandbox.
5. The app server stores results received from the Judge; the Judge never touches the primary database directly.

## Direction

The provisional direction is **app server → submission queue (in-repo job queue initially, e.g., BullMQ backed by Redis when Phase 4 arrives) → Judge workers (containerized, e.g., Piston or an isolated Docker runner) → result callback**. A managed/external judge (e.g., Judge0 self-hosted) is a viable alternative to be compared in the Phase 4 ADR on equal footing. Plagiarism detection, contests, and leaderboards remain Phase 4+/7 features.

## Consequences

- The submission/result APIs must be designed queue-first from Phase 3 (a normal sync REST call over a queue transport later).
- Phase 1–3 infrastructure decisions should not preclude adding Redis/containers (Docker Compose already present in the legacy tooling).
- This ADR will be finalized with a concrete implementation choice at the start of Phase 4.
