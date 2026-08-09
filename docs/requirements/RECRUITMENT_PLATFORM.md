# Recruitment Platform Requirements

**Status:** Implemented in Phase 6

Quizzy recruitment connects organizations with assessment-driven candidate screening. Recruiters can create an organization, publish a hiring campaign, associate platform assessments, invite candidates by email, and review a ranked application list.

## Core workflow

1. A recruiter creates an organization and becomes its owner.
2. The recruiter creates a campaign with a role title, skills, schedule, and optional assessment reference.
3. The recruiter invites registered or unregistered candidates. Registered candidates receive an in-app notification and an application record.
4. A candidate accepts an invitation using a single-use-style expiring token and receives a started application.
5. Recruiters review scores, notes, and application states, then mark candidates as shortlisted or rejected.

## Access rules

| Capability | Recruiter | Student | Admin |
|---|---:|---:|---:|
| Create organizations | Yes | No | Yes |
| Create campaigns | Yes | No | Yes |
| Invite candidates | Yes | No | Yes |
| Accept invitations | No | Yes | No |
| View personal applications | No | Yes | No |
| View campaign ranking | Yes | No | Yes |
| Shortlist applications | Yes | No | Yes |

The recruitment API is mounted at `/api/recruitment`. Campaign and application documents retain references to the existing User and Test models so recruitment can grow into assessment execution, percentile calculation, and analytics without duplicating identity or test data.
