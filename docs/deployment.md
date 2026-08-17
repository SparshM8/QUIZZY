# QUIZZY Deployment Preparation

QUIZZY is prepared as a two-project cloud application: the Express/Mongoose API runs as a Vercel Node.js serverless function from `backend/`, while the Vite-built React single-page application is deployed as a Vercel static project from `frontend/`. MongoDB is a separate stateful service hosted by MongoDB Atlas. The included Docker Compose file remains available for local staging.

## Required production configuration

The API requires a strong `JWT_SECRET` in production. `MONGODB_URI` must point to a durable MongoDB deployment, and `CORS_ORIGIN` should be set to the public frontend origin when the API is exposed separately. Access and refresh token lifetimes can be adjusted with `JWT_ACCESS_EXPIRY` and `JWT_REFRESH_EXPIRY`.

| Variable | Required | Purpose |
|---|---:|---|
| `JWT_SECRET` | Yes | Signs and verifies access and refresh tokens |
| `MONGODB_URI` | Yes | Durable MongoDB connection string |
| `CORS_ORIGIN` | Yes for split hosting | Allowed browser origin |
| `PORT` | No | API listening port; defaults to `5000` |
| `JWT_ACCESS_EXPIRY` | No | Access-token lifetime; defaults to `15m` |
| `JWT_REFRESH_EXPIRY` | No | Refresh-token lifetime; defaults to `7d` |

The `/api/health` endpoint is the liveness check, while `/api/health/ready` is the readiness check and returns HTTP 503 until MongoDB is connected. The API process exits during production startup when the production configuration is unsafe: `JWT_SECRET` must be at least 32 characters, `MONGODB_URI` cannot point to localhost, and `CORS_ORIGIN` must use HTTPS. `APP_VERSION` can be set to the release identifier shown by the health endpoints.

## Recommended no-cost cloud deployment

For a device-independent personal deployment, use **Vercel Hobby for the API and frontend together with a MongoDB Atlas Free Cluster**. The backend has a dedicated `backend/api/index.ts` serverless adapter and `backend/vercel.json`; the frontend has `frontend/vercel.json` for Vite builds and SPA route fallback. This route does not require an always-on computer. Vercel Hobby serverless functions are subject to execution, bandwidth, and request-size limits, while MongoDB Atlas Free Clusters have limited storage and no managed backups, so this setup is appropriate for a personal demo or learning deployment rather than a business-critical service.

1. Create a MongoDB Atlas Free Cluster and database user. Copy its `mongodb+srv://` connection string, but do not commit or send it through chat.
2. In Vercel, import `SparshM8/QUIZZY` as a project with the **Root Directory** set to `backend`. Keep the `main` branch and `backend/vercel.json` as the deployment configuration.
3. Add these backend environment variables in the Vercel project dashboard: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `JWT_ACCESS_EXPIRY=15m`, `JWT_REFRESH_EXPIRY=7d`, `CORS_ORIGIN=https://<frontend-project>.vercel.app`, and `APP_VERSION=1.0.0`.
4. Deploy the backend and verify `https://<backend-project>.vercel.app/api/health` and `https://<backend-project>.vercel.app/api/health/ready`.
5. Create a second Vercel project from the same repository with **Root Directory** set to `frontend`. Add `VITE_API_URL=https://<backend-project>.vercel.app` and deploy it.
6. Copy the final frontend URL into the backend project's `CORS_ORIGIN` variable, redeploy the backend, and verify that browser requests succeed.
7. Create the first admin account only after both health endpoints are healthy and the frontend can complete a login flow.

The Vercel project settings deliberately keep `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` in the dashboard. The Render Blueprint is retained only as a container-platform reference; the current Render Hobby workspace does not accept a `free` web-service plan.

## Container smoke test

Set a secret in the shell and start the stack with `docker compose up --build`. The frontend is available at `http://localhost:8080`, and its Nginx configuration proxies `/api/*` to the backend service. Check `http://localhost:8080/api/health` before signing in. Stop the stack with `docker compose down`; add `-v` only when intentionally deleting the local MongoDB volume.

## CI readiness

GitHub Actions now uses the committed `package-lock.json` files with `npm ci`, points integration tests at `TEST_MONGO_URI`, cancels obsolete concurrent runs, and executes backend type-checking, linting, tests, frontend type-checking, linting, and production build. The workflow does not store deployment secrets and is safe to run for pull requests.

For a hosted deployment, create the MongoDB database first, configure the API environment variables in Vercel, deploy the backend project, and then deploy the frontend project with `VITE_API_URL` pointing to the backend URL. The free deployment research and source links are recorded in `docs/free-deployment-research.md`. The release candidate reports zero production dependency vulnerabilities through `npm audit --omit=dev --audit-level=high`. Do not commit `.env` files or production credentials.
