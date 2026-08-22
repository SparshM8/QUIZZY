import { Router } from "express";
import { body, query } from "express-validator";
import multer from "multer";
import { validate } from "../middleware/validate";
import { authenticate, requireRole } from "../middleware/auth";
import * as questions from "../controllers/questions";

const upload = multer({ storage: multer.memoryStorage() });

const QUESTION_TYPES = ["mcq", "multi_select", "true_false", "fill_blank", "numerical", "subjective", "coding", "aptitude", "reasoning"];
const MODERATION_STATUSES = ["draft", "pending", "approved", "rejected"];

export const questionsRouter = Router();

questionsRouter.get("/", authenticate, validate([
  query("type").optional().isString().isIn(QUESTION_TYPES),
  query("status").optional().isString().isIn(MODERATION_STATUSES),
  query("tag").optional().isString(),
  query("difficulty").optional().isString().isIn(["easy", "medium", "hard"]),
  query("createdBy").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
]), questions.listQuestions);

questionsRouter.post("/", authenticate, validate([
  body("title").trim().isLength({ min: 3, max: 200 }),
  body("statement").trim().isLength({ min: 5 }),
  body("type").isString().isIn(QUESTION_TYPES),
  body("difficulty").optional().isString().isIn(["easy", "medium", "hard"]),
  body("tags").optional().isArray(),
  body("points").isInt({ min: 1, max: 1000 }),
  body("explanation").optional().isString(),
  body("options").optional().isObject(),
  body("fill").optional().isObject(),
  body("numerical").optional().isObject(),
  body("coding").optional().isObject(),
  body("status").optional().isString().isIn(["draft", "pending"]),
]), questions.createQuestion);

questionsRouter.post(
  "/bulk",
  authenticate,
  requireRole("admin", "teacher"),
  upload.single("file"),
  questions.bulkUploadQuestions
);

questionsRouter.get("/:id", authenticate, questions.getQuestion);

questionsRouter.patch("/:id", authenticate, validate([
  body("title").optional().trim().isLength({ min: 3, max: 200 }),
  body("statement").optional().trim().isLength({ min: 5 }),
  body("type").optional().isString().isIn(QUESTION_TYPES),
  body("difficulty").optional().isString().isIn(["easy", "medium", "hard"]),
  body("tags").optional().isArray(),
  body("points").optional().isInt({ min: 1, max: 1000 }),
  body("options").optional().isObject(),
  body("fill").optional().isObject(),
  body("numerical").optional().isObject(),
  body("coding").optional().isObject(),
]), questions.updateQuestion);

questionsRouter.delete("/:id", authenticate, questions.deleteQuestion);

questionsRouter.post(
  "/:id/moderate",
  authenticate,
  requireRole("admin", "teacher"),
  validate([
    body("status").isString().isIn(["pending", "approved", "rejected"]),
    body("moderatorComment").optional().isString(),
  ]),
  questions.moderateQuestion
);
