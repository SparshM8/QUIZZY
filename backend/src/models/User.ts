import mongoose, { Schema, Document } from "mongoose";
import { ROLES } from "../types/shared";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
// Plain mongoose.model / mongoose.models members are used (no .bind() at
// module load) because some serverless bundler/runtime combinations crash
// on top-level .bind() invocations.
function safeModel<T>(name: string, schema: Schema<T>): mongoose.Model<T> {
  if (mongoose.models[name]) return mongoose.models[name];
  return mongoose.model<T>(name, schema);
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  refreshToken?: string;
  // Public tracking identifier, e.g. QUIZ-A7K2-M9P4. Visible to teachers and
  // administrators for reporting without exposing internal database keys.
  candidateId?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, required: true, enum: ROLES, default: "student" },
    isActive: { type: Boolean, default: true },
    avatar: { type: String },
    refreshToken: { type: String },
    candidateId: { type: String, unique: true, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
// candidateId is already indexed via `index: true` on the field above.
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });
userSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const User = safeModel<UserDocument>("User", userSchema);
