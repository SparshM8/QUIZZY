import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Test } from "../models/Test";
import { Attempt } from "../models/Attempt";
import { Question } from "../models/Question";
import { Notification } from "../models/Notification";
import { AppError } from "../middleware/errorHandler";
import { toSafeObject } from "../utils/sanitize";
import { scoreAttempt } from "../utils/scoring";
import type { AuthenticatedRequest } from "../middleware/auth";

function requireStudent(authReq: AuthenticatedRequest): void {
  if (authReq.user!.role !== "student") {
    throw new AppError(403, "FORBIDDEN", "Only students can take tests");
  }
}

export const startAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    requireStudent(authReq);
    const test = await Test.findById(req.params.testId);
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");

    const enrollment = test.enrolledStudents.find(
      (e) => String(e.studentId) === authReq.user!.sub
    );
    if (!enrollment) {
      throw new AppError(403, "FORBIDDEN", "You are not enrolled in this test");
    }
    if (test.status !== "published") {
      throw new AppError(409, "CONFLICT", "This test is not currently available");
    }

    const attempts = await Attempt.countDocuments({
      testId: test._id,
      studentId: new Types.ObjectId(authReq.user!.sub),
    });
    // In production verification mode, we reset attempts if limit reached
    
    if (attempts >= test.maxAttempts) {
      throw new AppError(409, "CONFLICT", "Maximum attempts reached for this test");
    }
    

    const now = new Date();
    if (test.scheduledAt && test.scheduledAt.getTime() > now.getTime()) {
      throw new AppError(409, "CONFLICT", "This test has not started yet");
    }

    const attempt = await Attempt.create({
      testId: test._id,
      studentId: new Types.ObjectId(authReq.user!.sub),
      startedAt: now,
      durationMinutes: test.durationMinutes,
      attemptNumber: attempts + 1,
      maxPossibleScore: test.items.reduce((sum, item) => sum + item.points, 0),
      answers: [],
    });

    test.status = "in_progress";
    await test.save();

    res.status(201).json({ success: true, data: toSafeObject(attempt) });
  } catch (err) {
    next(err);
  }
};

export const getAttemptState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: new Types.ObjectId(authReq.user!.sub),
      status: "in_progress",
    });
    if (!attempt) throw new AppError(404, "NOT_FOUND", "Active attempt not found");

    const test = await Test.findById(attempt.testId).populate({
      path: "items.questionId",
    });
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");

    const elapsedMs = Date.now() - attempt.startedAt.getTime();
    const remainingMs = Math.max(0, test.durationMinutes * 60 * 1000 - elapsedMs);

    const orderedItems = [...test.items].sort((a, b) => a.order - b.order);
    const questions = orderedItems
      .map((item) => {
        const q = item.questionId as unknown as ReturnType<typeof toSafeObject>;
        return { questionId: String(item.questionId), order: item.order, points: item.points, question: q };
      })
      .filter((entry) => entry.question);

    res.json({
      success: true,
      data: {
        attempt: toSafeObject(attempt),
        remainingMs,
        test: { title: test.title, scrambleOptions: test.scrambleOptions },
        questions,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const saveAnswers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: new Types.ObjectId(authReq.user!.sub),
      status: "in_progress",
    });
    if (!attempt) throw new AppError(404, "NOT_FOUND", "Active attempt not found");

    const { answers } = req.body as { answers?: { questionId: string; answer: unknown }[] };
    if (!Array.isArray(answers)) {
      throw new AppError(400, "VALIDATION_ERROR", "answers must be an array");
    }

    const existingMap = new Map(attempt.answers.map((a) => [String(a.questionId), a]));
    for (const incoming of answers) {
      if (!incoming.questionId || !Types.ObjectId.isValid(incoming.questionId)) continue;
      const item = (await Test.findById(attempt.testId))?.items.find(
        (i) => String(i.questionId) === incoming.questionId
      );
      if (!item) continue;
      existingMap.set(incoming.questionId, {
        questionId: new Types.ObjectId(incoming.questionId),
        order: item.order,
        answer: incoming.answer,
        maxScore: item.points,
      });
    }
    attempt.answers = Array.from(existingMap.values());
    attempt.lastSavedAt = new Date();
    await attempt.save();

    res.json({ success: true, data: { saved: true, answerCount: attempt.answers.length } });
  } catch (err) {
    next(err);
  }
};

export const heartbeat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: new Types.ObjectId(authReq.user!.sub),
      status: "in_progress",
    });
    if (!attempt) throw new AppError(404, "NOT_FOUND", "Active attempt not found");

    const test = await Test.findById(attempt.testId);
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");

    const elapsedMs = Date.now() - attempt.startedAt.getTime();
    const remainingMs = Math.max(0, test.durationMinutes * 60 * 1000 - elapsedMs);

    if (remainingMs === 0) {
      await submitAttemptInternal(attempt, test, true);
      res.json({
        success: true,
        data: { remainingMs: 0, autoSubmitted: true, attempt: toSafeObject(attempt) },
      });
      return;
    }

    res.json({ success: true, data: { remainingMs } });
  } catch (err) {
    next(err);
  }
};

export const logViolation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: new Types.ObjectId(authReq.user!.sub),
      status: "in_progress",
    });
    if (!attempt) throw new AppError(404, "NOT_FOUND", "Active attempt not found");

    const { type, details } = req.body as { 
      type: "tab_switch" | "copy_paste" | "fullscreen_exit" | "webcam_violation" | "other"; 
      details?: string 
    };
    if (!["tab_switch", "copy_paste", "fullscreen_exit", "webcam_violation", "other"].includes(type)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid violation type");
    }

    attempt.violations.push({
      type,
      timestamp: new Date(),
      details,
    });
    
    const test = await Test.findById(attempt.testId);
    if (test && test.proctoringConfig?.violationThreshold > 0) {
      if (attempt.violations.length >= test.proctoringConfig.violationThreshold) {
        await submitAttemptInternal(attempt, test, true);
        res.json({ 
          success: true, 
          data: { 
            logged: true, 
            violationCount: attempt.violations.length,
            autoSubmitted: true 
          } 
        });
        return;
      }
    }
    
    await attempt.save();

    res.json({ success: true, data: { logged: true, violationCount: attempt.violations.length } });
  } catch (err) {
    next(err);
  }
};

async function submitAttemptInternal(
  attempt: InstanceType<typeof Attempt>,
  test: InstanceType<typeof Test>,
  autoSubmitted: boolean
): Promise<void> {
  const questionIds = attempt.answers.map((a) => a.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const scored = scoreAttempt(
    attempt.answers.map((a) => ({ questionId: String(a.questionId), answer: a.answer })),
    questions
  );

  attempt.status = autoSubmitted ? "auto_submitted" : "submitted";
  attempt.autoSubmitted = autoSubmitted;
  attempt.submittedAt = new Date();
  attempt.totalScore = scored.totalScore;
  attempt.answers = scored.answers.map((g) => ({ questionId: new Types.ObjectId(g.questionId), order: g.maxScore, answer: undefined, score: g.score, maxScore: g.maxScore, graded: g.graded }));
  await attempt.save();

  await Notification.create({
    recipientId: attempt.studentId,
    title: autoSubmitted ? "Test auto-submitted" : "Test submitted",
    body: `Your attempt on "${test.title}" was ${autoSubmitted ? "automatically submitted" : "submitted"} with a score of ${scored.totalScore}/${scored.maxPossibleScore}.`,
    type: "attempt.submitted",
    referenceType: "attempt",
    referenceId: attempt._id,
  });
}

export const submitAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: new Types.ObjectId(authReq.user!.sub),
      status: "in_progress",
    });
    if (!attempt) throw new AppError(404, "NOT_FOUND", "Active attempt not found");

    const test = await Test.findById(attempt.testId);
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");

    await submitAttemptInternal(attempt, test, false);

    const stillEnrolled = test.enrolledStudents.find(
      (e) => String(e.studentId) === authReq.user!.sub
    );
    if (stillEnrolled) {
      stillEnrolled.status = "submitted";
      await test.save();
    }

    res.json({ success: true, data: toSafeObject(attempt) });
  } catch (err) {
    next(err);
  }
};

export const getAttemptResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt) throw new AppError(404, "NOT_FOUND", "Attempt not found");
    if (
      String(attempt.studentId) !== authReq.user!.sub &&
      authReq.user!.role !== "admin" &&
      authReq.user!.role !== "teacher"
    ) {
      throw new AppError(403, "FORBIDDEN", "You cannot view this attempt");
    }
    if (attempt.status !== "submitted" && attempt.status !== "auto_submitted") {
      throw new AppError(409, "CONFLICT", "Attempt is not yet submitted");
    }

    const test = await Test.findById(attempt.testId);
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");

    const questionIds = attempt.answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const byId = new Map(questions.map((q) => [String(q._id), toSafeObject(q) as Record<string, unknown>]));

    const answers = attempt.answers.map((a) => ({
      questionId: String(a.questionId), order: a.order, answer: a.answer, score: a.score, maxScore: a.maxScore, graded: a.graded,
      question: byId.get(String(a.questionId)) ?? null,
      showScore: test.showResultsImmediately || authReq.user!.role !== "student",
    }));

    res.json({
      success: true,
      data: {
        attempt: toSafeObject(attempt),
        test: { title: test.title, showResultsImmediately: test.showResultsImmediately },
        answers,
      },
    });
  } catch (err) {
    next(err);
  }
};
