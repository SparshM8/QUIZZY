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

## Container smoke test

Set a secret in the shell and start the stack with `docker compose up --build`. The frontend is available at `http://localhost:8080`, and its Nginx configuration proxies `/api/*` to the backend service. Check `http://localhost:8080/api/health` before signing in. Stop the stack with `docker compose down`; add `-v` only when intentionally deleting the local MongoDB volume.

## CI readiness

GitHub Actions now uses the committed `package-lock.json` files with `npm ci`, points integration tests at `TEST_MONGO_URI`, cancels obsolete concurrent runs, and executes backend type-checking, linting, tests, frontend type-checking, linting, and production build. The workflow does not store deployment secrets and is safe to run for pull requests.

For a hosted deployment, create the MongoDB database first, configure the API environment variables in the hosting provider, deploy the backend, and then deploy the frontend with the API proxy or an equivalent same-origin reverse proxy. The release candidate currently reports zero production dependency vulnerabilities through `npm audit --omit=dev --audit-level=high`. Do not commit `.env` files or production credentials.
