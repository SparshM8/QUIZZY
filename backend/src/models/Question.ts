import mongoose, { Document, Schema } from "mongoose";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
const __mongooseModel = mongoose.model.bind(mongoose);
function safeModel<T>(name: string, schema: mongoose.Schema<T>): mongoose.Model<T> {
  const existing = (mongoose as unknown as { models: Record<string, mongoose.Model<T>> }).models[name];
  if (existing) return existing;
  return __mongooseModel<T>(name, schema);
}

export type QuestionType =
  | "mcq"
  | "multi_select"
  | "true_false"
  | "fill_blank"
  | "numerical"
  | "subjective"
  | "coding";

export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";

export interface McqOptions {
  choices: { id: string; text: string }[];
  answerIds: string[];
}

export interface FillOptions {
  answers: string[];
  caseSensitive?: boolean;
}

export interface NumericalOptions {
  answer: number;
  tolerance?: number;
}

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
  timeLimitMs: number;
}

export interface CodingOptions {
  starterCode: string;
  solution?: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  testCases: CodingTestCase[];
}

export interface QuestionBody {
  title: string;
  statement: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  type: QuestionType;
  points: number;
  options?: McqOptions;
  fill?: FillOptions;
  numerical?: NumericalOptions;
  coding?: CodingOptions;
  explanation?: string;
  createdBy: mongoose.Types.ObjectId;
  status: ModerationStatus;
  moderatorComment?: string;
}

export interface IQuestion extends Document, QuestionBody {
  createdAt: Date;
  updatedAt: Date;
}

const optionsSchema = new Schema<McqOptions>(
  {
    choices: [
      { id: { type: String, required: true }, text: { type: String, required: true } },
    ],
    answerIds: [{ type: String, required: true }],
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true, maxlength: 200 },
    statement: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    tags: [{ type: String, maxlength: 50 }],
    type: {
      type: String,
      enum: ["mcq", "multi_select", "true_false", "fill_blank", "numerical", "subjective", "coding"],
      required: true,
    },
    points: { type: Number, required: true, min: 1, max: 1000 },
    options: optionsSchema,
    fill: {
      type: new Schema<FillOptions>(
        {
          answers: [{ type: String, required: true }],
          caseSensitive: { type: Boolean, default: false },
        },
        { _id: false }
      ),
    },
    numerical: {
      type: new Schema<NumericalOptions>(
        {
          answer: { type: Number, required: true },
          tolerance: { type: Number, default: 0 },
        },
        { _id: false }
      ),
    },
    coding: {
      type: new Schema<CodingOptions>(
        {
          starterCode: { type: String, default: "" },
          solution: { type: String },
          timeLimitMs: { type: Number, default: 5000 },
          memoryLimitKb: { type: Number, default: 262144 },
          testCases: [
            {
              input: { type: String, required: true },
              expectedOutput: { type: String, required: true },
              timeLimitMs: { type: Number, required: true },
            },
          ],
        },
        { _id: false }
      ),
    },
    explanation: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },
    moderatorComment: { type: String },
  },
  { timestamps: true }
);

questionSchema.index({ type: 1, status: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.set("toJSON", { virtuals: true });
questionSchema.set("toObject", { virtuals: true });
questionSchema.virtual("id").get(function () { return this._id?.toString(); });

export const Question = safeModel<IQuestion>("Question", questionSchema);
