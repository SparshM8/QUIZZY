# Quizzy — Project Charter

**Status:** APPROVED (Part 0 — Project Foundation, ratified 2026-08-16)
**Repository:** [SparshM8/QUIZZY](https://github.com/SparshM8/QUIZZY)
**Version:** 1.0
**Product Owner:** SparshM8
**Engineering Partner:** Manus AI (Senior Software Architect / Technical PM / Engineer)

---

## 1.1 Project Overview

Quizzy is being rebuilt from a clean foundation as a comprehensive, professional-grade **assessment and recruitment platform**. It will provide quiz and MCQ systems, online examinations, mock tests, question banks, coding tests and contests with secure code execution, assignments and project submissions, teacher and recruiter evaluation workflows, candidate management and shortlisting, student and candidate analytics, leaderboards, organizations and institutions, notifications, certificates, anti-cheating and proctoring capabilities, and role-based administration — all under one modular, secure, and scalable architecture.

## 1.2 Vision Statement

> A single platform where institutions, teachers, recruiters, and candidates can design, deliver, and evaluate assessments of any format — from a classroom quiz to a competitive coding contest to a full recruitment campaign — securely, at scale, and with actionable analytics.

## 1.3 Problem Statement

Assessment today is fragmented across tools: quizzes live in one product, coding tests in another, formal examinations in a third, and assignments in yet another. Commercial platforms charge per-seat pricing that becomes prohibitive for institutions, lock users into proprietary workflows, and offer limited customization. Open-source quiz tools generally lack the security guarantees — isolated code execution, proctoring-grade anti-cheating, verifiable certification — required for high-stakes use. Critically, no single open platform unifies all assessment formats under one identity and analytics layer, leaving institutions unable to see a learner's or candidate's performance holistically. Quizzy solves all four problems by consolidating assessment formats under one secure, analyzable, and self-hostable system.

## 1.4 Goals & Success Criteria

| Goal | Success Criterion |
|---|---|
| Ship MVP ("Assessment Core") | A teacher can create a mixed-format quiz, students take it under a timer with lossless auto-submit, results and basic analytics are visible, and the flow passes an agreed acceptance test suite on a deployed URL |
| Modular architecture | Each Phase 1–8 module can be enabled/incremented independently without rewriting others |
| Security baseline | OWASP Top 10 mitigations in place from Phase 1; code execution always isolated (Phase 4 onward) |
| Quality bar | Every phase meets the Definition of Done, including tests, documentation, and product-owner sign-off |
| Self-hostable & deployable | One-command local setup; production deployment documented (Phase 8) |

## 1.5 Target Users & Personas

| Persona | Description | Key Needs |
|---|---|---|
| Administrator | Owns platform configuration, moderation, users, audit logs | Control, visibility, safety |
| Teacher / Faculty / Institution | Creates question banks and tests, schedules exams, grades, reviews analytics | Expressive assessment authoring, reliable delivery, analytics |
| Student / Candidate | Takes quizzes, exams, coding tasks; views results, certificates, leaderboards | Fair, reliable, responsive assessment experience |
| Recruiter / Organization | Runs assessment campaigns, invites candidates, ranks and shortlists | Campaign workflows, candidate reports, shortlisting (Phase 6) |
| Super Administrator | Multi-tenant oversight, platform-wide moderation and configuration | Governance at platform scale (Phase 8) |

## 1.6 Scope

**In scope (MVP, Phases 1–3):** Identity (admin/teacher/student), question bank (6+ types incl. stubbed coding), quiz/test engine with timer and auto-submit, basic scheduled exam mode, core analytics, in-app notifications, basic administration with moderation and audit logging.

**In scope (long term, Phases 4–8):** Full coding platform with judge and sandboxing, assignments and projects, recruitment platform, advanced analytics and leaderboards, notifications with email, anti-cheating and proctoring, certificates with verification, multi-tenancy, performance/observability hardening, CI/CD, and production deployment.

## 1.7 Out of Scope (for now)

Mobile native apps, marketplace/monetization features, LMS course content delivery (video lectures, SCORM), live whiteboard collaboration, and offline-first exam taking. These may be reconsidered in later phases if justified by requirements.

## 1.8 Guiding Principles

1. **Approval before implementation.** No code, file, configuration, dependency, or architecture change without the product owner's explicit go-ahead; every phase ends with a review checkpoint.
2. **Main branch only.** All approved work lands directly on `main`, as small, reviewable, issue-linked commits. No feature branches unless the rule is explicitly changed.
3. **Foundation over features.** Clean module boundaries, stable data contracts, and maintainability over early optimization.
4. **Security by default.** All input untrusted; all code execution sandboxed; security findings fixed immediately.
5. **Code without tests does not exist.** Every phase ships with its defined testing strategy.
6. **Documentation is a deliverable.** Decisions get ADRs; modules get docs; the docs tree evolves with the code.
7. **Explicit status labels.** Every proposal is DECIDED, PROPOSED, or an OPEN QUESTION; proposals are never silently treated as requirements.
8. **Keep the owner informed.** Every stage ends with: done, remaining, decisions, risks, and what is needed.

## 1.9 Assumptions & Constraints

| Assumption / Constraint | Rationale |
|---|---|
| Team = product owner + Manus AI | Solo-sized team; architecture must stay manageable for a small team |
| Solo developer tooling | Free-tier CI (GitHub Actions) and free-tier hosting targets |
| Existing repo `SparshM8/QUIZZY` continues | Legacy code archived in `legacy/`; history preserved |
| Platform name remains **Quizzy** | Cheap to rename later, decided now to avoid churn |
| English as working language | Documentation and UI default to English; i18n deferred |

## 1.10 Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Scope creep against a small team | High | Strict MVP definition + phase gates with owner sign-off |
| Judge/security complexity underestimated (Phase 4) | High | ADR-driven design; isolation from day 0 of coding features; progressive validation |
| Database schema churn during early phases | Medium | Schema decisions via ADR; migrations tooling from Phase 1 |
| Dependency on single contributor | Medium | Heavy documentation so any engineer can pick up context |
| Free-tier hosting limits | Medium | Deployment targets documented; architecture stateless where possible |

## 1.11 Stakeholders & Roles

The **product owner** (SparshM8) holds all requirement, scope, and approval authority. **Manus AI** acts as architect, engineer, QA, DevOps, security advisor, and documentation owner, but never unilaterally. No other contributor identities will be introduced without explicit approval (per repository rule 5).

## 1.12 Approval History

| Date | Decision | Approved By |
|---|---|---|
| 2026-08-16 | Part 0 — Project Foundation proposals, including charter, MVP scope, roadmap, and tech-stack defaults | SparshM8 (verbal approval: "start with what you think is right") |
| 2026-08-16 | Repository decision: continue in `SparshM8/QUIZZY`; legacy code archived to `legacy/` | SparshM8 (via general approval) |
| 2026-08-16 | Tech stack (ADR-001): MERN (React 18 + Vite, Node/Express, MongoDB/Mongoose) retained from legacy stack | SparshM8 (via general approval) |
| 2026-08-16 | Email deferred to Phase 7; MVP notifications are in-app only | SparshM8 (via general approval) |
