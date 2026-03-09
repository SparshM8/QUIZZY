import mongoose, { Schema, Document, Types } from "mongoose";

export interface AuditEventDocument extends Document {
  actor: Types.ObjectId;
  target?: Types.ObjectId;
  targetCollection?: string;
  action: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const auditEventSchema = new Schema<AuditEventDocument>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    target: { type: Schema.Types.ObjectId },
    targetCollection: { type: String },
    action: { type: String, required: true, index: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditEventSchema.index({ createdAt: 1 });

export const AuditEvent = mongoose.model<AuditEventDocument>("AuditEvent", auditEventSchema);

export async function audit(
  user: { _id: Types.ObjectId },
  action: string,
  actorId?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await AuditEvent.create({
    actor: actorId ? new Types.ObjectId(actorId) : user._id,
    target: user._id,
    targetCollection: "users",
    action,
    meta,
  });
}
