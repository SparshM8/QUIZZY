import mongoose, { Document, Schema, Types } from "mongoose";

// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
const __mongooseModel = mongoose.model.bind(mongoose);
function safeModel<T>(name: string, schema: mongoose.Schema<T>): mongoose.Model<T> {
  const existing = (mongoose as unknown as { models: Record<string, mongoose.Model<T>> }).models[name];
  if (existing) return existing;
  return __mongooseModel<T>(name, schema);
}

export interface VerificationTokenDocument extends Document {
  userId: Types.ObjectId;
  // SHA-256 hash of the raw token; the raw value is only ever shown in emails.
  tokenHash: string;
  purpose: "email_verification";
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const verificationTokenSchema = new Schema<VerificationTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    purpose: { type: String, required: true, default: "email_verification" },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

verificationTokenSchema.index({ expiresAt: 1 });

verificationTokenSchema.set("toJSON", { virtuals: true });
verificationTokenSchema.set("toObject", { virtuals: true });
verificationTokenSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const VerificationToken = safeModel<VerificationTokenDocument>("VerificationToken", verificationTokenSchema);
