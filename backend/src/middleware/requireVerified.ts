import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { AppError } from "./errorHandler";
import type { AuthenticatedRequest } from "./auth";

/**
 * Blocks unverified users from writing operations (taking tests, submitting
 * answers, applying to recruitment campaigns). Reading and browsing remain
 * available so an unverified user can fix their account at any time.
 */
export function requireVerified(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) return next(new AppError(401, "MISSING_TOKEN", "Authentication required"));
  void User.findById(authReq.user.sub)
    .select("isActive isEmailVerified")
    .then((user) => {
      if (!user) return next(new AppError(401, "USER_NOT_FOUND", "Account not found"));
      if (!user.isActive) return next(new AppError(403, "ACCOUNT_DEACTIVATED", "This account has been deactivated"));
      if (!user.isEmailVerified) {
        return next(new AppError(403, "EMAIL_NOT_VERIFIED", "Please verify your email address first"));
      }
      next();
    })
    .catch(next);
}
