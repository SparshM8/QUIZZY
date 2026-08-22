import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import * as analytics from "../controllers/analytics";

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);
analyticsRouter.get("/tests/:testId/overview", requireRole("teacher", "admin"), analytics.getTestOverview);
analyticsRouter.get("/tests/:testId/leaderboard", requireRole("student", "teacher", "admin"), analytics.getTestLeaderboard);
analyticsRouter.get("/tests/:testId/export", requireRole("teacher", "admin"), analytics.exportTestReport);
analyticsRouter.get("/live", requireRole("teacher", "admin"), analytics.getLiveStatus);
analyticsRouter.get("/skills", requireRole("student"), analytics.getSkillAnalytics);
analyticsRouter.get("/cohorts", requireRole("teacher", "admin"), analytics.getCohortAnalytics);

