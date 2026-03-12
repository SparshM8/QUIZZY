import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { issueTokenPair, tokenExpiresInMs } from "../utils/tokens";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { audit } from "../models/AuditEvent";
import { toSafeObject } from "../utils/sanitize";
import { AuthenticatedRequest } from "../middleware/auth";

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new AppError(409, "EMAIL_EXISTS", "Email already registered");
    const user = await User.create({
      name,
      email,
      password: await hashPassword(password),
      role: role ?? "student",
    });
    const tokens = issueTokenPair(String(user._id), user.email, user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    await audit(user, "AUTH_REGISTER");
    res.status(201).json({ success: true, data: { user: toSafeObject(user), ...tokens } });
  } catch (err) {
    next(err);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    const ok = await verifyPassword(password, user.password);
    if (!ok) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    const tokens = issueTokenPair(String(user._id), user.email, user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    await audit(user, "AUTH_LOGIN");
    res.json({ success: true, data: { user: toSafeObject(user), ...tokens } });
  } catch (err) {
    next(err);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError(400, "VALIDATION_ERROR", "refreshToken is required");
    const user = await User.findOne({ refreshToken });
    if (!user) throw new AppError(401, "INVALID_TOKEN", "Unknown refresh token");
    const tokens = issueTokenPair(String(user._id), user.email, user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    res.json({ success: true, data: { ...tokens, expiresAt: Date.now() + tokenExpiresInMs(env.jwtAccessExpiry) } });
  } catch (err) {
    next(err);
  }
};

export const logoutController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.sub);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
      await audit(user, "AUTH_LOGOUT");
    }
    res.json({ success: true, data: { message: "Logged out" } });
  } catch (err) {
    next(err);
  }
};
