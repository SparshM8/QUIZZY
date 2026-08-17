import mongoose, { Document, Schema, Types } from "mongoose";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
const __mongooseModel = mongoose.model.bind(mongoose);
function safeModel<T>(name: string, schema: mongoose.Schema<T>): mongoose.Model<T> {
  const existing = (mongoose as unknown as { models: Record<string, mongoose.Model<T>> }).models[name];
  if (existing) return existing;
  return __mongooseModel<T>(name, schema);
}

export type Verdict =
  | "queued"
  | "judging"
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "runtime_error"
  | "compile_error"
  | "failed";

export interface CodingSubmissionDocument extends Document {
  questionId: Types.ObjectId;
  authorId: Types.ObjectId;
  language: string;
  sourceCode: string;
  verdict: Verdict;
  testResults: { testId: string; passed: boolean; durationMs?: number }[];
  durationMs?: number;
  error?: string;
  submittedAt: Date;
}

const codingSubmissionSchema = new Schema<CodingSubmissionDocument>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    language: { type: String, required: true, maxlength: 20 },
    sourceCode: { type: String, required: true },
    verdict: {
      type: String,
      enum: ["queued", "judging", "accepted", "wrong_answer", "time_limit_exceeded", "runtime_error", "compile_error", "failed"],
      default: "queued",
    },
    testResults: [
      {
        testId: { type: String, required: true },
        passed: { type: Boolean, default: false },
        durationMs: { type: Number },
      },
    ],
    durationMs: { type: Number },
    error: { type: String },
    submittedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

codingSubmissionSchema.index({ verdict: 1, submittedAt: -1 });
codingSubmissionSchema.set("toJSON", { virtuals: true });
codingSubmissionSchema.set("toObject", { virtuals: true });
codingSubmissionSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const CodingSubmission = safeModel<CodingSubmissionDocument>(
  "CodingSubmission",
  codingSubmissionSchema
);
