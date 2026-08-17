import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { VerificationToken } from "../models/VerificationToken";
import { AppError } from "../middleware/errorHandler";
import { audit } from "../models/AuditEvent";
import { toSafeObject } from "../utils/sanitize";
import { hashToken, generateVerificationToken, sendVerificationEmail } from "../utils/email";

/**
 * Verify an email with a raw token from the link in the verification email.
 * Tokens are single-use, hashed on storage, and expire after 24 hours.
 */
export const verifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (!raw) throw new AppError(400, "VALIDATION_ERROR", "token is required");
    const record = await VerificationToken.findOne({ tokenHash: hashToken(raw) });
    if (!record || record.used) throw new AppError(400, "INVALID_TOKEN", "Invalid or already used verification token");
    if (record.expiresAt.getTime() < Date.now()) {
      record.used = true;
      await record.save();
      throw new AppError(400, "TOKEN_EXPIRED", "Verification link has expired; request a new one");
    }
    const user = await User.findById(record.userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found");
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
      await audit(user, "EMAIL_VERIFIED");
    }
    record.used = true;
    await record.save();
    res.json({ success: true, data: { message: "Email verified", user: toSafeObject(user) } });
  } catch (err) {
    next(err);
  }
};

/**
 * Resend the verification email (rate-limited by the auth limiter).
 */
export const resendVerificationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) throw new AppError(400, "VALIDATION_ERROR", "email is required");
    const user = await User.findOne({ email });
    // Never reveal whether an email is registered — generic response either way.
    const sent = !!(user && !user.isEmailVerified && user.isActive);
    if (sent) {
      const raw = generateVerificationToken();
      await VerificationToken.create({
        userId: user._id,
        tokenHash: hashToken(raw),
        purpose: "email_verification",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await audit(user, "EMAIL_RESEND_REQUESTED");
      void sendVerificationEmail(user.name, user.email, raw);
    }
    res.json({ success: true, data: { message: "If an unverified account exists for that email, a new verification link was sent" } });
  } catch (err) {
    next(err);
  }
};
