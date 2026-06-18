import type { JudgeJobData } from "./queue";

export const JUDGE_QUEUE_NAME = "judge";

/**
 * Validates a judge job payload before it is enqueued. Keeps the queue
 * free of malformed jobs that would fail at the worker stage.
 */
export function validateJudgeJob(data: JudgeJobData): { valid: boolean; reason?: string } {
  if (!data.submissionId) {
    return { valid: false, reason: "submissionId is required" };
  }
  if (!data.language) {
    return { valid: false, reason: "language is required" };
  }
  if (!Array.isArray(data.testCases) || data.testCases.length === 0) {
    return { valid: false, reason: "at least one test case is required" };
  }
  for (const tc of data.testCases) {
    if (typeof tc.input !== "string") {
      return { valid: false, reason: "test case input must be a string" };
    }
    if (typeof tc.expectedOutput !== "string") {
      return { valid: false, reason: "test case expectedOutput must be a string" };
    }
    if (typeof tc.timeLimitMs !== "number" || tc.timeLimitMs <= 0) {
      return { valid: false, reason: "test case timeLimitMs must be a positive number" };
    }
  }
  return { valid: true };
}
