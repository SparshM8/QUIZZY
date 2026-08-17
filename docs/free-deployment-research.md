# Free Deployment Research

## Recommended architecture

Use Render free services for the Node/Express backend and the React static frontend, with MongoDB Atlas Free Cluster as the hosted database. This keeps the user's device out of the runtime path and matches the repository's Docker and Git-based deployment workflow.

## Source findings

- Render free web services and static sites are available at no charge, but free web services spin down after 15 minutes of inactivity, can take about one minute to wake, have ephemeral filesystems, and receive 750 free instance hours per workspace per month. Render explicitly says free instances are intended for hobby projects/testing rather than production applications: https://render.com/docs/free
- Render's current pricing page lists a $0 Hobby workspace, free static sites, free web services, automatic HTTPS, Git auto-deploys, Docker builds, environment variables, and 5 GB monthly bandwidth on the Hobby workspace: https://render.com/pricing
- Vercel Hobby is free and supports personal projects, but its official documentation restricts the Hobby plan to personal, non-commercial use. It is suitable for a personal frontend, but Render provides one consistent provider for both frontend and backend: https://vercel.com/docs/plans/hobby
- MongoDB Atlas Free Clusters provide 0.5 GB storage, 500 maximum connections, one free cluster per project, no managed backups, and rolling data-transfer limits. These constraints are acceptable for an educational project but require manual backup discipline: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/

## Decision

Proceed with Render for the frontend and backend plus MongoDB Atlas Free Cluster. The user must create/authorize the accounts and enter secrets in provider dashboards; secrets should not be sent in chat or committed to GitHub.


## Dashboard verification on August 17, 2026

The authenticated Render Blueprint flow rejected the API service declaration with `services[1].plan: no such plan free for service type web` in the Hobby workspace, so Render cannot provide the required no-cost backend service for this deployment.

The authenticated Vercel New Project flow recognized `SparshM8/QUIZZY` and detected two services: `frontend` at the repository `frontend` root using Vite, and `backend` at the `backend` root using Express with the `/api` function directory. Vercel displayed a multi-service configuration with `/api(/.*)?` rewrites to the backend service and all other paths routed to the frontend service. The dashboard indicated that a root `vercel.json` is required for this multi-service deployment. Official references: https://vercel.com/docs/plans/hobby, https://vercel.com/docs/functions/limitations, and https://render.com/docs/free.

These findings confirm that a single Vercel project with two services is the preferred no-cost architecture, provided the repository includes the dashboard-generated root service configuration and dashboard-entered secrets remain outside Git.
