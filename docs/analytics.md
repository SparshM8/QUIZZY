# Analytics API

The analytics slice provides role-aware reporting for assessment owners, enrolled learners, and recruitment campaign owners. Every endpoint requires a bearer access token and is mounted under `/api/analytics`.

## Assessment overview

`GET /api/analytics/tests/:testId/overview` is available to teachers and administrators who own the assessment. It returns enrollment, distinct-learner completion, average and highest percentage scores, average submitted duration, and a five-bucket score distribution. Repeat submissions are counted in attempt totals but do not inflate the completion rate.

## Learner leaderboard

`GET /api/analytics/tests/:testId/leaderboard` is available to the assessment owner, an administrator, or an enrolled student. The response keeps the highest-scoring submitted attempt for each learner, orders rows by percentage score, and includes rank, percentile, submission time, and attempt number. In-progress attempts are intentionally excluded.

## Recruitment campaign summary

`GET /api/analytics/recruitment/campaigns/:campaignId/summary` is available to the campaign owner and administrators. It reports pending and accepted invitations, application completion rate, average scored application, and counts for each application status. The calculation treats both completed and shortlisted applications as completed funnel outcomes.

## Access-control decisions

Analytics never expose another teacher's assessment data or another recruiter's campaign data. A learner can see a leaderboard only when enrolled in that assessment, while the overview remains restricted to staff with ownership or administrative access. Invalid MongoDB identifiers return a validation error instead of reaching the database layer.

## Verification

The integration suite covers repeat-attempt deduplication, score aggregation, percentile ranking, recruiter funnel calculations, and cross-owner authorization failures. Run the backend checks with `npm test -- --runInBand analytics.test.ts`, then build the frontend with `npm run build` from `frontend/`.
