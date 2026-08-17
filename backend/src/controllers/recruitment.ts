import crypto from "crypto";
import { Types } from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import {
  Organization,
  RecruitmentApplication,
  RecruitmentCampaign,
  RecruitmentInvitation,
} from "../models/Recruitment";
import { Notification } from "../models/Notification";
import { AppError } from "../middleware/errorHandler";
import { auditAction } from "../models/AuditEvent";
import type { AuthenticatedRequest } from "../middleware/auth";
import { toSafeObject } from "../utils/sanitize";

const auth = (req: Request) => (req as unknown as AuthenticatedRequest).user!;
const canManage = (role: string) => role === "recruiter" || role === "admin";
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

async function requireOrganization(id: string, userId: string, role: string) {
  const organization = await Organization.findById(id);
  if (!organization) throw new AppError(404, "NOT_FOUND", "Organization not found");
  const member = organization.members.some((memberId) => String(memberId) === userId);
  if (role !== "admin" && String(organization.ownerId) !== userId && !member) {
    throw new AppError(403, "FORBIDDEN", "You do not manage this organization");
  }
  return organization;
}

export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    if (!canManage(user.role)) throw new AppError(403, "FORBIDDEN", "Recruiter access required");
    const { name, description = "" } = req.body as { name: string; description?: string };
    const base = slugify(name);
    const slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
    const organization = await Organization.create({ name, slug, description, ownerId: user.sub, members: [user.sub] });
    res.status(201).json({ success: true, data: toSafeObject(organization) });
  } catch (err) { next(err); }
};

export const listOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const filter = user.role === "admin" ? {} : { $or: [{ ownerId: user.sub }, { members: user.sub }] };
    const items = await Organization.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items.map((item) => toSafeObject(item)) });
  } catch (err) { next(err); }
};

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    if (!canManage(user.role)) throw new AppError(403, "FORBIDDEN", "Recruiter access required");
    const { organizationId, title, description = "", roleTitle, skills = [], testId, startsAt, closesAt } = req.body;
    await requireOrganization(organizationId, user.sub, user.role);
    const campaign = await RecruitmentCampaign.create({ organizationId, createdBy: user.sub, title, description, roleTitle, skills, testId, startsAt, closesAt });
    auditAction(user.sub, "campaign.created", String(campaign._id), "recruitment_campaigns");
    res.status(201).json({ success: true, data: toSafeObject(campaign) });
  } catch (err) { next(err); }
};

export const listCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const filter = canManage(user.role) || user.role === "admin" ? { createdBy: user.sub } : { status: "published" };
    const items = await RecruitmentCampaign.find(filter).populate("organizationId", "name slug").sort({ createdAt: -1 });
    res.json({ success: true, data: items.map((item) => toSafeObject(item)) });
  } catch (err) { next(err); }
};

export const getCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await RecruitmentCampaign.findById(req.params.id).populate("organizationId", "name slug");
    if (!campaign) throw new AppError(404, "NOT_FOUND", "Campaign not found");
    res.json({ success: true, data: toSafeObject(campaign) });
  } catch (err) { next(err); }
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const campaign = await RecruitmentCampaign.findById(req.params.id);
    if (!campaign) throw new AppError(404, "NOT_FOUND", "Campaign not found");
    if (user.role !== "admin" && String(campaign.createdBy) !== user.sub) throw new AppError(403, "FORBIDDEN", "Only the campaign owner can edit it");
    Object.assign(campaign, req.body);
    await campaign.save();
    auditAction(user.sub, "campaign.updated", String(campaign._id), "recruitment_campaigns");
    res.json({ success: true, data: toSafeObject(campaign) });
  } catch (err) { next(err); }
};

export const inviteCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const campaign = await RecruitmentCampaign.findById(req.params.id);
    if (!campaign) throw new AppError(404, "NOT_FOUND", "Campaign not found");
    if (user.role !== "admin" && String(campaign.createdBy) !== user.sub) throw new AppError(403, "FORBIDDEN", "Only the campaign owner can invite candidates");
    const emails = [...new Set((req.body.emails as string[]).map((email) => email.trim().toLowerCase()))];
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    const created = [];
    for (const email of emails) {
      const candidate = await User.findOne({ email }).select("_id");
      const invitation = await RecruitmentInvitation.create({ campaignId: campaign._id, email, candidateId: candidate?._id, token: crypto.randomBytes(24).toString("hex"), expiresAt });
      if (candidate) {
        const application = await RecruitmentApplication.findOneAndUpdate(
          { campaignId: campaign._id, candidateId: candidate._id },
          { $setOnInsert: { invitationId: invitation._id, status: "invited" } },
          { upsert: true, new: true }
        );
        await Notification.create({ recipientId: candidate._id, title: `Invitation: ${campaign.title}`, body: `You have been invited to apply for ${campaign.roleTitle}.`, type: "recruitment.invitation", referenceType: "campaign", referenceId: campaign._id });
        created.push({ invitation: toSafeObject(invitation), application: toSafeObject(application) });
      } else created.push({ invitation: toSafeObject(invitation) });
    }
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const invitation = await RecruitmentInvitation.findOne({ token: req.body.token }).select("+token");
    if (!invitation || invitation.expiresAt < new Date()) throw new AppError(404, "NOT_FOUND", "Invitation is invalid or expired");
    if (invitation.email !== user.email) throw new AppError(403, "FORBIDDEN", "This invitation belongs to another email");
    const application = await RecruitmentApplication.findOneAndUpdate(
      { campaignId: invitation.campaignId, candidateId: user.sub },
      { invitationId: invitation._id, status: "started" },
      { upsert: true, new: true }
    );
    invitation.candidateId = user.sub as unknown as typeof invitation.candidateId;
    invitation.status = "accepted";
    await invitation.save();
    auditAction(user.sub, "application.accepted", String(application._id), "recruitment_applications");
    res.json({ success: true, data: toSafeObject(application) });
  } catch (err) { next(err); }
};

export const listMyApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await RecruitmentApplication.find({ candidateId: auth(req).sub }).populate("campaignId", "title roleTitle status").sort({ updatedAt: -1 });
    res.json({ success: true, data: applications.map((item) => toSafeObject(item)) });
  } catch (err) { next(err); }
};

export const listRanking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const campaign = await RecruitmentCampaign.findById(req.params.id);
    if (!campaign) throw new AppError(404, "NOT_FOUND", "Campaign not found");
    if (user.role !== "admin" && String(campaign.createdBy) !== user.sub) throw new AppError(403, "FORBIDDEN", "Only recruiters can view ranking");
    const applications = await RecruitmentApplication.find({ campaignId: campaign._id }).populate("candidateId", "name email").sort({ score: -1, completedAt: 1 });
    res.json({ success: true, data: applications.map((application, index) => ({ rank: index + 1, ...toSafeObject(application) })) });
  } catch (err) { next(err); }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const application = await RecruitmentApplication.findById(req.params.applicationId).populate("campaignId");
    if (!application) throw new AppError(404, "NOT_FOUND", "Application not found");
    const campaign = application.campaignId as unknown as { createdBy: Types.ObjectId };
    if (user.role !== "admin" && String(campaign.createdBy) !== user.sub) throw new AppError(403, "FORBIDDEN", "Only the campaign owner can update applications");
    if (req.body.status) application.status = req.body.status;
    if (req.body.notes !== undefined) application.notes = req.body.notes;
    if (req.body.score !== undefined) application.score = Number(req.body.score);
    await application.save();
    auditAction(user.sub, "application.updated", String(application._id), "recruitment_applications", {
      status: application.status,
      score: application.score,
    });
    res.json({ success: true, data: toSafeObject(application) });
  } catch (err) { next(err); }
};
