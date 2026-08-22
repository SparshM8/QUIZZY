// Namespace import is used deliberately: the Vercel function bundler
// rewrites the compiled `__importDefault` helper in a way that leaves the
// default export of CommonJS packages like `express` undefined, which made
// `express()` return undefined in serverless execution. Importing the
// namespace keeps `expressNs.default` resolvable at runtime.
import fs from "fs";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env, validateProductionConfig } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { logger } from "./config/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { healthRouter } from "./routes/health";
import { usersRouter } from "./routes/users";
import { questionsRouter } from "./routes/questions";
import { testsRouter } from "./routes/tests";
import { notificationsRouter } from "./routes/notifications";
import { codingRouter } from "./routes/coding";
import { assignmentsRouter } from "./routes/assignments";

import { analyticsRouter } from "./routes/analytics";
import { startJudgeWorker } from "./judge/worker";

// Namespace import is used deliberately: the Vercel function bundler
// rewrites the compiled `__importDefault` helper in a way that leaves the
// default export of CommonJS packages like `express` undefined, which made
// `express()` return undefined in serverless execution. Importing the
// namespace keeps `expressNs.default` resolvable at runtime.
import * as expressNs from "express";
const expressFn = ((expressNs as unknown as { default?: unknown }).default || expressNs) as unknown as () => expressNs.Express;
const app = expressFn();

app.use(helmet());
app.use(
  cors({
    // When no explicit origin is configured the API mirrors the requesting
    // origin so the same deployment serves any hosted frontend; the explicit
    // HTTPS check in validateProductionConfig still applies when one is set.
    origin: env.corsOriginExplicit
      ? env.corsOrigin
      : (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          callback(null, true);
        },
    credentials: true,
  })
);
const expressMiddleware = expressFn as unknown as {
  json(options?: { limit?: string }): expressNs.RequestHandler;
  urlencoded(options?: { extended?: boolean }): expressNs.RequestHandler;
};
app.use(expressMiddleware.json({ limit: "1mb" }));
app.use(expressMiddleware.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: { write: (line) => logger.info(line.trim()) } }));

// Vercel proxies all traffic, so every client appears to come from the same
// reverse-proxy IP. Trusting one proxy hop lets the middleware read the real
// client IP from X-Forwarded-For; without this, ALL users share a single
// rate-limit bucket and the site blocks itself under load.
app.set("trust proxy", 1);
const clientIpKey = (req: expressNs.Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? req.ip ?? "unknown";
};

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, keyGenerator: clientIpKey });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, keyGenerator: clientIpKey });

app.use("/api/health", healthRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/me", meRouter);
app.use("/api/users", globalLimiter, usersRouter);
app.use("/api/questions", globalLimiter, questionsRouter);
app.use("/api/tests", globalLimiter, testsRouter);
app.use("/api/notifications", globalLimiter, notificationsRouter);
app.use("/api/coding", globalLimiter, codingRouter);
app.use("/api/assignments", globalLimiter, assignmentsRouter);

app.use("/api/analytics", globalLimiter, analyticsRouter);

// The same deployment also serves the built React frontend (copied into
// `backend/public` by the `vercel:function-build` script), so this Express
// app is the single entrypoint for both API and SPA requests. The exact
// runtime location of the module varies by bundler/runtime, so the static
// directory is resolved by probing candidate locations relative to this
// module and picking the first one that actually contains index.html.
function resolveStaticDir(): string {
  const candidates = [
    path.join(__dirname, "static"),
    path.join(__dirname, "../../public"),
    path.join(__dirname, "../public"),
    path.join(__dirname, "public"),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(candidate, "index.html"))) {
        return candidate;
      }
    } catch {
      // ignore and try the next candidate
    }
  }
  return candidates[0];
}
const staticAssetsDir = resolveStaticDir();
const serveStatic = (expressMiddleware as unknown as {
  static(rootPath: string): expressNs.RequestHandler;
}).static;
app.use(serveStatic(staticAssetsDir));
// SPA fallback: any non-API GET request that did not match a static asset
// receives index.html so React Router can render the client-side route.
app.get(/^\/(?!api)/, (_req, res) => {
  res.sendFile(path.join(staticAssetsDir, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

export async function startServer(): Promise<void> {
  validateProductionConfig();
  await connectDatabase();
  void startJudgeWorker();
  const server = app.listen(env.port, () => {
    logger.info(`Quizzy API listening on :${env.port}`, { env: env.nodeEnv, version: env.appVersion });
  });
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}; shutting down gracefully`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error("Failed to start server", { error: String(err) });
    process.exit(1);
  });
}

export { app };
