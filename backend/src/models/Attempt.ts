import mongoose, { Document, Schema, Types } from "mongoose";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
function safeModel<T>(name: string, schema: Schema<T>): mongoose.Model<T> {
  if (mongoose.models[name]) return mongoose.models[name];
  return mongoose.model<T>(name, schema);
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
  violations: Array<{
    type: "tab_switch" | "copy_paste" | "fullscreen_exit" | "webcam_violation" | "ai_detection" | "other";
    timestamp: Date;
    details?: string;
  }>;
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
    violations: [
      {
        type: { type: String, enum: ["tab_switch", "copy_paste", "fullscreen_exit", "webcam_violation", "ai_detection", "other"], required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Core query optimization indexes
attemptSchema.index({ testId: 1, studentId: 1 });
attemptSchema.index({ studentId: 1 });
attemptSchema.index({ status: 1, submittedAt: 1 });

// High-volume violation log indexing
// We index by violation type and timestamp to allow efficient filtering and cleanup
attemptSchema.index({ "violations.type": 1, "violations.timestamp": -1 });

// Automated Data Retention Policy (TTL Index)
// In high-volume environments, we may want to auto-archive or delete old attempts
// This index will automatically remove attempts that are older than 180 days (in seconds)
// attemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
attemptSchema.set("toJSON", { virtuals: true });
attemptSchema.set("toObject", { virtuals: true });
attemptSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const Attempt = safeModel<AttemptDocument>("Attempt", attemptSchema);
