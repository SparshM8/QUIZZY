# QUIZZY Deployment Preparation

QUIZZY is prepared as a two-service application: the Express/Mongoose API runs in `backend/`, while the Vite-built React single-page application is served by Nginx from `frontend/`. MongoDB is a separate stateful service. The included Docker Compose file is suitable for local staging and can be adapted to a managed container platform.

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

For a device-independent personal deployment, use the included `render.yaml` Blueprint with a Render Free web service for the API, a Render Free static site for the frontend, and a MongoDB Atlas Free Cluster for MongoDB. This route requires no always-on computer, but Render Free web services sleep after inactivity and may take about a minute to wake. MongoDB Atlas Free Clusters have limited storage and no managed backups, so this setup is appropriate for a personal demo or learning deployment rather than a business-critical production service.

1. Create a MongoDB Atlas Free Cluster and database user. Copy its `mongodb+srv://` connection string.
2. In Render, choose **New → Blueprint**, connect the `SparshM8/QUIZZY` GitHub repository, and select the `render.yaml` file.
3. When prompted, enter `MONGODB_URI` and a generated `JWT_SECRET` in Render's dashboard. Do not commit either value.
4. Deploy `quizzy-api` first and copy its public HTTPS URL.
5. Set the frontend service's `VITE_API_URL` to that API URL, then deploy `quizzy-frontend`.
6. Update the API service's `CORS_ORIGIN` to the final frontend HTTPS URL and redeploy the API.
7. Verify both `https://<api-host>/api/health` and `https://<api-host>/api/health/ready` before creating the first admin account.

The repository's `render.yaml` intentionally marks secrets and `VITE_API_URL` as dashboard-entered values because service hostnames are assigned by Render and credentials must never be stored in Git.

## Container smoke test

Set a secret in the shell and start the stack with `docker compose up --build`. The frontend is available at `http://localhost:8080`, and its Nginx configuration proxies `/api/*` to the backend service. Check `http://localhost:8080/api/health` before signing in. Stop the stack with `docker compose down`; add `-v` only when intentionally deleting the local MongoDB volume.

## CI readiness

GitHub Actions now uses the committed `package-lock.json` files with `npm ci`, points integration tests at `TEST_MONGO_URI`, cancels obsolete concurrent runs, and executes backend type-checking, linting, tests, frontend type-checking, linting, and production build. The workflow does not store deployment secrets and is safe to run for pull requests.

For a hosted deployment, create the MongoDB database first, configure the API environment variables in the hosting provider, deploy the backend, and then deploy the frontend with `VITE_API_URL` pointing to the backend URL. The free deployment research and source links are recorded in `docs/free-deployment-research.md`. The release candidate currently reports zero production dependency vulnerabilities through `npm audit --omit=dev --audit-level=high`. Do not commit `.env` files or production credentials.
