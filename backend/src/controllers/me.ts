import { Request, Response, NextFunction, RequestHandler } from "express";
import { body } from "express-validator";
import { User } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { AppError } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { audit } from "../models/AuditEvent";
import { AuthenticatedRequest } from "../middleware/auth";
import { toSafeObject } from "../utils/sanitize";

type AuthReq = AuthenticatedRequest;

async function requireUser(req: AuthReq): Promise<InstanceType<typeof User>> {
  const user = await User.findById(req.user!.sub);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  return user;
}

export const getMeController = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const user = await requireUser(req);
    res.json({ success: true, data: toSafeObject(user, ["refreshToken"]) });
  } catch (err) {
    next(err);
  }
};

export const updateMeController = [
  validate([body("name").optional().trim().isLength({ min: 2, max: 80 })]),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await requireUser(req as AuthReq);
      if (req.body.name) user.name = req.body.name;
      await user.save();
      await audit(user, "PROFILE_UPDATE");
      res.json({ success: true, data: toSafeObject(user, ["refreshToken"]) });
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
];

export const changePasswordController = [
  validate([
    body("currentPassword").isString().isLength({ min: 1, max: 128 }),
    body("newPassword").isString().isLength({ min: 8, max: 128 }),
  ]),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await requireUser(req as AuthReq);
      const ok = await verifyPassword(req.body.currentPassword, user.password);
      if (!ok) throw new AppError(400, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
      user.password = await hashPassword(req.body.newPassword);
      await user.save();
      await audit(user, "PASSWORD_CHANGE");
      res.json({ success: true, data: { message: "Password changed" } });
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
];
