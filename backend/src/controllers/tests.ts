import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Test, type TestStatus } from "../models/Test";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { toSafeObject } from "../utils/sanitize";
import type { AuthenticatedRequest } from "../middleware/auth";

export const createTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (authReq.user!.role === "student") {
      throw new AppError(403, "FORBIDDEN", "Students cannot create tests");
    }
    const body = req.body as Record<string, unknown>;
    const test = await Test.create({
      ...body,
      createdBy: authReq.user!.sub,
      status: body.status === "published" ? "published" : "draft",
    });
    res.status(201).json({ success: true, data: toSafeObject(test) });
  } catch (err) {
    next(err);
  }
};

export const updateTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const test = await Test.findById(req.params.id);
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");
    if (String(test.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "Only the creator or an admin can edit this test");
    }
    if (test.status !== "draft" && test.status !== "cancelled") {
      throw new AppError(409, "CONFLICT", "Cannot modify a test that is published or in progress");
    }
    Object.assign(test, req.body);
    await test.save();
    res.json({ success: true, data: toSafeObject(test) });
  } catch (err) {
    next(err);
  }
};

export const publishTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const test = await Test.findById(req.params.id);
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");
    if (String(test.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "Only the creator or an admin can publish this test");
    }
    if (test.items.length === 0) {
      throw new AppError(409, "CONFLICT", "A test must have at least one question before publishing");
    }
    const now = new Date();
    if (test.scheduledAt && test.scheduledAt.getTime() <= now.getTime()) {
      throw new AppError(409, "CONFLICT", "Scheduled time must be in the future");
    }
    test.status = "published" as TestStatus;
    await test.save();

    if (test.enrolledStudents.length > 0) {
      await Notification.create(
        test.enrolledStudents.map((entry) => ({
          recipientId: entry.studentId,
          title: "New test published",
          body: `The test "${test.title}" has been published${test.scheduledAt ? ` and is scheduled for ${test.scheduledAt.toISOString()}` : ""}.`,
          type: "test.published",
          referenceType: "test",
          referenceId: test._id,
        }))
      );
    }

    res.json({ success: true, data: toSafeObject(test) });
  } catch (err) {
    next(err);
  }
};

export const listTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { status, createdBy } = req.query;
    const filter: Record<string, unknown> = {};
    if (status && typeof status === "string") filter.status = status;
    if (authReq.user!.role === "student") {
      filter.enrolledStudents = { $elemMatch: { studentId: new Types.ObjectId(authReq.user!.sub) } };
    } else if (createdBy) {
      filter.createdBy = createdBy;
    } else if (authReq.user!.role !== "admin") {
      filter.createdBy = authReq.user!.sub;
    }
    const items = await Test.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");
    res.json({ success: true, data: items.map((t) => toSafeObject(t)) });
  } catch (err) {
    next(err);
  }
};

export const getTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const test = await Test.findById(req.params.id).populate("createdBy", "name email role");
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");
    res.json({ success: true, data: toSafeObject(test) });
  } catch (err) {
    next(err);
  }
};

export const enrollStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const test = await Test.findById(req.params.id);
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");
    if (String(test.createdBy) !== authReq.user!.sub && authReq.user!.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "Only the creator or an admin can manage enrollments");
    }
    const { studentId } = req.body as { studentId?: string };
    if (!studentId) throw new AppError(400, "VALIDATION_ERROR", "studentId is required");
    const user = await User.findById(studentId);
    if (!user || user.role !== "student") {
      throw new AppError(404, "NOT_FOUND", "Student not found");
    }
    const exists = test.enrolledStudents.some((e) => String(e.studentId) === studentId);
    if (!exists) {
      test.enrolledStudents.push({ studentId: new Types.ObjectId(studentId), status: "enrolled" });
      await test.save();
      await Notification.create({
        recipientId: new Types.ObjectId(studentId),
        title: "You have been enrolled in a test",
        body: `You were enrolled in "${test.title}"${test.scheduledAt ? ` scheduled for ${test.scheduledAt.toISOString()}` : ""}.`,
        type: "test.enrolled",
        referenceType: "test",
        referenceId: test._id,
      });
    }
    res.json({ success: true, data: toSafeObject(test) });
  } catch (err) {
    next(err);
  }
};
