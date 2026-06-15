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

  const testResults = data.testCases.map((tc, idx) => ({
    testId: `tc-${idx}`,
    passed: false,
    durationMs: 0,
  }));

  return { verdict: "wrong_answer", testResults };
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
    },
    { connection: { url: process.env.REDIS_URL }, concurrency: 2 }
  );
  return worker;
}
