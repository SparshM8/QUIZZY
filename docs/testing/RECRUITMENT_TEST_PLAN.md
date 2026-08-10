# Recruitment Test Plan

The recruitment module is verified at the HTTP boundary with an isolated MongoDB test database. The integration suite covers recruiter organization and campaign creation, invitation creation for registered candidates, invitation acceptance, personal application retrieval, recruiter ranking, score and status updates, and role-based rejection of student organization creation.

The test plan also requires regression coverage for campaign ownership, expired invitation tokens, duplicate applications, recruiter-only ranking access, and preservation of candidate privacy when recruiter notes are returned to the candidate. These cases are the next hardening targets before production email delivery.
