import { Router } from "express";
import { body } from "express-validator";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as recruitment from "../controllers/recruitment";

export const recruitmentRouter = Router();
recruitmentRouter.use(authenticate);
recruitmentRouter.get("/organizations", requireRole("recruiter", "admin"), recruitment.listOrganizations);
recruitmentRouter.post(
  "/organizations",
  requireRole("recruiter", "admin"),
  validate([body("name").trim().isLength({ min: 2, max: 120 }), body("description").optional().isString()]),
  recruitment.createOrganization
);
recruitmentRouter.get("/campaigns", recruitment.listCampaigns);
recruitmentRouter.post(
  "/campaigns",
  requireRole("recruiter", "admin"),
  validate([
    body("organizationId").isMongoId(),
    body("title").trim().isLength({ min: 3, max: 180 }),
    body("roleTitle").trim().isLength({ min: 2, max: 120 }),
    body("description").optional().isString(),
    body("skills").optional().isArray(),
    body("testId").optional().isMongoId(),
    body("startsAt").optional().isISO8601(),
    body("closesAt").optional().isISO8601(),
  ]),
  recruitment.createCampaign
);
recruitmentRouter.get("/campaigns/:id", recruitment.getCampaign);
recruitmentRouter.patch("/campaigns/:id", requireRole("recruiter", "admin"), recruitment.updateCampaign);
recruitmentRouter.post(
  "/campaigns/:id/invitations",
  requireRole("recruiter", "admin"),
  validate([body("emails").isArray({ min: 1, max: 100 }), body("emails.*").isEmail().normalizeEmail()]),
  recruitment.inviteCandidates
);
recruitmentRouter.get("/campaigns/:id/ranking", requireRole("recruiter", "admin"), recruitment.listRanking);
recruitmentRouter.post("/invitations/accept", requireRole("student"), validate([body("token").isString().isLength({ min: 16 })]), recruitment.acceptInvitation);
recruitmentRouter.get("/applications/me", requireRole("student"), recruitment.listMyApplications);
recruitmentRouter.patch(
  "/applications/:applicationId",
  requireRole("recruiter", "admin"),
  validate([
    body("status").optional().isIn(["invited", "started", "completed", "shortlisted", "rejected"]),
    body("notes").optional().isString().isLength({ max: 2000 }),
    body("score").optional().isFloat({ min: 0, max: 100 }),
  ]),
  recruitment.updateApplication
);
