import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Attempt } from "../models/Attempt";
import { Test } from "../models/Test";
import { User } from "../models/User";

import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

function assertObjectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) throw new AppError(400, "VALIDATION_ERROR", `${label} must be a valid id`);
  return new Types.ObjectId(value);
}

function percentileFor(score: number, scores: number[]): number {
  if (scores.length <= 1) return 100;
  const belowOrEqual = scores.filter((value) => value <= score).length;
  return Math.round((belowOrEqual / scores.length) * 100);
}

export const getTestOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const testId = assertObjectId(req.params.testId, "testId");
    const test = await Test.findById(testId).select("title createdBy items enrolledStudents status");
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");
    if (authReq.user!.role !== "admin" && String(test.createdBy) !== authReq.user!.sub) {
      throw new AppError(403, "FORBIDDEN", "Only the test creator or an admin can view analytics");
    }
    const attempts = await Attempt.find({ testId, status: { $in: ["submitted", "auto_submitted"] } }).sort({ submittedAt: 1 }).lean();
    const submittedStudents = new Set(attempts.map((attempt) => String(attempt.studentId)));
    const scores = attempts.map((attempt) => Math.round(((attempt.totalScore ?? 0) / Math.max(attempt.maxPossibleScore, 1)) * 100));
    const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    const distribution = ["0-39", "40-59", "60-74", "75-89", "90-100"].map((range) => ({ range, count: 0 }));
    for (const score of scores) {
      const index = score < 40 ? 0 : score < 60 ? 1 : score < 75 ? 2 : score < 90 ? 3 : 4;
      distribution[index].count += 1;
    }
    const durationSeconds = attempts.filter((attempt) => attempt.submittedAt).map((attempt) => Math.max(0, (attempt.submittedAt!.getTime() - attempt.startedAt.getTime()) / 1000));
    const averageDurationMinutes = durationSeconds.length ? Math.round((durationSeconds.reduce((sum, value) => sum + value, 0) / durationSeconds.length / 60) * 10) / 10 : 0;
    const totalViolations = attempts.reduce((sum, attempt) => sum + (attempt.violations?.length || 0), 0);
    res.json({ success: true, data: { test: { id: test.id, title: test.title, status: test.status }, enrollmentCount: test.enrolledStudents.length, submittedCount: attempts.length, completionRate: test.enrolledStudents.length ? Math.min(100, Math.round((submittedStudents.size / test.enrolledStudents.length) * 100)) : 0, averageScore: average, highestScore: scores.length ? Math.max(...scores) : 0, averageDurationMinutes, distribution, totalViolations } });
  } catch (err) { next(err); }
};

export const getTestLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const testId = assertObjectId(req.params.testId, "testId");
    const test = await Test.findById(testId).select("title createdBy enrolledStudents");
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");
    const isOwner = authReq.user!.role === "admin" || String(test.createdBy) === authReq.user!.sub;
    const isEnrolled = test.enrolledStudents.some((entry) => String(entry.studentId) === authReq.user!.sub);
    if (!isOwner && !isEnrolled) throw new AppError(403, "FORBIDDEN", "You do not have access to this leaderboard");
    const attempts = await Attempt.find({ testId, status: { $in: ["submitted", "auto_submitted"] } }).sort({ totalScore: -1, submittedAt: 1 }).lean();
    const bestByStudent = new Map<string, typeof attempts[number]>();
    for (const attempt of attempts) {
      const key = String(attempt.studentId);
      const previous = bestByStudent.get(key);
      if (!previous || (attempt.totalScore ?? 0) > (previous.totalScore ?? 0)) bestByStudent.set(key, attempt);
    }
    const rows = [...bestByStudent.values()].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
    const users = await User.find({ _id: { $in: rows.map((row) => row.studentId) } }).select("name email").lean();
    const usersById = new Map(users.map((user) => [String(user._id), user]));
    const percentages = rows.map((row) => Math.round(((row.totalScore ?? 0) / Math.max(row.maxPossibleScore, 1)) * 100));
    const data = rows.map((row, index) => ({ rank: index + 1, student: usersById.get(String(row.studentId)) ?? { name: "Student", email: "" }, score: percentages[index], submittedAt: row.submittedAt, attemptNumber: row.attemptNumber, percentile: percentileFor(percentages[index], percentages), violationCount: row.violations?.length || 0 }));
    res.json({ success: true, data: { test: { id: test.id, title: test.title }, rows: data } });
  } catch (err) { next(err); }
};


