import type { Request, Response, NextFunction } from "express";
import path from "path";
import multer, { diskStorage } from "multer";
import { Types } from "mongoose";
import { Assignment, Submission } from "../models/Assignment";
import { Notification } from "../models/Notification";
import { AppError } from "../middleware/errorHandler";
import { toSafeObject } from "../utils/sanitize";
import type { AuthenticatedRequest } from "../middleware/auth";

export const storage = diskStorage({
  destination: path.resolve(process.cwd(), "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".dat").toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext.length > 0);
  },
});

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (authReq.user!.role === "student") {
      throw new AppError(403, "FORBIDDEN", "Students cannot create assignments");
    }
    const body = req.body as Record<string, unknown>;
    const assignment = await Assignment.create({
      ...body,
      createdBy: authReq.user!.sub,
      status: body.status === "published" ? "published" : "draft",
    });
    if (assignment.status === "published") {
      const students = await import("../models/User").then((m) =>
        m.User.find({ role: "student" }).select("_id")
      );
      if (students.length > 0) {
        await Notification.create(
          students.map((student) => ({
            recipientId: student._id,
            title: "New assignment posted",
            body: `A new assignment "${assignment.title}" is due ${assignment.dueAt.toISOString()}.`,
            type: "assignment.published",
            referenceType: "assignment",
            referenceId: assignment._id,
          }))
        );
      }
    }

    res.status(201).json({ success: true, data: toSafeObject(assignment) });
  } catch (err) {
    next(err);
  }
};

export const listAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const filter: Record<string, unknown> = {};
    if (authReq.user!.role === "student") {
      filter.status = { $in: ["published"] };
    } else if (authReq.user!.role !== "admin") {
      filter.createdBy = authReq.user!.sub;
    }
    const items = await Assignment.find(filter).sort({ dueAt: 1 });
    res.json({ success: true, data: items.map((a) => toSafeObject(a)) });
  } catch (err) {
    next(err);
  }
};

export const getAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
    res.json({ success: true, data: toSafeObject(assignment) });
  } catch (err) {
    next(err);
  }
};

export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
    if (String(assignment.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "Only the creator or an admin can edit this assignment");
    }
    Object.assign(assignment, req.body);
    await assignment.save();

    if (assignment.status === "published" && req.body.status === "published") {
      const students = await import("../models/User").then((m) =>
        m.User.find({ role: "student" }).select("_id")
      );
      if (students.length > 0) {
        await Notification.create(
          students.map((student) => ({
            recipientId: student._id,
            title: "New assignment posted",
            body: `A new assignment "${assignment.title}" is due ${assignment.dueAt.toISOString()}.`,
            type: "assignment.published",
            referenceType: "assignment",
            referenceId: assignment._id,
          }))
        );
      }
    }

    res.json({ success: true, data: toSafeObject(assignment) });
  } catch (err) {
    next(err);
  }
};

export const submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError(400, "VALIDATION_ERROR", "A submission file is required");

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
    if (assignment.status !== "published") {
      throw new AppError(409, "CONFLICT", "This assignment is not accepting submissions");
    }
    if (new Date() > assignment.dueAt) {
      throw new AppError(409, "CONFLICT", "The submission deadline has passed");
    }

    const existing = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: new Types.ObjectId(authReq.user!.sub),
    });
    if (existing) {
      existing.fileName = file.originalname;
      existing.fileUrl = file.path;
      existing.totalGrade = undefined;
      await existing.save();
      return res.json({ success: true, data: toSafeObject(existing) });
    }

    const submission = await Submission.create({
      assignmentId: assignment._id,
      studentId: new Types.ObjectId(authReq.user!.sub),
      fileName: file.originalname,
      fileUrl: file.path,
      submittedAt: new Date(),
    });
    res.status(201).json({ success: true, data: toSafeObject(submission) });
  } catch (err) {
    next(err);
  }
};

export const getMySubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const submission = await Submission.findOne({
      assignmentId: req.params.id,
      studentId: new Types.ObjectId(authReq.user!.sub),
    });
    res.json({ success: true, data: submission ? toSafeObject(submission) : null });
  } catch (err) {
    next(err);
  }
};

export const gradeSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (authReq.user!.role === "student") {
      throw new AppError(403, "FORBIDDEN", "Students cannot grade submissions");
    }
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) throw new AppError(404, "NOT_FOUND", "Submission not found");

    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
    if (String(assignment.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "Only the assignment creator or an admin can grade");
    }

    const { grades } = req.body as { grades?: { criterion: string; points: number; note?: string }[] };
    if (!Array.isArray(grades) || grades.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "grades array is required");
    }
    submission.grades = grades;
    submission.totalGrade = grades.reduce((sum, g) => sum + g.points, 0);
    submission.gradedBy = new Types.ObjectId(authReq.user!.sub);
    submission.gradedAt = new Date();
    await submission.save();

    await Notification.create({
      recipientId: submission.studentId,
      title: "Your assignment was graded",
      body: `Your submission for "${assignment.title}" received ${submission.totalGrade}/${assignment.maxPoints} points.`,
      type: "submission.graded",
      referenceType: "submission",
      referenceId: submission._id,
    });

    res.json({ success: true, data: toSafeObject(submission) });
  } catch (err) {
    next(err);
  }
};

export const listSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.id }).sort({
      submittedAt: -1,
    });
    res.json({ success: true, data: submissions.map((s) => toSafeObject(s)) });
  } catch (err) {
    next(err);
  }
};
