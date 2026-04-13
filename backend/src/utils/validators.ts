import { AppError } from "../middleware/errorHandler";
import type { QuestionType } from "../models/Question";

/**
 * Validates the type-specific payload of a question body. Shared by the
 * create and update question endpoints so both enforce the same rules.
 */
export function requireQuestionFields(body: Record<string, unknown>, type: QuestionType): void {
  if (type === "mcq" || type === "multi_select" || type === "true_false") {
    const options = body.options as { choices?: unknown[]; answerIds?: unknown[] } | undefined;
    if (!options || !Array.isArray(options.choices) || !Array.isArray(options.answerIds)) {
      throw new AppError(400, "VALIDATION_ERROR", `${type} questions require valid choices and answerIds`);
    }
    if (options.answerIds.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "At least one answer must be selected");
    }
    if (type === "mcq" || type === "true_false") {
      if (options.answerIds.length !== 1) {
        throw new AppError(400, "VALIDATION_ERROR", `${type} questions require exactly one answer`);
      }
    }
  } else if (type === "fill_blank") {
    const fill = body.fill as { answers?: unknown[] } | undefined;
    if (!fill || !Array.isArray(fill.answers) || fill.answers.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Fill-in-the-blank questions require at least one accepted answer");
    }
  } else if (type === "numerical") {
    const numerical = body.numerical as { answer?: unknown } | undefined;
    if (!numerical || typeof numerical.answer !== "number") {
      throw new AppError(400, "VALIDATION_ERROR", "Numerical questions require a numeric answer");
    }
  } else if (type === "coding") {
    const coding = body.coding as { starterCode?: unknown; timeLimitMs?: unknown; memoryLimitKb?: unknown } | undefined;
    if (!coding) {
      throw new AppError(400, "VALIDATION_ERROR", "Coding questions require a coding block");
    }
  }
}
