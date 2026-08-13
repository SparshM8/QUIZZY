import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import * as analytics from "../controllers/analytics";

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);
analyticsRouter.get("/tests/:testId/overview", requireRole("teacher", "admin"), analytics.getTestOverview);
analyticsRouter.get("/tests/:testId/leaderboard", requireRole("student", "teacher", "admin"), analytics.getTestLeaderboard);
analyticsRouter.get("/recruitment/campaigns/:campaignId/summary", requireRole("recruiter", "admin"), analytics.getCampaignSummary);
