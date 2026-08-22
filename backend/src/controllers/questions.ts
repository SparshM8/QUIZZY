import type { Request, Response, NextFunction } from "express";
import { Question, type QuestionType } from "../models/Question";
import { AppError } from "../middleware/errorHandler";
import { toSafeObject } from "../utils/sanitize";
import { auditAction } from "../models/AuditEvent";
import type { AuthenticatedRequest } from "../middleware/auth";
import { parse } from "csv-parse/sync";

function requireQuestionFields(body: Record<string, unknown>, type: QuestionType): void {
  if (type === "mcq" || type === "multi_select" || type === "true_false") {
    const options = body.options as { choices?: unknown[]; answerIds?: unknown[] } | undefined;
    if (!options || !Array.isArray(options.choices) || !Array.isArray(options.answerIds)) {
      throw new AppError(400, "VALIDATION_ERROR", `${type} questions require valid choices and answerIds`);
    }
    if (options.answerIds.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "At least one answer must be selected");
    }
    if (type === "mcq" || type === "true_false") {
      if (options.answerIds.length !== 1) {
        throw new AppError(400, "VALIDATION_ERROR", `${type} questions require exactly one answer`);
      }
    }
  } else if (type === "fill_blank") {
    const fill = body.fill as { answers?: unknown[] } | undefined;
    if (!fill || !Array.isArray(fill.answers) || fill.answers.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Fill-in-the-blank questions require at least one accepted answer");
    }
  } else if (type === "numerical") {
    const numerical = body.numerical as { answer?: unknown } | undefined;
    if (!numerical || typeof numerical.answer !== "number") {
      throw new AppError(400, "VALIDATION_ERROR", "Numerical questions require a numeric answer");
    }
  } else if (type === "coding") {
    const coding = body.coding as { starterCode?: unknown; timeLimitMs?: unknown; memoryLimitKb?: unknown } | undefined;
    if (!coding) {
      throw new AppError(400, "VALIDATION_ERROR", "Coding questions require a coding block");
    }
  }
}

export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const authReq = req as unknown as AuthenticatedRequest;
  const body = req.body as Record<string, unknown>;
  const type = body.type as QuestionType;
  requireQuestionFields(body, type);

  const question = await Question.create({
    ...body,
    createdBy: authReq.user!.sub,
    status: body.status === "pending" ? "pending" : "draft",
  });

  auditAction(authReq.user!.sub, "question.created", String(question._id), "questions", {
    type: question.type,
    status: question.status,
  });

    res.status(201).json({ success: true, data: toSafeObject(question) });
  } catch (err) {
    next(err);
  }
};

export const listQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const authReq = req as unknown as AuthenticatedRequest;
  const { type, status, tag, difficulty, createdBy, page = "1", limit = "20" } = req.query;

  const filter: Record<string, unknown> = {};
  if (type && ["mcq", "multi_select", "true_false", "fill_blank", "numerical", "subjective", "coding"].includes(String(type))) {
    filter.type = type;
  }
  if (status && ["draft", "pending", "approved", "rejected"].includes(String(status))) {
    filter.status = status;
  } else if (authReq.user!.role !== "admin") {
    filter.$or = [{ status: "approved" }, { createdBy: authReq.user!.sub }];
  }
  if (tag) filter.tags = String(tag);
  if (difficulty) filter.difficulty = difficulty;
  if (createdBy) filter.createdBy = createdBy;

  const pageNumber = Math.max(1, parseInt(String(page), 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
  const [items, total] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate("createdBy", "name email role"),
    Question.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((q) => toSafeObject(q)),
      pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    },
  });
  } catch (err) {
    next(err);
  }
};

export const getQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const authReq = req as unknown as AuthenticatedRequest;
  const question = await Question.findById(req.params.id).populate("createdBy", "name email role");
  if (!question) throw new AppError(404, "NOT_FOUND", "Question not found");
  if (question.status !== "approved" && String(question.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "You do not have access to this question");
  }
    res.json({ success: true, data: toSafeObject(question) });
  } catch (err) {
    next(err);
  }
};

export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const authReq = req as unknown as AuthenticatedRequest;
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError(404, "NOT_FOUND", "Question not found");
  if (String(question.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the author or an admin can edit this question");
  }

  const body = req.body as Record<string, unknown>;
  if (body.type) requireQuestionFields(body, body.type as QuestionType);

  Object.assign(question, body);
  if (question.isModified("status") && question.status === "draft") {
    question.status = "pending";
  }
  await question.save();

  auditAction(authReq.user!.sub, "question.updated", String(question._id), "questions");

    res.json({ success: true, data: toSafeObject(question) });
  } catch (err) {
    next(err);
  }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const authReq = req as unknown as AuthenticatedRequest;
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError(404, "NOT_FOUND", "Question not found");
  if (String(question.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the author or an admin can delete this question");
  }
  await Question.deleteOne({ _id: question._id });

  auditAction(authReq.user!.sub, "question.deleted", String(question._id), "questions");

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const moderateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const authReq = req as unknown as AuthenticatedRequest;
  if (authReq.user!.role !== "admin" && authReq.user!.role !== "teacher") {
    throw new AppError(403, "FORBIDDEN", "Only teachers and admins can moderate questions");
  }
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError(404, "NOT_FOUND", "Question not found");

  const { status, moderatorComment } = req.body as { status?: string; moderatorComment?: string };
  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid moderation status");
  }
  question.status = status as import("../models/Question").ModerationStatus;
  if (moderatorComment !== undefined) question.moderatorComment = moderatorComment;
  await question.save();

  auditAction(authReq.user!.sub, `question.${status}`, String(question._id), "questions", { moderatorComment });

    res.json({ success: true, data: toSafeObject(question) });
  } catch (err) {
    next(err);
  }
};

export const bulkUploadQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (!req.file) {
      throw new AppError(400, "VALIDATION_ERROR", "No CSV file uploaded");
    }

    const csvData = req.file.buffer.toString();
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const questionsToCreate = [];
    for (const record of records as any[]) {
      // Basic validation for bulk upload
      if (!record.title || !record.statement || !record.type) continue;

      const payload: any = {
        title: record.title,
        statement: record.statement,
        type: record.type,
        difficulty: record.difficulty || "easy",
        points: parseInt(record.points) || 10,
        createdBy: authReq.user!.sub,
        status: "approved", // Bulk upload by faculty is pre-approved
        tags: record.tags ? record.tags.split(",").map((t: string) => t.trim()) : [],
      };

      // Handle MCQ choices from CSV (format: Choice 1|Choice 2|Choice 3)
      if (record.choices && record.answerIndex !== undefined) {
        const choices = record.choices.split("|").map((text: string, idx: number) => ({
          id: String(idx + 1),
          text: text.trim(),
        }));
        payload.options = {
          choices,
          answerIds: [String(parseInt(record.answerIndex) + 1)],
        };
      }

      questionsToCreate.push(payload);
    }

    if (questionsToCreate.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "No valid questions found in CSV");
    }

    const created = await Question.insertMany(questionsToCreate);
    
    auditAction(authReq.user!.sub, "questions.bulk_upload", "multiple", "questions", {
      count: created.length,
    });

    res.json({ success: true, data: { count: created.length } });
  } catch (err) {
    next(err);
  }
};
