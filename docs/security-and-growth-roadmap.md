# QUIZZY — Security Audit & Growth Roadmap

**Date:** August 18, 2026 · **Author:** Manus AI
**Scope:** Security posture review against OWASP standards, answers to six strategic questions (email verification, unique user IDs, scaling, industry-standard testing, MongoDB architecture), and a reviewed verdict on the multi-tenant architecture diagram.

---

## 1. Security Audit — Where QUIZZY Stands Today

The production backend was reviewed line-by-line against the OWASP API Security Top 10. The honest summary is that QUIZZY is already **significantly more secure than most deployed student projects**, because several hardening measures were built in from day one and two real vulnerabilities were found and fixed during testing.

### 1.1 What is already secure (do not touch)

| Security Area | Current Implementation | Status |
|---|---|---|
| Security headers | Helmet.js enabled (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) | Good |
| CORS | Explicit HTTPS origin enforced in production; non-HTTPS origins crash the server at startup | Good |
| Rate limiting | Per-route limits: auth 20 req/15min, all other routes 100 req/15min, keyed on the **real client IP** from `X-Forwarded-For` (shared-proxy bug fixed in `688729e`) | Good |
| Passwords | bcrypt with **12 salt rounds** (industry standard; 10 is common, 12 is stronger), minimum 8 characters | Good |
| JWT | HS256, access 15 min / refresh 7 days, minimum 32-character secret enforced at startup, refresh tokens cannot masquerade as access tokens | Good |
| Credential errors | Login returns a single generic "Invalid email or password" for both wrong email and wrong password (prevents email enumeration) | Good |
| Data leakage | `toSafeObject` unconditionally strips the password hash and refresh token from every response (fixed in `d021ab1` after we discovered the `/api/me` leak) | Good |
| Input validation | express-validator on every endpoint: name length 2–80, email normalized, password length bounds, role checked against a whitelist enum | Good |
| Access control | Every sensitive route requires `authenticate` + `requireRole` (RBAC) | Good |
| NoSQL injection | All queries go through Mongoose with typed schemas — no raw query strings | Good |
| Audit trail | `AuditEvent` model records actor, target, action, and metadata; login/register/logout are already logged | Good |
| Session revocation | Logout destroys the refresh token; stolen access tokens die in 15 minutes | Good |
| CI/CD | 12 Jest suites (69 tests), GitHub Actions CI green, production env validation at boot | Good |

### 1.2 The gaps — and how to close them

The review found the following gaps, ranked by importance. Every fix listed is free to implement.

| # | Gap | Risk | Fix | Effort |
|---|---|---|---|---|
| 1 | **No email verification** — anyone can register with any email (including typos or fake addresses) | Spam accounts, fake test-takers, unreachable users | Email verification flow (Section 2) | Medium |
| 2 | **No password strength policy** — `12345678` passes today | Weak accounts get brute-forced | Add regex rule (min 8, must contain letter + number) + optional breach check | Low |
| 3 | **Audit trail is thin** — only auth events logged today | Cannot investigate "who saw/changed what" later | Extend `audit()` to all write endpoints (test publish, answer submit, grade override, recruitment actions) | Low |
| 4 | **No abuse reporting / account suspension workflow** | One bad actor can pollute leaderboards and quiz data | Admin endpoint to deactivate accounts (`isActive` already exists — just expose it) | Low |
| 5 | **No Content Security Policy on the frontend** | XSS via malicious quiz question text rendered unsanitized | React already escapes by default; add meta-CSP + DOMPurify for any rich content | Low |
| 6 | **No automated vulnerability scanning** | New npm dependency could bring a known CVE | Enable GitHub's free Dependabot + CodeQL analysis | Low |
| 7 | **Login success is silent** (no "new device" notification) | Stolen-credential use goes unnoticed | Nice-to-have; add email on new IP login later | Deferred |

> Note on point 5: React escapes all JSX by default, so the main XSS vector (untrusted quiz text rendered as HTML) does not exist unless we deliberately add a rich-text renderer. DOMPurify is insurance, not an emergency.

---

## 2. Email Verification — Your Concern Is Correct

Random email registration is indeed the weakest open door today. The fix is a standard verification flow that costs nothing.

**Recommended design (free, industry-standard):**

1. On registration, the server generates a 64-character crypto-random verification token, stores its hash (never the raw token) with a 24-hour expiry, and marks the user `isEmailVerified: false`.
2. A verification email with a signed link goes out immediately. Unverified users can log in and browse, but a `requireVerified` middleware blocks them from **taking tests, submitting answers, or appearing on leaderboards** — this keeps your real data clean while not stranding legitimate users whose inbox is slow.
3. A `POST /api/auth/resend-verification` endpoint (rate-limited: 3/hour per email) allows resending.
4. A `GET /api/auth/verify?token=...` endpoint flips the flag on hash match.

**Where do the emails actually get sent from (free options)?** Vercel serverless functions cannot send SMTP reliably from nowhere, so a transactional email service is needed. The honest free options:

| Service | Free Tier | Verdict |
|---|---|---|
| **Resend** | 100 emails/day, 3,000/month | Best developer experience, free domain setup |
| **Brevo (Sendinblue)** | 300 emails/day forever | Highest free volume |
| **Zoho Mail** | 1 user, 5GB | Needs your own domain |

For QUIZZY's current scale (hundreds to low thousands of users), **Resend's free tier is more than enough** — verification emails are the highest priority, and 100/day covers several dozen new registrations daily. Brevo is the backup if volume grows past that. No payment needed for either.

**Also recommended at the same time:** a real password-strength rule. Today `12345678` is accepted. Adding a simple policy ("minimum 8 characters, at least one letter and one number, no full-email match") closes the brute-force door that weak passwords leave open.

---

## 3. Unique Candidate ID — Yes, Add It, and It Is Cheap

You are right: the raw MongoDB `_id` (e.g. `6a837a77463c2f34e3c268f5`) is ugly and exposes internals. Adding a **public candidate ID** is a small change with outsized benefits for tracking and professionalism.

**Recommended design:**

- At registration, generate a human-readable ID such as `QUIZ-A7K2-M9P4` (prefix + 8 random alphanumeric characters), stored in a new `candidateId` field with a unique index.
- Show it on the user's dashboard ("Your candidate ID: QUIZ-A7K2-M9P4") and on certificates/receipts of completed tests.
- Teachers and recruiters can search and report by candidate ID without ever touching internal database keys.
- All `AuditEvent` rows already record the actor's user ID, so linking "user X did Y at time T" already works — the candidate ID just makes it presentable for exports.

This also sets up the multi-tenant diagram well: a candidate ID is tenant-agnostic, so the same identifier works when we later add organizations.

---

## 4. Scaling — Do NOT Spend Money on a Bigger Server

Your instinct to ask this before the testing period is exactly right. The honest answer after the load test:

**The current infrastructure already scales without any change.** Vercel does not run one "server" — every API call spins up serverless function instances automatically, and the load test proved the app and MongoDB handle 100 simultaneous users per second (12,000 sessions) with **zero server errors** and ~242 ms median latency.

| Scenario | Verdict | Cost |
|---|---|---|
| 1,000 concurrent real users (today) | Handled — real users split across ~10 endpoints, each endpoint ~100 concurrent, exactly where Hobby tier is comfortable | Free |
| Daily quota: 100,000 invocations/day | This is the real ceiling on the Hobby plan; one very large exam day can burn it | Free until exceeded |
| Repeated large cohorts (multiple 1,000-user exam days per month) | Upgrade to **Vercel Pro (~$20/month)** — raises concurrency and removes the daily cap | Only when needed |
| MongoDB scaling | Free tier = 1 cluster, 512 MB. Adequate now; upgrade to Atlas M10 (~$57/month) only when database approaches ~400 MB | Only when needed |

**Rule of thumb:** pay only when metrics force you to. Watching the invocation count in the Vercel dashboard near exam days is enough for now. "Increase the server" is not the right mental model here — there is no server to increase, and that is a feature, not a limitation.

---

## 5. Industry-Standard Launch Readiness — What Professional Software Does Before Launch

Here is the honest checklist of what mature teams run before launch, with a status for each on QUIZZY today. Everything recommended is free.

| Practice | What It Is | QUIZZY Today | Next Step (Free) |
|---|---|---|---|
| Unit & integration tests | Verify each module in isolation | ✅ 69 tests, 12 suites, CI green | Add edge-case suites (concurrent submissions, grade-tampering attempts) |
| End-to-end smoke tests | Real user journeys against the live app | ✅ Done at launch | Automate as a GitHub Actions workflow that runs on every deploy |
| Load testing | Prove behavior under burst traffic | ✅ 100 users/sec, 0 errors | Re-run before each major exam day |
| Security scan (SAST) | Static analysis for vulnerability patterns | ❌ Missing | Enable **GitHub CodeQL** (free for public/small repos) + Dependabot |
| Dependency audit | Known CVEs in npm packages | Partial (`npm audit`) | Dependabot alerts on; audit before each release |
| DAST (dynamic scan) | Attack the running app like a hacker | ❌ Missing | OWASP ZAP baseline scan against production (free, 15 min) |
| Monitoring & error tracking | Know when production breaks before users tell you | ❌ Missing | **Sentry free tier** (5,000 errors/month) |
| Uptime monitoring | Alert if the site goes down | ❌ Missing | **Better Stack** free tier (10 monitors) or a free GitHub Actions ping |
| Accessibility (a11y) | Usable by everyone including disabled users | ❌ Not run | Lighthouse CI on deploy (free) |
| Logging & audit | Who did what, when | Partial (auth only) | Extend `audit()` to all write endpoints (Section 1.2 #3) |
| Incident response doc | What to do when hacked / data lost | ❌ Missing | One-page runbook in `docs/` (free) |

**The three to do this week, in order:** (1) GitHub CodeQL + Dependabot — five-minute setup, catches supply-chain attacks; (2) Sentry — free, and you will wish you had it the first time production misbehaves; (3) extend audit logging to write endpoints. The rest can ride along over the following month.

---

## 6. MongoDB Architecture — Do Not Split Clusters Yet

Your idea of separating data into different sections is directionally right but the execution detail needs adjustment:

**Separation of data already exists — at the collection level, where it belongs.** QUIZZY already has distinct collections for `users`, `tests`, `questions`, `attempts`, `coding_submissions`, `assignments`, `recruitment_campaigns`, `notifications`, and `audit_events`. Queries are indexed, and collections are the correct unit of separation for this scale.

**Why separate clusters is wrong right now:**

1. The **free tier allows exactly one cluster** (512 MB, shared RAM). Paying for a second cluster just to split data adds latency (cross-cluster reads), cost, and operational complexity with zero performance benefit at current volumes.
2. MongoDB performance bottlenecks come from missing indexes, not from data living in one cluster. QUIZZY's key fields are already indexed.
3. The diagram you drew (multi-tenant) calls for **logical isolation** (an `orgId` field + query middleware on every route), not physical isolation. Logical isolation is enforced in code and costs nothing.

**When splitting does make sense:** only when you reach a paid Atlas tier (M10+) and have a genuine need — e.g., isolating recruitment/HR data for compliance reasons. That is a Year-2 problem.

---

## 7. Review of Your Multi-Tenant Diagram

I reviewed your architecture image against the actual codebase. The honest verdict:

**The diagram is correct and well thought out — it describes exactly where a serious education SaaS should go.** The six blocks (platform owner, tenant organizations, role hierarchy, invite-code onboarding, owner dashboard, audit + data isolation) are the right pillars. Two observations:

1. **The foundation already partially exists.** The recruitment module already has `Organization` and `Campaign` models with `organizationId` references, and the user's diagram's "Approval workflow" and "Audit logs" map to the existing `AuditEvent` model and RBAC middleware. The data-model work is roughly 40% done already — the remaining 60% is adding `orgId` to `User`, `Test`, `Question`, and `Attempt`, plus a tenant-scoping middleware that rejects cross-organization access.
2. **But do not build it now.** Multi-tenancy is a large architectural change (every query needs a tenant filter, all routes need re-auditing, invite-code issuance needs a service). If we build it before the testing period is done, we risk regressing the very features you need to prove first. The correct sequencing is: finish security + email verification + candidate IDs + monitoring now (they protect the current single-tenant app), then run the testing period, gather real usage data, and only then build multi-tenancy with evidence about which tenant features teachers actually use.

**Recommended sequence (all free until quota forces payment):**

| Phase | Work | Why This Order |
|---|---|---|
| Now (this week) | Email verification, candidate ID, password strength, audit extension, account suspension | Protects the app you already have |
| Week 2 | CodeQL + Dependabot, Sentry, uptime monitoring, Lighthouse | Observability before users flood in |
| Testing period | Run the app; collect real metrics (invocations, DB size, error rates) | Data drives the next decisions |
| After testing | Multi-tenant (`orgId` + invite codes + approval flow) per your diagram | Built on evidence, not guesswork |
| When quota binds | Vercel Pro → $20/mo; Atlas M10 → only if DB grows | Pay only when metrics force it |

---

## 8. Bottom Line

QUIZZY today is more secure than most shipped products at this stage — real vulnerabilities found in testing were fixed, not ignored. Your instincts on email verification, candidate IDs, and structured testing are all correct and should be acted on now, because they are free. Your instincts on scaling and splitting MongoDB should be *paused* — the current platform scales automatically and splitting clusters would cost money for no gain. Your diagram is the right long-term vision; the report above is the honest sequencing to get there without over-building before you have real users.

Say the word and I can start implementing Phase 1 (email verification + candidate ID + password strength) immediately — it requires only a free Resend account from you, which takes two minutes to create.
