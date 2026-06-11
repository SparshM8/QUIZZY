import type { Queue as BullQueue } from "bullmq";

export interface JudgeJobData {
  submissionId: string;
  questionId: string;
  language: string;
  sourceCode: string;
  testCases: { input: string; expectedOutput: string; timeLimitMs: number }[];
}

let queue: BullQueue<JudgeJobData> | null = null;

/**
 * Lazy-initialized BullMQ queue backed by Redis. The judge worker consumes
 * from this queue. When Redis is not configured, submissions fall back to a
 * local mock verdict so the rest of the platform remains usable during
 * development.
 */
export async function getJudgeQueue(): Promise<BullQueue<JudgeJobData>> {
  if (queue) return queue;

  if (!process.env.REDIS_URL) {
    throw new Error("Judge queue unavailable: REDIS_URL is not configured");
  }

  const { Queue } = await import("bullmq");
  queue = new Queue<JudgeJobData>("judge", {
    connection: { url: process.env.REDIS_URL },
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
  return queue;
}

export async function enqueueJudging(data: JudgeJobData): Promise<string> {
  try {
    const q = await getJudgeQueue();
    const job = await q.add("judge-submission", data);
    return job.id ?? "";
  } catch {
    return "";
  }
}
