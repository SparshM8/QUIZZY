import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
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

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
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
  await connectDatabase();
  app.listen(env.port, () => {
    logger.info(`Quizzy API listening on :${env.port}`, { env: env.nodeEnv });
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error("Failed to start server", { error: String(err) });
    process.exit(1);
  });
}

export { app };
