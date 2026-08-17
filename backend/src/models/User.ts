import mongoose, { Schema, Document } from "mongoose";
import { ROLES } from "../types/shared";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
const __mongooseModel = mongoose.model.bind(mongoose);
function safeModel<T>(name: string, schema: mongoose.Schema<T>): mongoose.Model<T> {
  const existing = (mongoose as unknown as { models: Record<string, mongoose.Model<T>> }).models[name];
  if (existing) return existing;
  return __mongooseModel<T>(name, schema);
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  refreshToken?: string;
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
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });
userSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const User = safeModel<UserDocument>("User", userSchema);
