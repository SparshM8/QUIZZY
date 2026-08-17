import mongoose, { Schema, Document } from "mongoose";
import { ROLES } from "../types/shared";

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

export const User = mongoose.model<UserDocument>("User", userSchema);
