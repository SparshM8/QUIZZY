import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as coding from "../controllers/coding";

export const codingRouter = Router();

codingRouter.post(
  "/",
  authenticate,
  validate([
    body("questionId").isString(),
    body("language").trim().isLength({ min: 1, max: 20 }),
    body("sourceCode").isString().isLength({ min: 1, max: 262144 }),
  ]),
  coding.submitCode
);

codingRouter.get("/my", authenticate, coding.listSubmissions);
codingRouter.get("/:submissionId", authenticate, coding.getSubmissionStatus);
