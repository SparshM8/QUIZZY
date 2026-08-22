import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import { authenticate, requireRole } from "../middleware/auth";
import { requireVerified } from "../middleware/requireVerified";
import * as tests from "../controllers/tests";
import * as attempts from "../controllers/attempts";

export const testsRouter = Router();

testsRouter.get("/", authenticate, tests.listTests);

testsRouter.post(
  "/",
  authenticate,
  requireRole("admin", "teacher"),
  validate([
    body("title").trim().isLength({ min: 3, max: 200 }),
    body("description").optional().isString(),
    body("durationMinutes").isInt({ min: 1, max: 1440 }),
    body("scheduledAt").optional().isISO8601(),
    body("scrambleQuestions").optional().isBoolean(),
    body("scrambleOptions").optional().isBoolean(),
    body("showResultsImmediately").optional().isBoolean(),
    body("maxAttempts").optional().isInt({ min: 1, max: 10 }),
    body("items").isArray({ min: 0 }),
    body("items.*.questionId").isString(),
    body("items.*.points").isInt({ min: 1 }),
    body("items.*.order").isInt({ min: 0 }),
    body("enrolledStudents").optional().isArray(),
    body("status").optional().isString().isIn(["draft", "published"]),
  ]),
  tests.createTest
);

testsRouter.get("/:id", authenticate, tests.getTest);

testsRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin", "teacher"),
  validate([
    body("title").optional().trim().isLength({ min: 3, max: 200 }),
    body("description").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 1, max: 1440 }),
    body("scheduledAt").optional().isISO8601(),
    body("items").optional().isArray(),
  ]),
  tests.updateTest
);

testsRouter.post("/:id/publish", authenticate, requireRole("admin", "teacher"), tests.publishTest);

testsRouter.post(
  "/:id/enroll",
  authenticate,
  requireRole("admin", "teacher"),
  validate([body("studentId").isString()]),
  tests.enrollStudent
);

testsRouter.post("/:testId/attempts", authenticate, requireRole("student"), requireVerified, attempts.startAttempt);

testsRouter.get("/attempts/:attemptId/state", authenticate, requireRole("student"), attempts.getAttemptState);

testsRouter.patch(
  "/attempts/:attemptId/answers",
  authenticate,
  requireRole("student"),
  requireVerified,
  validate([body("answers").isArray()]),
  attempts.saveAnswers
);

testsRouter.get("/attempts/:attemptId/heartbeat", authenticate, requireRole("student"), attempts.heartbeat);

testsRouter.post("/attempts/:attemptId/violations", authenticate, requireRole("student"), requireVerified, attempts.logViolation);

testsRouter.post("/attempts/:attemptId/submit", authenticate, requireRole("student"), requireVerified, attempts.submitAttempt);

testsRouter.get("/attempts/:attemptId/result", authenticate, attempts.getAttemptResult);
