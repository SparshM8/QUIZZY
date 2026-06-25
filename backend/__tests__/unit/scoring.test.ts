import mongoose from "mongoose";
import type { IQuestion } from "../../src/models/Question";
import { gradeObjectiveAnswer, scoreAttempt } from "../../src/utils/scoring";

type QuestionInput = Omit<IQuestion, "_id" | "__v" | "$isNew" | "$isDefaultPoPulated" | keyof mongoose.Document>;

function makeQuestion(overrides: Partial<QuestionInput>): IQuestion {
  const base: QuestionInput = {
    title: "Sample",
    statement: "Sample statement",
    difficulty: "easy",
    tags: [],
    type: "mcq",
    points: 1,
    options: {
      choices: [
        { id: "a", text: "One" },
        { id: "b", text: "Two" },
      ],
      answerIds: ["a"],
    },
    createdBy: new mongoose.Types.ObjectId(),
    status: "approved",
    ...overrides,
  } as QuestionInput;
  return base as unknown as IQuestion;
}

describe("gradeObjectiveAnswer", () => {
  it("awards full points for a correct MCQ answer", () => {
    const q = makeQuestion({});
    expect(gradeObjectiveAnswer(q, ["a"])).toBe(1);
  });

  it("returns 0 for a wrong MCQ answer", () => {
    const q = makeQuestion({});
    expect(gradeObjectiveAnswer(q, ["b"])).toBe(0);
  });

  it("awards points for correct fill-blank answer (case-insensitive)", () => {
    const q = makeQuestion({
      type: "fill_blank",
      points: 2,
      fill: { answers: ["Mumbai"], caseSensitive: false },
      options: undefined,
    });
    expect(gradeObjectiveAnswer(q, "mumbai")).toBe(2);
  });

  it("returns 0 for wrong fill-blank answer", () => {
    const q = makeQuestion({
      type: "fill_blank",
      points: 2,
      fill: { answers: ["Delhi"], caseSensitive: false },
      options: undefined,
    });
    expect(gradeObjectiveAnswer(q, "Mumbai")).toBe(0);
  });

  it("awards points for correct numerical answer within tolerance", () => {
    const q = makeQuestion({
      type: "numerical",
      points: 3,
      numerical: { answer: 3.14, tolerance: 0.01 },
      options: undefined,
    });
    expect(gradeObjectiveAnswer(q, 3.145)).toBe(3);
  });

  it("returns 0 for numerical answer outside tolerance", () => {
    const q = makeQuestion({
      type: "numerical",
      points: 3,
      numerical: { answer: 3.14, tolerance: 0.01 },
      options: undefined,
    });
    expect(gradeObjectiveAnswer(q, 3.2)).toBe(0);
  });

  it("returns undefined for subjective questions requiring human grading", () => {
    const q = makeQuestion({ type: "subjective", options: undefined });
    expect(gradeObjectiveAnswer(q, "any answer")).toBeUndefined();
  });

  it("returns undefined for coding questions", () => {
    const q = makeQuestion({ type: "coding", options: undefined });
    expect(gradeObjectiveAnswer(q, "console.log(1)")).toBeUndefined();
  });

  it("awards points for correct true/false answer", () => {
    const q = makeQuestion({
      type: "true_false",
      points: 1,
      options: { choices: [{ id: "t", text: "True" }, { id: "f", text: "False" }], answerIds: ["t"] },
    });
    expect(gradeObjectiveAnswer(q, ["t"])).toBe(1);
  });

  it("awards partial-free points for multi-select only when exactly correct", () => {
    const q = makeQuestion({
      type: "multi_select",
      points: 2,
      options: {
        choices: [
          { id: "a", text: "One" },
          { id: "b", text: "Two" },
          { id: "c", text: "Three" },
        ],
        answerIds: ["a", "c"],
      },
    });
    expect(gradeObjectiveAnswer(q, ["a", "c"])).toBe(2);
    expect(gradeObjectiveAnswer(q, ["a"])).toBe(0);
    expect(gradeObjectiveAnswer(q, ["a", "b"])).toBe(0);
  });
});

describe("scoreAttempt", () => {
  it("sums scores across multiple questions", () => {
    const mcq = makeQuestion({ _id: new mongoose.Types.ObjectId() } as unknown as Partial<QuestionInput>);
    const num = makeQuestion({
      _id: new mongoose.Types.ObjectId(),
      type: "numerical",
      points: 3,
      numerical: { answer: 42, tolerance: 0 },
      options: undefined,
    } as unknown as Partial<QuestionInput>);
    const questions = [mcq, num] as unknown as IQuestion[];
    const result = scoreAttempt(
      [
        { questionId: String(mcq._id), answer: ["a"] },
        { questionId: String(num._id), answer: 42 },
      ],
      questions
    );
    expect(result.totalScore).toBe(4);
    expect(result.maxPossibleScore).toBe(4);
    expect(result.answers).toHaveLength(2);
  });

  it("marks unknown question ids as ungraded with zero max", () => {
    const result = scoreAttempt([{ questionId: "unknown", answer: "x" }], []);
    expect(result.totalScore).toBe(0);
    expect(result.answers).toHaveLength(0);
  });
});
