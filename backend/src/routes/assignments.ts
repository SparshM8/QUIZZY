import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as assignments from "../controllers/assignments";
import { upload } from "../controllers/assignments";

export const assignmentsRouter = Router();

assignmentsRouter.get("/", authenticate, assignments.listAssignments);

assignmentsRouter.post(
  "/",
  authenticate,
  validate([
    body("title").trim().isLength({ min: 3, max: 200 }),
    body("description").optional().isString(),
    body("dueAt").isISO8601(),
    body("maxPoints").isInt({ min: 1 }),
    body("allowedFileTypes").optional().isArray(),
    body("rubric").optional().isArray(),
    body("rubric.*.title").isString(),
    body("rubric.*.maxPoints").isInt({ min: 0 }),
    body("status").optional().isString().isIn(["draft", "published"]),
  ]),
  assignments.createAssignment
);

assignmentsRouter.get("/:id", authenticate, assignments.getAssignment);

assignmentsRouter.patch(
  "/:id",
  authenticate,
  validate([
    body("title").optional().trim().isLength({ min: 3, max: 200 }),
    body("dueAt").optional().isISO8601(),
    body("maxPoints").optional().isInt({ min: 1 }),
    body("status").optional().isString().isIn(["draft", "published", "closed"]),
  ]),
  assignments.updateAssignment
);

assignmentsRouter.post("/:id/submissions", authenticate, upload.single("file"), assignments.submitAssignment);

assignmentsRouter.get("/:id/my-submission", authenticate, assignments.getMySubmission);
assignmentsRouter.get("/:id/submissions", authenticate, assignments.listSubmissions);

assignmentsRouter.patch(
  "/submissions/:submissionId/grade",
  authenticate,
  validate([body("grades").isArray({ min: 1 }), body("grades.*.criterion").isString(), body("grades.*.points").isInt({ min: 0 })]),
  assignments.gradeSubmission
);
