import mongoose, { Document, Schema, Types } from "mongoose";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
function safeModel<T>(name: string, schema: Schema<T>): mongoose.Model<T> {
  if (mongoose.models[name]) return mongoose.models[name];
  return mongoose.model<T>(name, schema);
}

export interface RubricCriterion {
  title: string;
  maxPoints: number;
}

export interface AssignmentDocument extends Document {
  title: string;
  description: string;
  createdBy: Types.ObjectId;
  dueAt: Date;
  maxPoints: number;
  allowedFileTypes: string[];
  rubric: RubricCriterion[];
  status: "draft" | "published" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueAt: { type: Date, required: true },
    maxPoints: { type: Number, required: true, min: 1 },
    allowedFileTypes: { type: [String], default: [".pdf", ".zip", ".docx"] },
    rubric: [
      {
        title: { type: String, required: true },
        maxPoints: { type: Number, required: true, min: 0 },
      },
    ],
    status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  },
  { timestamps: true }
);

assignmentSchema.index({ status: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.set("toJSON", { virtuals: true });
assignmentSchema.set("toObject", { virtuals: true });
assignmentSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const Assignment = safeModel<AssignmentDocument>("Assignment", assignmentSchema);

export interface SubmissionDocument extends Document {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  comment?: string;
  grades: { criterion: string; points: number; note?: string }[];
  totalGrade?: number;
  gradedBy?: Types.ObjectId;
  gradedAt?: Date;
  submittedAt: Date;
}

const submissionSchema = new Schema<SubmissionDocument>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    comment: { type: String },
    grades: [
      {
        criterion: { type: String, required: true },
        points: { type: Number, required: true, min: 0 },
        note: { type: String },
      },
    ],
    totalGrade: { type: Number },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
    submittedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.set("toJSON", { virtuals: true });
submissionSchema.set("toObject", { virtuals: true });
submissionSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const Submission = safeModel<SubmissionDocument>("Submission", submissionSchema);
