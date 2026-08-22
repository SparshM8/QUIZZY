import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { CodingSubmission } from "../models/CodingSubmission";
import { Question } from "../models/Question";
import { AppError } from "../middleware/errorHandler";
import { auditAction } from "../models/AuditEvent";
import { toSafeObject } from "../utils/sanitize";
import { enqueueJudging } from "../judge/queue";
import type { AuthenticatedRequest } from "../middleware/auth";

const MAX_SOURCE_KB = 256;

export const submitCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { questionId, attemptId, language, sourceCode } = req.body as {
      questionId?: string;
      attemptId?: string;
      language?: string;
      sourceCode?: string;
    };
    if (!questionId || !language || !sourceCode) {
      throw new AppError(400, "VALIDATION_ERROR", "questionId, language and sourceCode are required");
    }
    if (Buffer.byteLength(sourceCode, "utf8") > MAX_SOURCE_KB * 1024) {
      throw new AppError(400, "VALIDATION_ERROR", `Source code exceeds ${MAX_SOURCE_KB} KB limit`);
    }

    const question = await Question.findById(questionId);
    if (!question) throw new AppError(404, "NOT_FOUND", "Question not found");
    if (question.type !== "coding") {
      throw new AppError(409, "CONFLICT", "Question is not a coding question");
    }

    const submission = await CodingSubmission.create({
      questionId: question._id,
      authorId: authReq.user!.sub,
      attemptId: attemptId ? new Types.ObjectId(attemptId) : undefined,
      language,
      sourceCode,
      verdict: "queued",
      submittedAt: new Date(),
    });

    auditAction(authReq.user!.sub, "coding.submitted", String(submission._id), "coding_submissions", { language });

    const testCases = (question.coding?.testCases ?? []).map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitMs: tc.timeLimitMs,
    }));

    void enqueueJudging({
      submissionId: String(submission._id),
      questionId: String(question._id),
      language,
      sourceCode,
      testCases,
    });

    res.status(201).json({ success: true, data: toSafeObject(submission) });
  } catch (err) {
    next(err);
  }
};

export const getSubmissionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const submission = await CodingSubmission.findById(req.params.submissionId);
    if (!submission) throw new AppError(404, "NOT_FOUND", "Submission not found");
    if (String(submission.authorId) !== authReq.user!.sub && authReq.user!.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "You cannot view this submission");
    }
    res.json({ success: true, data: toSafeObject(submission) });
  } catch (err) {
    next(err);
  }
};

export const listSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const items = await CodingSubmission.find({ authorId: authReq.user!.sub })
      .sort({ submittedAt: -1 })
      .limit(25);
    res.json({ success: true, data: items.map((s) => toSafeObject(s)) });
  } catch (err) {
    next(err);
  }
};
