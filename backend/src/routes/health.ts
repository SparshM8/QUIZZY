import { Router } from "express";
import { isDatabaseReady } from "../config/database";
import { env } from "../config/env";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ success: true, data: { status: "ok", service: "quizzy-api", version: env.appVersion } });
});

healthRouter.get("/ready", (_req, res) => {
  const ready = isDatabaseReady();
  res.status(ready ? 200 : 503).json({
    success: ready,
    data: { status: ready ? "ready" : "not_ready", service: "quizzy-api", version: env.appVersion, dependencies: { mongodb: ready ? "up" : "down" } },
  });
});
