import mongoose, { Document, Schema, Types } from "mongoose";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
const __mongooseModel = mongoose.model.bind(mongoose);
function safeModel<T>(name: string, schema: mongoose.Schema<T>): mongoose.Model<T> {
  const existing = (mongoose as unknown as { models: Record<string, mongoose.Model<T>> }).models[name];
  if (existing) return existing;
  return __mongooseModel<T>(name, schema);
}

export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted";

export interface AttemptAnswer {
  questionId: Types.ObjectId;
  order: number;
  answer: unknown;
  score?: number;
  maxScore: number;
  graded?: boolean;
}

export interface AttemptDocument extends Document {
  testId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: AttemptStatus;
  answers: AttemptAnswer[];
  startedAt: Date;
  submittedAt?: Date;
  autoSubmitted: boolean;
  lastSavedAt?: Date;
  totalScore?: number;
  maxPossibleScore: number;
  durationMinutes: number;
  attemptNumber: number;
}

const attemptSchema = new Schema<AttemptDocument>(
  {
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["in_progress", "submitted", "auto_submitted"], default: "in_progress" },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        order: { type: Number, required: true },
        answer: { type: Schema.Types.Mixed },
        score: { type: Number },
        maxScore: { type: Number, required: true },
        graded: { type: Boolean, default: false },
      },
    ],
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    autoSubmitted: { type: Boolean, default: false },
    lastSavedAt: { type: Date },
    totalScore: { type: Number },
    maxPossibleScore: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

attemptSchema.index({ testId: 1, studentId: 1 });
attemptSchema.index({ studentId: 1 });
attemptSchema.index({ status: 1, submittedAt: 1 });
attemptSchema.set("toJSON", { virtuals: true });
attemptSchema.set("toObject", { virtuals: true });
attemptSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const Attempt = safeModel<AttemptDocument>("Attempt", attemptSchema);
