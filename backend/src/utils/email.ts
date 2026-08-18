import crypto from "crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

const VERIFICATION_EXPIRY_HOURS = 24;
const CANDIDATE_ID_PREFIX = "QUIZ";

// ---------------------------------------------------------------------------
// Verification tokens
// ---------------------------------------------------------------------------

/** Generate a raw (never stored) 64-character hex token for a user. */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** SHA-256 digest, matching how the raw token should be stored. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function buildVerificationLink(token: string): string {
  // Read process.env directly so a test can override PLATFORM_URL at runtime.
  const base = (process.env.PLATFORM_URL ?? env.platformUrl).trim() ||
    "https://quizzy-git-main-sparsh-mishras-projects-870ea013.vercel.app";
  return `${base.replace(/\/+$/, "")}/verify-email?token=${token}`;
}

export function verificationExpiryDate(): Date {
  return new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Candidate ID
// ---------------------------------------------------------------------------

/** Human-readable public candidate ID, e.g. QUIZ-A7K2-M9P4. */
export function generateCandidateId(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // omit 0/O/1/I/L look-alikes
  const rand = (n: number): string =>
    Array.from(crypto.randomBytes(n), (b) => alphabet[b % alphabet.length]).join("");
  return `${CANDIDATE_ID_PREFIX}-${rand(4)}-${rand(4)}`;
}

// ---------------------------------------------------------------------------
// Password strength policy
// ---------------------------------------------------------------------------

/**
 * Enforce: minimum 8 characters, at least one letter and one digit, and the
 * password must not contain the (lowercased) email local-part as a substring.
 */
export function validatePasswordStrength(password: string, email: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  const localPart = email.split("@")[0]?.toLowerCase();
  if (localPart && localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
    return "Password must not contain your email username";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sending (Brevo SMTP)
// ---------------------------------------------------------------------------

export function isEmailSendingConfigured(): boolean {
  return Boolean(env.brevoUser && env.brevoPassword && env.emailFromAddress);
}

let smtpTransport: nodemailer.Transporter | null = null;

/** Lazily create the Brevo SMTP transport (Brevo free-tier SMTP servers). */
function getTransporter(): nodemailer.Transporter {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { user: env.brevoUser, pass: env.brevoPassword },
      tls: { minVersion: "TLSv1.2" },
    });
  }
  return smtpTransport;
}

const verificationTemplate = (name: string, link: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#1a1a2e; padding:24px;">
  <h2 style="color:#4f46e5;">Welcome to QUIZZY, ${name}!</h2>
  <p>Your account was just created. To take tests, submit answers, and appear on leaderboards, please verify your email address by clicking the link below:</p>
  <p style="margin:24px 0;"><a href="${link}" style="background:#4f46e5; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">Verify my email</a></p>
  <p style="color:#666; font-size:13px;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
</body>
</html>`;

export async function sendVerificationEmail(name: string, email: string, token: string): Promise<boolean> {
  if (!isEmailSendingConfigured()) {
    logger.info("Email sending not configured (BREVO_SMTP_* env vars missing); registration completes without email");
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: env.emailFromAddress,
      to: email,
      subject: "Verify your QUIZZY email address",
      html: verificationTemplate(name, buildVerificationLink(token)),
    });
    return true;
  } catch (err) {
    // A sending failure must never block registration — log and let the user
    // recover via the resend-verification endpoint.
    logger.error("Failed to send verification email", { error: String(err) });
    return false;
  }
}
