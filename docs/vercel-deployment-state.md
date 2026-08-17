# Vercel Deployment State — August 17, 2026 (updated after build failure debugging)

## Architecture
Single Vercel project with two services: `frontend` (root `frontend`, Vite) and `backend` (root `backend`, Express at `/api`). Root `vercel.json` (commit `a0b50cf`) declares both services with `/api(/.*)?` rewrite to backend and `/(.*)` to frontend. Backend `backend/vercel.json` (commit `6f3fb0e`) adds `"entrypoint": "api/index.ts"` plus functions/routes.

## Vercel project (verified via MCP)
- Team ID: `team_hrvAvsYjIV6IWNGyKOYZoNav`, slug `sparsh-mishras-projects-870ea013`, name "Sparsh Mishra's projects" (Hobby).
- Project name `quizzy`, ID `prj_NOJfxKdJnTRyO0hpywyQfb4h2VrO`. URL: `quizzy-cliuq1lgr-sparsh-mishras-projects-870ea013.vercel.app` (currently ERROR).
- Env vars added via dashboard: MONGODB_URI, JWT_SECRET, NODE_ENV=production, JWT_ACCESS_EXPIRY=15m, JWT_REFRESH_EXPIRY=7d, APP_VERSION=1.0.0 (all Production and Preview). CORS_ORIGIN pending until frontend URL final.

## Deployment history
- `dpl_9kYxcwKgyH36KYipUTPBPR3QooTM` (commit `a0b50cf`): ERROR — `Service "backend" detected framework "express" in "backend" and must specify an "entrypoint" for runtime "node".`
- `dpl_ALSWZx1K5LGzuPxNHVtBvf9nMEtD` (commit `6f3fb0e`): still ERROR as of 10:34:51 UTC — the push may not have retriggered yet, or the entrypoint fix is insufficient. NEED to inspect build logs for this deployment via MCP or dashboard.

## Current hypothesis
The `entrypoint` in `backend/vercel.json` may not be read in multi-service mode, or the `buildCommand` TypeScript output (`npm run build`) must emit compiled JS before the function is evaluated. Options to try next:
1. Inspect latest deployment build logs to see exact error for commit `6f3fb0e`.
2. If still complaining about entrypoint, ensure `functions` mapping uses `api/index.ts` (already does) and remove `routes`/`builds` conflicts in backend/vercel.json.
3. Alternative: drop backend from root vercel.json services and instead make root build run nothing for backend; but Vercel multi-service requires each service buildable.
4. Consider simplifying: build backend with `tsc` producing `dist/api/index.js`, and point functions to `dist/api/index.js` entrypoint.

## Git state
- main branch, latest commit `6f3fb0e` (author SparshM8 <callme8samay@gmail.com>). Pushed to origin.
- Full local verification passing: 12 test suites / 69 tests, backend tsc + eslint (max-warnings 0), frontend tsc + eslint + production build.

## Verification commands used
- Backend tests: `TEST_MONGO_URI=mongodb://localhost:27017 QUIZZY_TEST_DB=quizzy-test npm --prefix backend test -- --ci`
- MCP list projects/deployments with `teamId=team_hrvAvsYjIV6IWNGyKOYZoNav`, `projectId=prj_NOJfxKdJnTRyO0hpywyQfb4h2VrO`.

## Remaining steps
1. Inspect build logs for `dpl_ALSWZx1K5LGzuPxNHVtBvf9nMEtD`; fix config accordingly; push new commit; verify new deployment reaches READY.
2. Get final frontend URL; set CORS_ORIGIN in project env vars (Vercel Settings → Environment Variables).
3. Verify `https://quizzy-....vercel.app/api/health` and `/api/health/ready` return HTTP 200.
4. Tell user to create initial admin account via signup page (first admin logic — verify backend: check backend/src/controllers/auth.ts bootstrap behavior).
5. Final report with URLs, limitations (Vercel Hobby serverless limits), and maintenance notes.

## Update 2 (Aug 17, ~10:50 UTC)
- Commit `6f3fb0e` deploy `dpl_ALSWZx1K5LGzuPxNHVtBvf9nMEtD`: ERROR `MISSING_SERVICE_CONFIG` — entrypoint in `backend/vercel.json` ignored; the project was created via dashboard import (framework auto) so per-service vercel.json fields don't apply.
- Commit `c6001ec` (root vercel.json: backend service with `"framework":"express"` + `"entrypoint":"api/index.ts"`) deploy `dpl_FvdmdHGcJiH1HAiyJeSTn4qA2Gow`: ERROR `TS0000_WAT`, "Command \"vercel build\" exited with 1" at buildStep, framework=None. Entrypoint accepted but `vercel build` itself fails — likely because express framework detection runs its own build with our `api/index.ts` as entry and something in the adapter fails, OR build runs `npm run build` (tsc) and entrypoint must be a built file.
- Vercel services docs: entrypoint format `module:export` (e.g. `main:app`) for non-Node; for Express framework in services mode the entrypoint should probably be the compiled JS or the source with default export. Our `api/index.ts` has `export default handler` (Vercel Node signature).
- MCP tools available: list_teams, list_projects (teamId required), list_deployments, get_deployment (idOrUrl). curl to api.vercel.com forbidden (token replacement not applied outside MCP).
- Project ID `prj_NOJfxKdJnTRyO0hpywyQfb4h2VrO`, team `team_hrvAvsYjIV6IWNGyKOYZoNav`. URL so far: quizzy-dua2sfxmw-sparsh-mishras-projects-870ea013.vercel.app (ERROR).
- Next: inspect the actual build logs. Dashboard import page showed logs (user can see them). Options: (a) ask user to paste build logs; (b) replicate `vercel build` locally in a clean dir with services config; (c) use `get_deployment` `inspectorUrl` which is `https://vercel.com/sparsh-mishras-projects-870ea013/quizzy/FvdmdHGcJiH1HAiyJeSTn4qA2Gow` — browser can view logs there since user is logged in.

## Update 3 (Aug 17, ~10:55 UTC)
Commit `ad1d8b8` still fails with identical log: `> tsc` then `error TS6059: api/index.ts not under rootDir src` then `Error: TypeScript type check failed at doTypeCheck (@vercel/backends/index.mjs:891)`. Two conclusions: (1) Vercel's Express backend type-check does NOT honor `typecheck` script, and it does NOT pick up `tsconfig.api.json`; it runs `tsc` (plain) on the entrypoint file, which merges with default tsconfig having rootDir=src. (2) The per-service `entrypoint` is read as plain tsc root file. Fix direction A: move `api/` inside `src/` (e.g. `src/api/vercel.ts`) — but `include: src/**/*` excludes __tests__, fine, and rootDir stays src. However `dist` outDir must then exclude api at runtime. Fix direction B: use plain JS adapter `api/index.js` (no tsc involved). Simplest and bulletproof: **B** — write `api/index.js` importing compiled `../dist/server.js` app export (need server.ts to export `app` from dist). tsc builds dist/server.js; the .js function file skips TS check entirely.
Chosen: B. `api/index.js` using `require('../dist/server').app`. Ensure `app` is exported from `src/server.ts` (verify).

## Update 4 — fix plan details
`src/server.ts` line 76: `export { app };` (Express app exported). `app.listen(...)` wrapped in `startServer()` only invoked when `require.main === module`. So a compiled `dist/server.js` exporting `app` is safe to require without starting a listener.

Plan B implementation:
1. Create `backend/api/index.js`:
```js
"use strict";
// Vercel Function entrypoint: built app + lazy Mongo connection
const { app } = require("../dist/server");
const { connectDatabase } = require("../dist/config/database");
const { validateProductionConfig } = require("../dist/config/env");

let connection;
module.exports = async (req, res) => {
  try {
    validateProductionConfig();
    if (!connection) {
      connection = connectDatabase();
    }
    await connection;
    app(req, res);
  } catch (err) {
    console.error("Vercel request init failed", err);
    if (!res.headersSent) {
      res.status(503).json({ success: false, error: { code: "SERVICE_UNAVAILABLE", message: "The QUIZZY API is temporarily unavailable" } });
    }
  }
};
```
2. Delete `backend/api/index.ts` (TS file causes rootDir TS6059 error).
3. Keep root `vercel.json` service entry: `{"root":"backend","framework":"express","entrypoint":"api/index.js"}`.
4. Ensure `npm run build` runs BEFORE function bundle: in services mode Vercel detects Express framework and runs its own build; the adapter requires `../dist/server`, so dist must exist when function bundles. Vercel's express builder runs the service's `buildCommand` first then bundles entrypoint — but `npm run build` = `tsc` which previously failed? NO: `tsc` compiled fine locally (it was the TYPECHECK with root file that failed). Local `npx tsc --noEmit` passes; `tsc` emit should work too. Risk: tsc emit includes api/index.ts? No — include is src/**/* only.
5. Remove `backend/vercel.json` functions/routes (root services model owns routing) or keep as service-level metadata — docs say service may define own routes; safest to delete backend/vercel.json functions/routes to avoid conflicts.
6. CI: add `api/index.js` to eslint ignore or add a small test; backend `lint` script is `eslint src api --ext .ts` — .ts only, so .js file fine.
7. tsconfig.api.json may be removed or kept harmless.
