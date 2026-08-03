import mongoose, { Document, Schema, Types } from "mongoose";

export type CampaignStatus = "draft" | "published" | "closed";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";
export type ApplicationStatus = "invited" | "started" | "completed" | "shortlisted" | "rejected";

export interface OrganizationDocument extends Document {
  name: string;
  slug: string;
  description: string;
  ownerId: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, default: "", maxlength: 500 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
organizationSchema.set("toJSON", { virtuals: true });
organizationSchema.set("toObject", { virtuals: true });
organizationSchema.virtual("id").get(function () { return this._id?.toString(); });

export interface RecruitmentCampaignDocument extends Document {
  organizationId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  description: string;
  roleTitle: string;
  skills: string[];
  testId?: Types.ObjectId;
  status: CampaignStatus;
  startsAt?: Date;
  closesAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<RecruitmentCampaignDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "", maxlength: 2000 },
    roleTitle: { type: String, required: true, trim: true, maxlength: 120 },
    skills: { type: [String], default: [] },
    testId: { type: Schema.Types.ObjectId, ref: "Test" },
    status: { type: String, enum: ["draft", "published", "closed"], default: "draft", index: true },
    startsAt: { type: Date },
    closesAt: { type: Date },
  },
  { timestamps: true }
);
campaignSchema.index({ organizationId: 1, status: 1 });
campaignSchema.set("toJSON", { virtuals: true });
campaignSchema.set("toObject", { virtuals: true });
campaignSchema.virtual("id").get(function () { return this._id?.toString(); });

export interface RecruitmentInvitationDocument extends Document {
  campaignId: Types.ObjectId;
  email: string;
  candidateId?: Types.ObjectId;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<RecruitmentInvitationDocument>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "RecruitmentCampaign", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "User" },
    token: { type: String, required: true, unique: true, select: false },
    status: { type: String, enum: ["pending", "accepted", "declined", "expired"], default: "pending" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
invitationSchema.index({ campaignId: 1, email: 1 }, { unique: true });
invitationSchema.set("toJSON", { virtuals: true });
invitationSchema.set("toObject", { virtuals: true });
invitationSchema.virtual("id").get(function () { return this._id?.toString(); });

export interface RecruitmentApplicationDocument extends Document {
  campaignId: Types.ObjectId;
  candidateId: Types.ObjectId;
  invitationId?: Types.ObjectId;
  score?: number;
  percentile?: number;
  status: ApplicationStatus;
  notes: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<RecruitmentApplicationDocument>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "RecruitmentCampaign", required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invitationId: { type: Schema.Types.ObjectId, ref: "RecruitmentInvitation" },
    score: { type: Number, min: 0 },
    percentile: { type: Number, min: 0, max: 100 },
    status: { type: String, enum: ["invited", "started", "completed", "shortlisted", "rejected"], default: "invited", index: true },
    notes: { type: String, default: "", maxlength: 2000 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);
applicationSchema.index({ campaignId: 1, candidateId: 1 }, { unique: true });
applicationSchema.set("toJSON", { virtuals: true });
applicationSchema.set("toObject", { virtuals: true });
applicationSchema.virtual("id").get(function () { return this._id?.toString(); });

export const Organization = mongoose.model<OrganizationDocument>("Organization", organizationSchema);
export const RecruitmentCampaign = mongoose.model<RecruitmentCampaignDocument>("RecruitmentCampaign", campaignSchema);
export const RecruitmentInvitation = mongoose.model<RecruitmentInvitationDocument>("RecruitmentInvitation", invitationSchema);
export const RecruitmentApplication = mongoose.model<RecruitmentApplicationDocument>("RecruitmentApplication", applicationSchema);
