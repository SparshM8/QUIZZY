// Namespace import is used deliberately: the Vercel function bundler
// rewrites the compiled `__importDefault` helper in a way that leaves the
// default export of CommonJS packages like `express` undefined, which made
// `express()` return undefined in serverless execution. Importing the
// namespace keeps `expressNs.default` resolvable at runtime.
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
import { recruitmentRouter } from "./routes/recruitment";
import { analyticsRouter } from "./routes/analytics";

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

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use("/api/health", healthRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/me", meRouter);
app.use("/api/users", globalLimiter, usersRouter);
app.use("/api/questions", globalLimiter, questionsRouter);
app.use("/api/tests", globalLimiter, testsRouter);
app.use("/api/notifications", globalLimiter, notificationsRouter);
app.use("/api/coding", globalLimiter, codingRouter);
app.use("/api/assignments", globalLimiter, assignmentsRouter);
app.use("/api/recruitment", globalLimiter, recruitmentRouter);
app.use("/api/analytics", globalLimiter, analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export async function startServer(): Promise<void> {
  validateProductionConfig();
  await connectDatabase();
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
