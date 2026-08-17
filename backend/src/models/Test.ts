import mongoose, { Document, Schema, Types } from "mongoose";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
function safeModel<T>(name: string, schema: Schema<T>): mongoose.Model<T> {
  if (mongoose.models[name]) return mongoose.models[name];
  return mongoose.model<T>(name, schema);
}

export type TestStatus = "draft" | "published" | "in_progress" | "completed" | "cancelled";
export type EnrollmentStatus = "enrolled" | "submitted" | "exempted";

export interface TestItem {
  questionId: Types.ObjectId;
  points: number;
  order: number;
}

export interface TestDocument extends Document {
  title: string;
  description: string;
  createdBy: Types.ObjectId;
  durationMinutes: number;
  scheduledAt?: Date;
  status: TestStatus;
  scrambleQuestions: boolean;
  scrambleOptions: boolean;
  showResultsImmediately: boolean;
  maxAttempts: number;
  items: TestItem[];
  enrolledStudents: { studentId: Types.ObjectId; status: EnrollmentStatus }[];
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<TestDocument>(
  {
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
    scheduledAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "published", "in_progress", "completed", "cancelled"],
      default: "draft",
    },
    scrambleQuestions: { type: Boolean, default: false },
    scrambleOptions: { type: Boolean, default: false },
    showResultsImmediately: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 1, min: 1, max: 10 },
    items: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        points: { type: Number, required: true, min: 1 },
        order: { type: Number, required: true },
      },
    ],
    enrolledStudents: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["enrolled", "submitted", "exempted"], default: "enrolled" },
      },
    ],
  },
  { timestamps: true }
);

testSchema.index({ status: 1 });
testSchema.index({ createdBy: 1 });
testSchema.set("toJSON", { virtuals: true });
testSchema.set("toObject", { virtuals: true });
testSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const Test = safeModel<TestDocument>("Test", testSchema);
