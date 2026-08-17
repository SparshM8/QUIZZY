import mongoose, { Document, Schema, Types } from "mongoose";
// Idempotent model registration so the serverless entrypoint can be
// re-initialized by the runtime without "Cannot overwrite model" errors.
function safeModel<T>(name: string, schema: mongoose.Schema<T>): mongoose.Model<T> {
  if (mongoose.models[name]) return mongoose.models[name];
  return mongoose.model<T>(name, schema);
}

export interface NotificationDocument extends Document {
  recipientId: Types.ObjectId;
  title: string;
  body: string;
  type: string;
  referenceType?: string;
  referenceId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true },
    type: { type: String, required: true, maxlength: 50 },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: false }
);

notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });
notificationSchema.virtual("id").get(function () {
  return this._id?.toString();
});

export const Notification = safeModel<NotificationDocument>(
  "Notification",
  notificationSchema
);
