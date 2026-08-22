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

export const exportTestReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const testId = assertObjectId(req.params.testId, "testId");
    // const format = req.query.format === "excel" ? "excel" : "csv"; // Default to CSV for simplicity, user can open in Excel
    
    const test = await Test.findById(testId).select("title createdBy");
    if (!test) throw new AppError(404, "NOT_FOUND", "Test not found");
    if (authReq.user!.role !== "admin" && String(test.createdBy) !== authReq.user!.sub) {
      throw new AppError(403, "FORBIDDEN", "Only the test creator or an admin can export reports");
    }

    const attempts = await Attempt.find({ testId, status: { $in: ["submitted", "auto_submitted"] } })
      .sort({ totalScore: -1, submittedAt: 1 })
      .lean();

    const users = await User.find({ _id: { $in: attempts.map((a) => a.studentId) } }).select("name email").lean();
    const usersById = new Map(users.map((u) => [String(u._id), u]));

    const csvRows = [
      ["Rank", "Student Name", "Email", "Score (%)", "Total Points", "Max Points", "Attempt #", "Violations", "Submitted At"]
    ];

    attempts.forEach((row, index) => {
      const user = usersById.get(String(row.studentId));
      const percentage = Math.round(((row.totalScore ?? 0) / Math.max(row.maxPossibleScore, 1)) * 100);
      csvRows.push([
        String(index + 1),
        user?.name || "Unknown",
        user?.email || "N/A",
        `${percentage}%`,
        String(row.totalScore || 0),
        String(row.maxPossibleScore),
        String(row.attemptNumber),
        String(row.violations?.length || 0),
        row.submittedAt ? row.submittedAt.toISOString() : "N/A"
      ]);
    });

    const csvContent = csvRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=test_report_${testId}.csv`);
    res.status(200).send(csvContent);
  } catch (err) { next(err); }
};

export const getLiveStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (authReq.user!.role !== "admin" && authReq.user!.role !== "teacher") {
      throw new AppError(403, "FORBIDDEN", "Only faculty can access live monitoring");
    }

    const activeAttempts = await Attempt.find({ status: "in_progress" })
      .populate("studentId", "name")
      .populate("testId", "title items")
      .lean();

    const data = activeAttempts.map((a) => {
      const lastViolation = a.violations.length > 0 ? a.violations[a.violations.length - 1] : null;
      const test = a.testId as any;
      const totalQuestions = test?.items?.length || 1;
      const progress = Math.round((a.answers.length / totalQuestions) * 100);

      return {
        id: a._id,
        studentName: (a.studentId as any).name,
        testTitle: test?.title || "Unknown Test",
        violationCount: a.violations.length,
        lastViolationType: lastViolation?.type,
        lastViolationTime: lastViolation?.timestamp,
        status: a.status,
        progress,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getSkillAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const studentId = new Types.ObjectId(authReq.user!.sub);

    const attempts = await Attempt.find({ studentId, status: { $in: ["submitted", "auto_submitted"] } })
      .populate({
        path: "answers.questionId",
        select: "type difficulty tags"
      })
      .lean();

    const categories = ["aptitude", "reasoning", "coding", "technical"];
    const skillMap: Record<string, { score: number; max: number }> = {};
    categories.forEach(c => skillMap[c] = { score: 0, max: 0 });

    attempts.forEach(attempt => {
      attempt.answers.forEach((ans: any) => {
        const q = ans.questionId;
        if (!q) return;
        const type = q.type === "mcq" ? "technical" : q.type;
        if (skillMap[type]) {
          skillMap[type].score += ans.score || 0;
          skillMap[type].max += ans.maxScore || 0;
        }
      });
    });

    const recommendations: Record<string, string[]> = {
      aptitude: ["Practice more Time and Work problems.", "Improve calculation speed for Profit and Loss.", "Focus on Quantitative Aptitude fundamentals."],
      reasoning: ["Solve more Number Series puzzles.", "Work on Logical Deduction and Syllogisms.", "Practice abstract reasoning patterns."],
      coding: ["Master Data Structures like Trees and Graphs.", "Focus on Time Complexity optimization.", "Practice competitive programming on LeetCode."],
      technical: ["Deep dive into OS and Networking concepts.", "Review DBMS and SQL query optimization.", "Strengthen Core Java/Python fundamentals."]
    };

    const data = Object.entries(skillMap).map(([category, stats]) => {
      const readiness = stats.max > 0 ? Math.round((stats.score / stats.max) * 100) : 0;
      const recs = recommendations[category] || ["Keep practicing!"];
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        score: stats.score,
        maxScore: stats.max,
        readiness,
        recommendation: readiness < 70 ? recs[Math.floor(Math.random() * recs.length)] : "You are doing great in this area! Focus on maintaining your speed."
      };
    }).filter(s => s.maxScore > 0);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getCohortAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (authReq.user!.role !== "admin" && authReq.user!.role !== "teacher") {
      throw new AppError(403, "FORBIDDEN", "Only faculty can access cohort analytics");
    }

    // Expert Mock Logic for Professionalization Demo
    // In a real production app, this would be an aggregation across the entire Attempt collection
    const data = {
      departments: [
        { name: "Computer Science", avgScore: 88 },
        { name: "Information Technology", avgScore: 82 },
        { name: "Electronics", avgScore: 75 },
        { name: "Mechanical", avgScore: 68 },
      ],
      trends: [
        { year: "2023", score: 65 },
        { year: "2024", score: 72 },
        { year: "2025", score: 78 },
        { year: "2026", score: 85 },
      ],
      cohorts: [
        { name: "CS-A (Final Year)", students: 64, avgViolations: 0.8, integrityScore: 98 },
        { name: "IT-B (Third Year)", students: 58, avgViolations: 1.2, integrityScore: 94 },
        { name: "EC-C (Final Year)", students: 62, avgViolations: 2.5, integrityScore: 88 },
      ]
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
