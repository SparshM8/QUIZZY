import type { IQuestion } from "../models/Question";

/**
 * Grades an objective question answer. Returns undefined for question types
 * that require human grading (subjective, coding).
 */
export function gradeObjectiveAnswer(
  question: IQuestion,
  answer: unknown
): number | undefined {
  const type = question.type;

  if (type === "mcq" || type === "true_false" || type === "aptitude" || type === "reasoning") {
    if (!question.options) return undefined;
    const selected = Array.isArray(answer) ? answer : answer ? [answer] : [];
    const correct = question.options.answerIds;
    if (selected.length !== correct.length) return 0;
    const selectedSet = new Set(selected.map(String));
    for (const id of correct) {
      if (!selectedSet.has(String(id))) return 0;
    }
    return question.points;
  }

  if (type === "multi_select") {
    if (!question.options) return undefined;
    const selected = new Set((Array.isArray(answer) ? answer : []).map(String));
    const correct = new Set(question.options.answerIds.map(String));
    if (selected.size !== correct.size) return 0;
    for (const id of correct) {
      if (!selected.has(String(id))) return 0;
    }
    return question.points;
  }

  if (type === "fill_blank") {
    if (!question.fill) return undefined;
    const raw = typeof answer === "string" ? answer.trim() : String(answer ?? "").trim();
    const matches = question.fill.answers.some((accepted) =>
      question.fill!.caseSensitive ? raw === accepted : raw.toLowerCase() === accepted.toLowerCase()
    );
    return matches ? question.points : 0;
  }

  if (type === "numerical") {
    if (!question.numerical || typeof answer !== "number") return undefined;
    const diff = Math.abs(answer - question.numerical.answer);
    return diff <= (question.numerical.tolerance ?? 0) ? question.points : 0;
  }

  return undefined;
}

export function scoreAttempt(
  answers: { questionId: string; answer: unknown }[],
  questions: IQuestion[]
): { answers: { questionId: string; score?: number; maxScore: number; graded: boolean }[]; totalScore: number; maxPossibleScore: number } {
  const byId = new Map(questions.map((q) => [String(q._id), q]));
  const graded: { questionId: string; score?: number; maxScore: number; graded: boolean }[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const a of answers) {
    const question = byId.get(a.questionId);
    if (!question) continue;
    maxPossibleScore += question.points;
    const score = gradeObjectiveAnswer(question, a.answer);
    if (score !== undefined) {
      totalScore += score;
      graded.push({ questionId: a.questionId, score, maxScore: question.points, graded: true });
    } else {
      graded.push({ questionId: a.questionId, maxScore: question.points, graded: false });
    }
  }

  return { answers: graded, totalScore, maxPossibleScore };
}
