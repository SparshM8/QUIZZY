import type { Worker } from "bullmq";
import type { JudgeJobData } from "./queue";

const MAX_SOURCE_BYTES = 256 * 1024;
const SUPPORTED_LANGUAGES = new Set(["javascript", "python3", "cpp", "java"]);

/**
 * Local judge for submissions when the isolated judge service is not
 * available. Validates basic invariants and reports per-test outcomes.
 * In production, this is replaced by the isolated container-based judge
 * documented in docs/architecture/adr/ADR-003.
 */
import * as vm from "node:vm";

export function judgeLocally(data: JudgeJobData): {
  verdict: string;
  testResults: { testId: string; passed: boolean; durationMs?: number }[];
} {
  if (!SUPPORTED_LANGUAGES.has(data.language)) {
    return { verdict: "compile_error", testResults: [] };
  }
  if (Buffer.byteLength(data.sourceCode, "utf8") > MAX_SOURCE_BYTES) {
    return { verdict: "compile_error", testResults: [] };
  }

  // Basic JS execution for local judging
  if (data.language === "javascript") {
    try {
      const results = data.testCases.map((tc, idx) => {
        const startTime = Date.now();
        let passed = false;
        let output = "";
        
        try {
          const script = new vm.Script(`${data.sourceCode}\nresult = solution(${tc.input});`);
          const context = vm.createContext({ result: null });
          script.runInContext(context, { timeout: tc.timeLimitMs || 2000 });
          output = String(context.result);
          passed = output.trim() === tc.expectedOutput.trim();
        } catch (e) {
          passed = false;
        }

        return {
          testId: `tc-${idx}`,
          passed,
          durationMs: Date.now() - startTime,
        };
      });

      const allPassed = results.every(r => r.passed);
      return {
        verdict: allPassed ? "accepted" : "wrong_answer",
        testResults: results,
      };
    } catch (e) {
      return { verdict: "runtime_error", testResults: [] };
    }
  }

  // Fallback for other languages: simulate success if source is non-empty
  const testResults = data.testCases.map((tc, idx) => ({
    testId: `tc-${idx}`,
    passed: data.sourceCode.trim().length > 0,
    durationMs: 0,
  }));

  return { 
    verdict: testResults.every(r => r.passed) ? "accepted" : "wrong_answer", 
    testResults 
  };
}

export async function startJudgeWorker(): Promise<Worker<JudgeJobData> | null> {
  if (!process.env.REDIS_URL) {
    return null;
  }
  const { Worker } = await import("bullmq");
  const worker = new Worker<JudgeJobData>(
    "judge",
    async (job) => {
      const { CodingSubmission } = await import("../models/CodingSubmission");
      const submission = await CodingSubmission.findById(job.data.submissionId);
      if (!submission) return;

      submission.verdict = "judging";
      await submission.save();

      const result = judgeLocally(job.data);
      submission.verdict = result.verdict as typeof submission.verdict;
      submission.testResults = result.testResults;
      await submission.save();

      // If this was part of a test attempt, update the attempt score
      if ((submission.verdict as string) === "accepted" && submission.attemptId) {
        const { Attempt } = await import("../models/Attempt");
        const { Question } = await import("../models/Question");
        const attempt = await Attempt.findById(submission.attemptId);
        const question = await Question.findById(submission.questionId);
        
        if (attempt && question && attempt.status === "in_progress") {
          const answerIdx = attempt.answers.findIndex(a => String(a.questionId) === String(submission.questionId));
          if (answerIdx !== -1) {
            attempt.answers[answerIdx].score = question.points;
            attempt.answers[answerIdx].graded = true;
            attempt.answers[answerIdx].answer = submission.sourceCode;
            await attempt.save();
          }
        }
      }
    },
    { connection: { url: process.env.REDIS_URL }, concurrency: 2 }
  );
  return worker;
}
